import { NextResponse } from "next/server";
import Stripe from "stripe";
export const dynamic = "force-dynamic";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_live_unconfigured");

async function handler(req: Request) {
  try {
    let email = "";
    if (req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      email = String(b.email || "").toLowerCase();
    } else {
      email = (new URL(req.url).searchParams.get("email") || "").toLowerCase();
    }
    if (!email) return NextResponse.json({ ok: false, error: "Log in first, then try Manage Subscription." }, { status: 401 });

    // 1) Find the Stripe customer by email (works even if local DB has no row)
    const cust = await stripe.customers.list({ email, limit: 1 });
    if (!cust.data.length) {
      return NextResponse.json({ ok: false, error: "No subscription on this account yet - you are on one-time credits, and those never expire. Pick a monthly plan above if you want the portal." }, { status: 404 });
    }

    // 2) Any ACTIVE subscription in Stripe?
    const subs = await stripe.subscriptions.list({ customer: cust.data[0].id, status: "active" });
    if (!subs.data.length) {
      return NextResponse.json({ ok: false, error: "No ACTIVE subscription found - your pack credits never expire and need no management. Subscribe to a monthly plan above to activate portal access." }, { status: 404 });
    }

    // 3) Open the real Stripe Billing Portal (update card, cancel, invoices)
    const portal = await stripe.billingPortal.sessions.create({
      customer: cust.data[0].id,
      return_url: "https://founderpilot-theta.vercel.app/pricing"
    });
    return NextResponse.json({ ok: true, url: portal.url });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String((e && e.message) || e) }, { status: 500 });
  }
}
export async function POST(req: Request) { return handler(req); }
export async function GET(req: Request) { return handler(req); }
