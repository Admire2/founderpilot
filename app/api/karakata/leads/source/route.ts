import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const b: any = await req.json().catch(() => ({}));
    if (!b.email && !b.phone) return NextResponse.json({ ok: false, error: "email or phone required" }, { status: 400 });

    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Dedupe by email OR phone
    let existing: any = null;
    if (b.email) {
      const { data } = await sb.from("kara_leads").select("*").eq("email", b.email).limit(1);
      if (data && data.length > 0) existing = data[0];
    }
    if (!existing && b.phone) {
      const { data } = await sb.from("kara_leads").select("*").eq("phone", b.phone).limit(1);
      if (data && data.length > 0) existing = data[0];
    }

    if (existing) {
      // Re-engage dormant/lost leads automatically
      if (existing.stage === "lost" || existing.stage === "dormant") {
        await sb.from("kara_leads").update({ stage: "new", owner: "ai", next_action_at: new Date().toISOString(), next_action: "email", updated_at: new Date().toISOString() }).eq("id", existing.id);
        return NextResponse.json({ ok: true, lead_id: existing.id, status: "reactivated" });
      }
      return NextResponse.json({ ok: true, lead_id: existing.id, status: "already_exists" });
    }

    const { data: lead, error } = await sb.from("kara_leads").insert({
      name: b.name || null,
      email: b.email || null,
      phone: b.phone || null,
      source: b.source || "manual",
      stage: "new",
      owner: "ai",
      next_action: "email",
      next_action_at: new Date().toISOString(),
      context: b.context || {},
      deal_value_usd: Number(b.deal_value_usd) || 0
    }).select().single();

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, lead_id: lead.id, status: "created" });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e.message) }, { status: 500 });
  }
}