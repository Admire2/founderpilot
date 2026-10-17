import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const b: any = await req.json().catch(() => ({}));
    const targets: any[] = Array.isArray(b.targets) ? b.targets : [];
    if (targets.length === 0) return NextResponse.json({ ok: false, error: "targets required: [{phone, name, context}]" }, { status: 400 });

    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const campaign = String(b.campaign || "outbound");

    const { data: camp } = await sb.from("kara_call_campaigns").insert({
      name: String(b.name || campaign),
      purpose: String(b.purpose || ""),
      status: "running",
      targets: targets
    }).select().single();

    const results: any[] = [];
    const vapiKey = process.env.VAPI_API_KEY;
    const phoneId = process.env.VAPI_PHONE_ID;
    const assistantId = process.env.VAPI_ASSISTANT_ID;

    for (const t of targets) {
      const callRow: any = { direction: "outbound", phone_number: String(t.phone || ""), campaign: campaign, status: "queued", context: t.context || {} };

      if (vapiKey && phoneId && assistantId) {
        try {
          const r = await fetch("https://api.vapi.ai/call", {
            method: "POST",
            headers: { Authorization: "Bearer " + vapiKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              phoneNumberId: phoneId,
              assistantId: assistantId,
              customer: { number: String(t.phone || "") },
              assistantOverrides: { variableValues: { context: JSON.stringify(t.context || {}) } }
            })
          });
          const j: any = await r.json().catch(() => ({}));
          callRow.provider_call_id = String(j.id || "");
          callRow.status = r.ok ? "ringing" : "failed";
          results.push({ phone: t.phone, ok: r.ok, callId: j.id || null });
        } catch (e: any) {
          callRow.status = "failed";
          results.push({ phone: t.phone, ok: false, error: e.message });
        }
      } else {
        callRow.status = "queued_no_provider";
        results.push({ phone: t.phone, ok: true, queued: true, note: "VAPI_API_KEY not set - call logged but not dialed" });
      }

      await sb.from("kara_calls").insert(callRow);
    }

    await sb.from("kara_call_campaigns").update({ status: "completed", results: results }).eq("id", (camp as any).id);
    return NextResponse.json({ ok: true, campaign_id: (camp as any).id, results: results });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e.message) }, { status: 500 });
  }
}