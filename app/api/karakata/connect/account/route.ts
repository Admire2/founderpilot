import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const email = new URL(req.url).searchParams.get("email") || "";
    if (!email) return NextResponse.json({ ok: false, error: "email required" }, { status: 400 });
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const { data: seller } = await sb.from("kara_sellers").select("*").eq("email", email.toLowerCase()).single();
    if (!seller) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
    return NextResponse.json({
      ok: true,
      stripe_account: seller.stripe_account,
      charges_enabled: !!seller.stripe_charges_enabled,
      payouts_enabled: !!seller.stripe_payouts_enabled,
      shop_name: seller.shop_name
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String((e && e.message) || e) }, { status: 500 });
  }
}
