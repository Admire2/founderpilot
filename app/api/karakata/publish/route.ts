import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const email = String(b.email || "").toLowerCase();
    if (!email || !b.title) return NextResponse.json({ ok: false, error: "Login and title required." }, { status: 400 });
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    let { data: sRows } = await sb.from("sellers").select("*").eq("email", email).limit(1); let seller: any = (sRows && sRows[0]) || null;
    if (!seller) {
      const ins = await sb.from("sellers").insert({ email: email, shop_name: email.split("@")[0], category: b.category || "Artisan Services", status: "active" }).select().single();
      seller = ins.data;
    }
    const { error } = await sb.from("kara_listings").insert({ seller_id: seller.id, title: b.title, category: b.category, description: b.description, image_url: b.image_url || null, price_usd: Number(b.price_usd) || 0, lead_time_days: Number(b.lead_time_days) || 7, occasion: b.occasion || "Everyday", status: "active" });
    if (error) return NextResponse.json({ ok: false, error: String(error.message) }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false, error: String((e && e.message) || e) }, { status: 500 }); }
}
