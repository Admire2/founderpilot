import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const queueRes = await fetch(new URL("/api/karakata/leads/next-action", "https://founderpilot-theta.vercel.app"), { method: "GET" });
  const q: any = await queueRes.json();
  const leads: any[] = (q && q.queue) || [];
  const results: any[] = [];

  for (const lead of leads) {
    try {
      if (lead.next_action === "call" && lead.phone) {
        const r = await fetch(new URL("/api/karakata/phone/outbound", "https://founderpilot-theta.vercel.app"), {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ campaign: "lead_nurture", targets: [{ phone: lead.phone, name: lead.name, context: { lead_id: lead.id, name: lead.name, stage: lead.stage, last_touch: lead.last_contacted_at } }] })
        });
        results.push({ lead_id: lead.id, action: "called", ok: r.ok });
      } else if (lead.next_action === "email" && lead.email) {
        // Future: plug into Tunde email cascade
        results.push({ lead_id: lead.id, action: "email_queued" });
      } else if (lead.next_action === "handoff") {
        // Find the last call on this lead and trigger handoff
        const { data: lastCall } = await sb.from("kara_calls").select("id").eq("phone_number", lead.phone).order("id", { ascending: false }).limit(1);
        if (lastCall && lastCall[0]) {
          await fetch(new URL("/api/karakata/phone/handoff", "https://founderpilot-theta.vercel.app"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ call_id: lastCall[0].id, handoff_type: "warm_transfer", priority: "normal" }) });
          results.push({ lead_id: lead.id, action: "handoff_created" });
        }
      } else {
        results.push({ lead_id: lead.id, action: "wait" });
      }
    } catch (e: any) {
      results.push({ lead_id: lead.id, action: "error", error: e.message });
    }
  }
  return NextResponse.json({ ok: true, processed: results.length, results });
}