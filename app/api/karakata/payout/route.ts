import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const orderId = Number(b.order_id);
    if (!orderId || !process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ ok: false, error: "order_id and Stripe key required" }, { status: 400 });
    }
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    const { data: order } = await sb.from("kara_orders")
      .select("*")
      .eq("id", orderId).single();
    if (!order) return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });

    let seller: any = (order as any).kara_sellers; if (!seller && (order as any).seller_id) { const sr2: any = await sb.from("kara_sellers").select("*").eq("id", (order as any).seller_id).single(); seller = sr2.data; }
    if (!seller || !seller.stripe_account) {
      return NextResponse.json({ ok: false, error: "Seller has no Stripe Connect account" }, { status: 400 });
    }
    if (!seller.stripe_payouts_enabled) {
      return NextResponse.json({ ok: false, error: "Seller payouts not enabled yet" }, { status: 409 });
    }
    const totUsd = Number(order.total_usd || 0) > 0 ? Number(order.total_usd) : Number(order.total || 0); order.total_usd = totUsd; order.total = totUsd; if (order.stripe_transfer) {
      return NextResponse.json({ ok: true, already_paid: true, transfer: order.stripe_transfer });
    }

    const sellerCreatedAt = seller.created_at ? new Date(seller.created_at).getTime() : 0;
    const foundingMonths = 6;
    const isFounding = (Date.now() - sellerCreatedAt) < foundingMonths * 30 * 86400000;
    const feePct = isFounding ? 0 : 8;
    const totalCents = Math.round(Number(order.total || 0) * 100);
    const feeCents = Math.round(totalCents * feePct / 100);
    const sellerCents = totalCents - feeCents;

    let transferId: string | null = null;
    let pi: any = order.stripe_payment_intent; if (!pi) { try { const ss: any = await stripe.checkout.sessions.list({ limit: 5, metadata: { order_id: String(orderId) } } as any); const s0 = ss && ss.data && ss.data[0]; if (s0 && s0.payment_intent) { pi = String(s0.payment_intent); order.stripe_payment_intent = pi; await sb.from("kara_orders").update({ stripe_payment_intent: pi }).eq("id", orderId); } } catch (e) {} } if (pi && sellerCents > 0) {
      try {
        const tr = await stripe.transfers.create({
          amount: sellerCents,
          currency: "usd",
          destination: seller.stripe_account,
          transfer_group: "order_" + orderId,
          metadata: { order_id: String(orderId), fee_pct: String(feePct), founding: String(isFounding) }
        });
        transferId = tr.id;
      } catch (e: any) {
        await sb.from("kara_emails").insert({
          email: seller.email, kind: "bose_payout_failed",
          subject: "Payout pending for order #" + orderId,
          body: "<p>Hi " + seller.shop_name + ", Bose here. Your payout for order #" + orderId + " could not be sent yet — the buyer's payment may still be processing. We will retry automatically.</p>",
          status: "queued", send_at: new Date().toISOString()
        });
        return NextResponse.json({ ok: false, error: String(e.message) }, { status: 500 });
      }
    }

    await sb.from("kara_orders").update({
      stripe_transfer: transferId,
      payout_status: transferId ? "paid" : "pending_payment",
      application_fee: feeCents / 100
    }).eq("id", orderId);

    if (transferId && seller.email) {
      await sb.from("kara_emails").insert({
        email: seller.email, kind: "bose_payout_landed",
        subject: seller.shop_name + ", $" + (sellerCents / 100).toFixed(2) + " just landed in your bank",
        body: "<div style='font-family:Arial,sans-serif;max-width:600px;margin:auto'>" +
          "<h2 style='color:#0f766e'>💰 Payout landed</h2>" +
          "<p>Order #" + orderId + " · $" + (totalCents / 100).toFixed(2) + " sale</p>" +
          "<p><b>Fee:</b> " + feePct + "% (" + (isFounding ? "Founding seller — 0% applied" : "Post-founding — 8% applied") + ")</p>" +
          "<p><b>To your bank:</b> $" + (sellerCents / 100).toFixed(2) + " (Transfer " + transferId + ")</p>" +
          "<p>Stripe typically settles to your linked bank in 1-2 business days.</p>" +
          "<p>- Bose, KaraKata Payout Agent<br/>FounderPilot AI</p></div>",
        status: "queued", send_at: new Date().toISOString()
      });
    }

    return NextResponse.json({ ok: true, transfer: transferId, fee_pct: feePct, seller_got: sellerCents / 100 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String((e && e.message) || e) }, { status: 500 });
  }
}
