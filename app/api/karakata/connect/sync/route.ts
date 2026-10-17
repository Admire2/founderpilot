import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
    let acctId = String(b.stripe_account || "");
    const email = String(b.email || "").toLowerCase();
    if (!acctId && email) {
      const r = await sb.from("kara_sellers").select("*").eq("email", email).single();
      acctId = String(r.data?.stripe_account || "");
    }
    if (!acctId) return NextResponse.json({ ok: false, error: "No stripe_account found" }, { status: 400 });
    const acct = await stripe.accounts.retrieve(acctId);
    const charges = !!acct.charges_enabled;
    const payouts = !!acct.payouts_enabled;
    const patch = { stripe_account: acctId, stripe_charges_enabled: charges, stripe_payouts_enabled: payouts };
    await sb.from("kara_sellers").update(patch).eq("stripe_account", acctId);
    if (email) await sb.from("kara_sellers").update(patch).eq("email", email);
    return NextResponse.json({ ok: true, charges_enabled: charges, payouts_enabled: payouts, currently_due: acct.requirements?.currently_due || [] });
  } catch (e: any) { return NextResponse.json({ ok: false, error: String(e?.message || e) }, { status: 500 }); }
}
