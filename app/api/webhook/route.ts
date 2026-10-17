import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const raw = await req.text();
  let event: Stripe.Event | null = null;
  const secret = process.env.STRIPE_WEBHOOK_SECRET || "";
  const ts = process.env.STRIPE_WEBHOOK_SECRET_TEST || "";
  const sig = req.headers.get("stripe-signature") || "";

  if ((secret || ts) && sig && process.env.STRIPE_SECRET_KEY) {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    try {
      event = stripe.webhooks.constructEvent(raw, sig, secret || ts);
    } catch (e1) {
      if (ts) {
        try { event = stripe.webhooks.constructEvent(raw, sig, ts); } catch (e2) {
          return NextResponse.json({ ok: false, error: "signature verification failed" }, { status: 400 });
        }
      } else {
        return NextResponse.json({ ok: false, error: "signature verification failed" }, { status: 400 });
      }
    }
  } else {
    try { event = JSON.parse(raw); } catch (e) { return NextResponse.json({ ok: true, ignored: "unparseable" }); }
  }

  if (!event) return NextResponse.json({ ok: true, ignored: "no event" });

  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  const type = event.type;
  const obj = event.data.object as any;

  // 1. BLACKBOX LOGGER (independent try/catch)
  try { await sb.from("stripe_events").insert({ id: event.id, type: type, data: obj }); } catch (e) { console.error("BLACKBOX INSERT FAILED:", e); }

  // 2. CREDITS (independent try/catch)
  if (type === "checkout.session.completed") { try {
    const s0: any = event.data.object;
    const oid0 = Number(s0.metadata && s0.metadata.order_id);
    if (oid0) {
      const od0: any = await sb.from("kara_orders").select("*").eq("id", oid0).single();
      const em0 = String((od0 && od0.data && od0.data.buyer_email) || s0.customer_email || "");
      if (em0) {
        const code0 = String((od0 && od0.data && od0.data.code) || ("#" + oid0));
        const tot0 = ((Number(s0.amount_total) || 0) / 100).toFixed(2);
        await sb.from("kara_emails").insert({
          email: em0,
          kind: "order_confirm",
          subject: "KaraKata order " + code0 + " confirmed - payment received",
          body: '<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h2 style="color:#0f766e">We saw your purchase - order ' + code0 + '</h2><p>Hi, we received your payment of <b>$' + tot0 + '</b>. It is held in ESCROW until you confirm delivery - the seller sees it but cannot touch it early.</p><p><b>Did not make this purchase?</b> Reply to this email or open a dispute via Contact & Support within 24 hours - we will reverse the payment and investigate.</p><p>- Tunde, KaraKata Order Agent<br/>FounderPilot AI</p></div>',
          status: "queued",
          send_at: new Date().toISOString()
        });
      }
    }
  } catch (e) {}
    try {
      const email = String((obj.metadata && obj.metadata.email) || (obj.customer_details && obj.customer_details.email) || "").toLowerCase();
      const credits = Number((obj.metadata && obj.metadata.credits) || 0);
      if (email && credits > 0) {
        const { data } = await sb.from("credits").select("*").eq("email", email).single();
        if (data) await sb.from("credits").update({ pack_balance: Number(data.pack_balance || 0) + credits }).eq("email", email);
        else await sb.from("credits").insert({ email: email, balance: 0, pack_balance: credits, plan: "free" });
      }
    } catch (e) {}
  }

  // 3. SUBSCRIPTIONS (independent try/catch)
      {
      const oid = Number((obj.metadata && obj.metadata.order_id) || 0);
      if (oid) { try { await sb.from("kara_orders").update({ stripe_payment_intent: String(obj.payment_intent || ""), status: "paid", payout_status: "pending_delivery" }).eq("id", oid); } catch (e) {} }
    }
    if (type === "customer.subscription.created" || type === "customer.subscription.updated" || type === "customer.subscription.deleted") {
    try {
      const email = String((obj.metadata && obj.metadata.email) || "").toLowerCase();
      const plan = type === "customer.subscription.deleted" ? "free" : String((obj.metadata && obj.metadata.plan) || "");
      if (email && plan) await sb.from("credits").update({ plan: plan, last_refresh: new Date().toISOString() }).eq("email", email);
    } catch (e) {}
  }

  // 4. AFFILIATE TRANSFERS (independent try/catch)
  if (type === "transfer.created" || type === "payout.paid") {
    try {
      const affId = obj.metadata?.affiliate_id || obj.destination;
      const amount = obj.amount;
      if (affId) {
        await sb.from("affiliates").update({ payout_status: "paid", last_payout: new Date().toISOString() }).eq("stripe_account", affId);
        await sb.from("affiliate_payouts").insert({ affiliate_stripe_id: affId, amount: amount, status: "paid", stripe_event_id: event.id });
      }
    } catch (e) {}
  }

  // 5. AFFILIATE ACCOUNT UPDATES (independent try/catch)
        // Forward account.updated to Bose agent
      try {
        const base = process.env.VERCEL_URL ? ("https://" + process.env.VERCEL_URL) : "https://founderpilot-theta.vercel.app";
        await fetch(base + "/api/karakata/bose", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "account_updated", account: obj.id, charges_enabled: obj.charges_enabled, payouts_enabled: obj.payouts_enabled })
        });
      } catch (e) {}
    if (type === "account.updated") {
    try {
      await sb.from("affiliates").update({ charges_enabled: obj.charges_enabled, payouts_enabled: obj.payouts_enabled }).eq("stripe_account", obj.id);
    } catch (e) {}
  }

  // 6. ALWAYS RETURN 200 — never let a DB hiccup surface to Stripe
  return NextResponse.json({ ok: true, received: type });
}
