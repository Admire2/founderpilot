import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const now = new Date().toISOString();

  // Pull next 10 actions for AI (oldest first, by engagement score desc)
  const { data, error } = await sb.from("kara_leads")
    .select("*")
    .eq("owner", "ai")
    .not("stage", "in", '("contract_signed","lost")')
    .lte("next_action_at", now)
    .order("engagement_score", { ascending: false })
    .order("next_action_at", { ascending: true })
    .limit(10);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, queue: data || [], count: (data || []).length });
}

// Log a touch + advance the lead (called after every call/email/sms)
export async function POST(req: Request) {
  try {
    const b: any = await req.json().catch(() => ({}));
    const leadId = Number(b.lead_id || 0);
    if (!leadId) return NextResponse.json({ ok: false, error: "lead_id required" }, { status: 400 });

    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: lead } = await sb.from("kara_leads").select("*").eq("id", leadId).single();
    if (!lead) return NextResponse.json({ ok: false, error: "lead not found" }, { status: 404 });

    // Log touch
    await sb.from("kara_lead_touches").insert({
      lead_id: leadId,
      channel: String(b.channel || "call"),
      direction: String(b.direction || "outbound"),
      outcome: String(b.outcome || ""),
      content: String(b.content || "")
    });

    // Stage progression rules
    let newStage = lead.stage;
    let nextAction = "wait";
    let nextAt = new Date(Date.now() + 3 * 86400000); // default: 3 days

    const outcome = String(b.outcome || "").toLowerCase();
    const touches = Number(lead.ai_touches || 0) + 1;

    if (outcome.includes("contract") || outcome.includes("signed") || outcome.includes("deal_closed")) {
      newStage = "contract_signed";
      // Boost funding score
      await sb.rpc && false; // placeholder
    } else if (outcome.includes("warm") || outcome.includes("interested") || outcome.includes("qualified")) {
      newStage = lead.stage === "new" ? "contacted" : "qualified";
      nextAction = "call";
      nextAt = new Date(Date.now() + 86400000); // tomorrow
    } else if (outcome.includes("negotiat") || outcome.includes("price")) {
      newStage = "negotiation";
      nextAction = Number(lead.deal_value_usd) > Number(process.env.HUMAN_HANDOFF_THRESHOLD_USD || 5000) ? "handoff" : "call";
      nextAt = new Date(Date.now() + 12 * 3600000); // 12 hours
    } else if (outcome.includes("not interested") || outcome.includes("do not call")) {
      newStage = "lost";
    } else if (outcome.includes("no answer") || outcome.includes("voicemail")) {
      nextAction = touches < 3 ? "call" : "email";
      nextAt = new Date(Date.now() + touches * 86400000);
    } else {
      nextAction = "email";
      nextAt = new Date(Date.now() + 2 * 86400000);
    }

    // Update lead
    const update: any = {
      stage: newStage,
      last_contacted_at: new Date().toISOString(),
      next_action: nextAction,
      next_action_at: nextAt.toISOString(),
      ai_touches: touches,
      updated_at: new Date().toISOString()
    };
    if (b.deal_value_usd) update.deal_value_usd = Number(b.deal_value_usd);
    if (b.deal_terms) update.deal_terms = b.deal_terms;

    await sb.from("kara_leads").update(update).eq("id", leadId);

    return NextResponse.json({ ok: true, lead_id: leadId, new_stage: newStage, next_action: nextAction, next_action_at: nextAt });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e.message) }, { status: 500 });
  }
}