import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const b: any = await req.json().catch(() => ({}));
    const callId = Number(b.call_id || 0);
    if (!callId) return NextResponse.json({ ok: false, error: "call_id required" }, { status: 400 });

    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: call } = await sb.from("kara_calls").select("*").eq("id", callId).single();
    if (!call) return NextResponse.json({ ok: false, error: "call not found" }, { status: 404 });

    // Qwen summarizes the call into a human-ready briefing
    const summaryPrompt = "You are briefing a human sales closer. From this AI-sales-rep call transcript, produce JSON: {\"ai_summary\": string (3 sentences), \"deal_terms\": object (price, conditions, timeline, commitments), \"sentiment\": string, \"recommended_opening\": string (exact first sentence the human should say)}. Transcript: " + String(call.transcript || "");

    let briefing: any = { ai_summary: "", deal_terms: (call.action_taken && call.action_taken.details) || {}, sentiment: "neutral", recommended_opening: "Hello, following up on your conversation with Kara." };

    const tries: any[] = [];
    if (process.env.QWEN_API_KEY && process.env.QWEN_API_URL) tries.push({ url: process.env.QWEN_API_URL, key: process.env.QWEN_API_KEY, model: process.env.QWEN_MODEL || "qwen-plus" });
    if (process.env.DEEPSEEK_API_KEY) tries.push({ url: "https://api.deepseek.com/chat/completions", key: process.env.DEEPSEEK_API_KEY, model: "deepseek-chat" });

    for (const t of tries) {
      try {
        const r = await fetch(t.url, { method: "POST", headers: { Authorization: "Bearer " + t.key, "Content-Type": "application/json" }, body: JSON.stringify({ model: t.model, temperature: 0.3, messages: [{ role: "user", content: summaryPrompt }] }) });
        if (!r.ok) continue;
        const j: any = await r.json();
        const text = String((j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || "");
        const s = text.indexOf("{"); const e = text.lastIndexOf("}");
        if (s >= 0 && e > s) { briefing = JSON.parse(text.slice(s, e + 1)); break; }
      } catch {}
    }

    const { data: handoff, error } = await sb.from("kara_handoffs").insert({
      call_id: callId,
      seller_phone: call.phone_number,
      seller_name: String((call.context && call.context.name) || ""),
      handoff_type: String(b.handoff_type || "post_call"),
      priority: String(b.priority || "normal"),
      deal_terms: briefing.deal_terms || {},
      transcript: call.transcript,
      ai_summary: briefing.ai_summary,
      sentiment: briefing.sentiment,
      recommended_opening: briefing.recommended_opening,
      status: "pending"
    }).select().single();

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, handoff: handoff });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e.message) }, { status: 500 });
  }
}