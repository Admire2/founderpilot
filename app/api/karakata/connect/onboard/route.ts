import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const email = String(b.email || "").toLowerCase();
    
    if (!email || !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ ok: false, error: "Email and Stripe key required" }, { status: 400 });
    }
    
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const { data: seller } = await sb.from("sellers").select("*").eq("email", email).single();
    if (!seller) {
      return NextResponse.json({ ok: false, error: "Register as a seller first" }, { status: 404 });
    }

    let acctId = seller.stripe_account;
    if (!acctId) {
      const acct = await stripe.accounts.create({
        type: "express",
        email: email,
        capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
        metadata: { kara_seller_id: String(seller.id), shop_name: seller.shop_name }
      });
      acctId = acct.id;
      await sb.from("sellers").update({ stripe_account: acctId }).eq("id", seller.id);
    }

    const origin = req.headers.get("origin") || "https://founderpilot-theta.vercel.app";
    
    const link = await stripe.accountLinks.create({
      account: acctId,
      refresh_url: `${origin}/karakata/sellercenter?connect=refresh`,
      return_url: `${origin}/karakata/sellercenter?connect=done`,
      type: "account_onboarding"
    });
    
    return NextResponse.json({ ok: true, url: link.url, account: acctId });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 });
  }
}
