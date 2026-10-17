import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await sb
    .from("kara_handoffs")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const now = Date.now();
  const enriched = (data || []).map((h: any) => {
    const ageHours = (now - new Date(h.created_at).getTime()) / 3600000;
    return { ...h, age_hours: Math.round(ageHours * 10) / 10, sla_breached: ageHours > Number(h.sla_hours || 24) };
  });

  return NextResponse.json({ ok: true, queue: enriched, count: enriched.length });
}

export async function POST(req: Request) {
  // Assign a handoff to a human: { handoff_id, assigned_to }
  const b: any = await req.json().catch(() => ({}));
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data, error } = await sb.from("kara_handoffs")
    .update({ status: "assigned", assigned_to: String(b.assigned_to || "") })
    .eq("id", Number(b.handoff_id || 0))
    .select().single();
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, handoff: data });
}