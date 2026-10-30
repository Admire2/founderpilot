import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order_id, action, admin_note, admin_email } = body;
    
    // ✅ Admin authentication
    const key = body.key;
    if (key !== (process.env.ADMIN_PASSCODE || "founder2026")) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    if (!order_id || !["release_to_seller", "refund_buyer"].includes(action)) {
      return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ✅ Fetch the order
    const { data: order, error: orderErr } = await sb
      .from("kara_orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    let newStatus = "";
    let resolution = "";

    if (action === "refund_buyer") {
      // ✅ REFUND: Use Stripe to refund the buyer
      if (!order.stripe_payment_intent) {
        return NextResponse.json({ ok: false, error: "Cannot refund: missing payment intent" }, { status: 400 });
      }
      
      const refund = await stripe.refunds.create({
        payment_intent: order.stripe_payment_intent,
      });

      newStatus = "refunded";
      resolution = `Admin refund: ${admin_note || "Refunded by admin"}`;

      await sb.from("kara_orders").update({
        status: "refunded",
        dispute_resolution: "admin_refund",
        refund_id: refund.id,
        admin_note: admin_note || "",
        resolved_at: new Date().toISOString(),
        resolved_by: admin_email || "admin"
      }).eq("id", order_id);

      // ✅ Email buyer about refund
      if (order.buyer_email) {
        await sb.from("kara_emails").insert({
          email: order.buyer_email,
          kind: "order_refunded",
          subject: `✅ Admin Refund Issued - Order #${order.id}`,
          body: `<p>Your order has been refunded by KaraKata Admin. Refund ID: ${refund.id}. Please allow 5-10 business days.</p>`
        });
      }

      return NextResponse.json({ ok: true, message: "Refund issued", refund_id: refund.id });

    } else {
      // ✅ RELEASE: Pay the seller via Stripe Connect
      const { data: seller } = await sb.from("sellers").select("stripe_account_id").eq("id", order.seller_id).single();
      
      if (!seller?.stripe_account_id) {
        return NextResponse.json({ ok: false, error: "Seller has no Stripe account" }, { status: 400 });
      }

      const payoutAmount = Math.round((Number(order.total_amount) - Number(order.escrow_amount)) * 100);

      await stripe.transfers.create({
        amount: payoutAmount,
        currency: "usd",
        destination: seller.stripe_account_id,
        transfer_group: order.id,
        description: `KaraKata order payout - Admin released`,
      });

      newStatus = "completed";
      resolution = `Admin release: ${admin_note || "Released to seller by admin"}`;

      await sb.from("kara_orders").update({
        status: "completed",
        dispute_resolution: "admin_release",
        admin_note: admin_note || "",
        resolved_at: new Date().toISOString(),
        resolved_by: admin_email || "admin"
      }).eq("id", order_id);

      // ✅ Email both parties
      if (order.buyer_email) {
        await sb.from("kara_emails").insert({
          email: order.buyer_email,
          kind: "order_resolved",
          subject: `📋 Dispute Resolved - Order #${order.id}`,
          body: `<p>KaraKata Admin has resolved your dispute. Funds have been released to the seller per our review.</p>`
        });
      }

      return NextResponse.json({ ok: true, message: "Funds released to seller" });
    }
  } catch (err: any) {
    console.error("Admin resolve error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
