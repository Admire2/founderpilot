import { NextResponse } from "next/server";
import Stripe from "stripe";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const priceId = String(b.priceId || "");
    if (!priceId) return NextResponse.json({ error: "missing priceId" }, { status: 400 });
    const key = process.env.STRIPE_SECRET_KEY || "";
    if (!key) return NextResponse.json({ error: "missing Stripe key" }, { status: 500 });
    const stripe = new Stripe(key);
    const price: any = await stripe.prices.retrieve(priceId);
    const recurring = !!price.recurring;
    const site = process.env.NEXT_PUBLIC_SITE_URL || "https://founderpilot-theta.vercel.app";
    const session = await stripe.checkout.sessions.create({
      mode: recurring ? "subscription" : "payment",
      customer_email: String(b.email || "").toLowerCase() || undefined,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: site + "/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: site + "/pricing",
      metadata: { pack: String(b.pack || (recurring ? "subscription" : "pack")), credits: String(b.credits || 0) }
    });
    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: String((e && e.message) || e) }, { status: 500 });
  }
}
