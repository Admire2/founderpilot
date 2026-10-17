import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (!b.code) return NextResponse.json({ ok: false, error: "code required" });
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const payload = { project_code: b.code, user_email: b.email || "anonymous", suite: b.suite || "rivet", brief: b.brief || "", design_text: b.design || "", report_text: b.report || "", plan_text: b.plan || "", build_done: !!b.build, device_id: b.device || "", updated_at_et: new Date().toLocaleString("en-US", { timeZone: "America/New_York" }) };
    const { data } = await supabase.from("project_snapshots").select("id").eq("project_code", b.code).limit(1).maybeSingle();
    if (data && data.id) { await supabase.from("project_snapshots").update(payload).eq("id", data.id); }
    else { await supabase.from("project_snapshots").insert(payload); }
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false, error: e.message }); }
}
export async function GET(req: Request) {
  const u = new URL(req.url);
  const code = u.searchParams.get("code") || "";
  const email = u.searchParams.get("email") || "";
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  if (code) { const { data } = await supabase.from("project_snapshots").select("*").eq("project_code", code).limit(1).maybeSingle(); return NextResponse.json({ row: data || null }); }
  if (email) { const { data } = await supabase.from("project_snapshots").select("*").eq("user_email", email).order("id", { ascending: false }).limit(10); return NextResponse.json({ rows: data || [] }); }
  return NextResponse.json({ ok: false });
}
