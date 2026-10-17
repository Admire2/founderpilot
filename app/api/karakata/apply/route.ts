import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const b = await req.json();
  if (!b.shop_name || !b.email) return NextResponse.json({ ok: false, error: "Shop name and email required." }, { status: 400 });
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  const { error } = await sb.from("kara_sellers").upsert({ email: String(b.email || "").toLowerCase(), shop_name: b.shop_name, category: b.category, country: b.country || null, city: b.city || null, craft: b.craft || null, portfolio_links: b.links || null, phone: b.phone || null, whatsapp: b.whatsapp || null }, { onConflict: "email" });
  if (error) return NextResponse.json({ ok: false, error: String(error.message) }, { status: 500 });
  return NextResponse.json({ ok: true });
}
