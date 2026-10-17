import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    await supabase.from("orders").insert({ user_email: b.email || "anonymous", partner_name: b.partner || "", item_key: b.item || "", qty: b.qty || 1, status: "requested" });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false }); }
}
export async function GET(req: Request) {
  const u = new URL(req.url);
  const em = u.searchParams.get("e") || "";
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data } = await supabase.from("orders").select("*").eq("user_email", em).order("id", { ascending: false }).limit(50);
  return NextResponse.json({ rows: data || [] });
}
