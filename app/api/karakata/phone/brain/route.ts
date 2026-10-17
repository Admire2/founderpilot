import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const b: any = await req.json().catch(() => ({}));
    const mode = String(b.mode || "inbound");
    const transcript = String(b.transcript || "");
    const context = b.context || {};

    const SALES_PROMPT = "You are Kara, an AI sales representative for KaraKata calling a seller about their property or business listing. Context: " + JSON.stringify(context) + ". Your job: build rapport, collect property/business details (location, condition, documents), discover price expectations, negotiate within the mandate given in context, and reach a preliminary agreement. Speak the seller's language (English, Pidgin, Yoruba, Hausa, Igbo). HANDOFF RULES: (a) if the seller explicitly asks for a human, or the deal value exceeds the threshold in context, use action warm_transfer; (b) when a preliminary agreement is reached, summarize the agreed terms aloud, confirm them, then use action close_and_handoff with the terms in details. ALWAYS end with JSON: {\"action\":\"none|continue_negotiation|warm_transfer|close_and_handoff|not_interested|call_back_later\",\"details\":{\"price\":...,\"conditions\":[...],\"timeline\":...,\"commitments\":[...]}}";
const systemPrompt = mode === "sales_rep" ? SALES_PROMPT : mode === "inbound"
      ? "You are Kara, the AI phone receptionist for a KaraKata service provider. Business context: " + JSON.stringify(context) + ". Answer politely in the caller's language (English, Pidgin, Yoruba, Hausa, Igbo). Quote prices only from context, book appointments, take orders, take messages. Keep replies under 30 seconds of speech. ALWAYS end with a JSON block: {\"action\":\"none|book_appointment|take_order|quote_price|take_message|transfer_to_human\",\"details\":{}}"
      : "You are Kara, calling on behalf of KaraKata about an upcoming program. Context: " + JSON.stringify(context) + ". The person registered but never clicked the confirmation email or forgot the event. Warmly remind them of the date/time, confirm attendance, answer questions, offer to resend the link by SMS. Keep it under 45 seconds of speech. ALWAYS end with a JSON block: {\"action\":\"none|confirmed|reschedule|not_interested|call_back_later|send_sms_link\",\"details\":{}}";

    const tries: any[] = [];
    if (process.env.QWEN_API_KEY && process.env.QWEN_API_URL) tries.push({ url: process.env.QWEN_API_URL, key: process.env.QWEN_API_KEY, model: process.env.QWEN_MODEL || "qwen-plus" });
    if (process.env.DEEPSEEK_API_KEY) tries.push({ url: "https://api.deepseek.com/chat/completions", key: process.env.DEEPSEEK_API_KEY, model: "deepseek-chat" });
    if (process.env.GLM_API_KEY) tries.push({ url: process.env.GLM_URL || "https://api.z.ai/api/paas/v4/chat/completions", key: process.env.GLM_API_KEY, model: process.env.GLM_MODEL || "glm-5.3-flash" });

    for (const t of tries) {
      try {
        const r = await fetch(t.url, {
          method: "POST",
          headers: { Authorization: "Bearer " + t.key, "Content-Type": "application/json" },
          body: JSON.stringify({ model: t.model, temperature: 0.4, messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: transcript }
          ]})
        });
        if (!r.ok) continue;
        const j: any = await r.json();
        const text = String((j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || "");
        if (!text) continue;
        const s = text.lastIndexOf("{");
        const e = text.lastIndexOf("}");
        let action: any = { action: "none", details: {} };
        if (s >= 0 && e > s) { try { action = JSON.parse(text.slice(s, e + 1)); } catch {} }
        return NextResponse.json({ ok: true, reply: text, action: action, model: t.model });
      } catch {}
    }
    return NextResponse.json({ ok: false, error: "all brains unavailable" }, { status: 502 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e.message) }, { status: 500 });
  }
}