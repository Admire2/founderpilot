import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { sendMail } from "@/lib/mail";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, mode, reason } = body;

    if (!order_id || !mode) {
      return NextResponse.json({ ok: false, error: "Missing order_id or mode" }, { status: 400 });
    }

    // 1. Fetch the order
    const { data: order, error: orderError } = await supabase
      .from("kara_orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    // 2. Validate status
    if (order.status !== "escrow_active" && order.status !== "cancellation_requested") {
      return NextResponse.json({ ok: false, error: `Cannot cancel order with status: ${order.status}` }, { status: 400 });
    }

    // 3. Check time since order creation
    const orderCreatedAt = new Date(order.created_at);
    const now = new Date();
    const minutesSinceOrder = (now.getTime() - orderCreatedAt.getTime()) / (1000 * 60);

    // ✅ PHASE 1: INSTANT CANCEL (0-60 minutes)
    if (mode === "instant") {
      if (minutesSinceOrder > 60) {
        return NextResponse.json({ 
          ok: false, 
          error: "The 60-minute Oops Window has closed. Please use 'request' mode instead." 
        }, { status: 400 });
      }

      if (!order.stripe_payment_intent) {
        return NextResponse.json({ ok: false, error: "Cannot refund: missing payment intent" }, { status: 400 });
      }

      // Issue Stripe refund
      const refund = await stripe.refunds.create({
        payment_intent: order.stripe_payment_intent,
        reason: "requested_by_customer",
      });

      // Update database
      await supabase
        .from("kara_orders")
        .update({
          status: "canceled",
          refund_id: refund.id,
          cancellation_reason: reason || "Buyer canceled within Oops Window",
          cancellation_decided_at: now.toISOString(),
          cancellation_decided_by: "buyer_instant",
        })
        .eq("id", order_id);

      // Send refund email to buyer
      if (order.buyer_email) {
        await sendMail({
          to: order.buyer_email,
          subject: "✅ Order Canceled - Full Refund Issued",
          html: `
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
              <h2 style="color:#059669;">Order Canceled - Refund Issued ✅</h2>
              <p>Your order has been successfully canceled. A full refund of <strong>$${Number(order.total_amount).toFixed(2)}</strong> has been issued to your original payment method.</p>
              <p><strong>Refund ID:</strong> ${refund.id}</p>
              <p>Please allow 5-10 business days for the refund to appear on your statement, depending on your bank.</p>
              <p style="margin-top:30px;color:#64748b;font-size:12px;">— The KaraKata Team</p>
            </div>
          `,
        });
      }

      return NextResponse.json({ ok: true, message: "Order canceled and refunded instantly", refund_id: refund.id });
    }

    // ✅ PHASE 2: REQUEST CANCELLATION (60+ minutes, pre-shipment)
    if (mode === "request") {
      if (minutesSinceOrder <= 60) {
        return NextResponse.json({ 
          ok: false, 
          error: "You are still within the 60-minute Oops Window. Please use 'instant' mode." 
        }, { status: 400 });
      }

      if (!reason || reason.trim().length < 5) {
        return NextResponse.json({ ok: false, error: "Please provide a cancellation reason (at least 5 characters)." }, { status: 400 });
      }

      // Update database to cancellation_requested
      await supabase
        .from("kara_orders")
        .update({
          status: "cancellation_requested",
          cancellation_reason: reason,
          cancellation_requested_at: now.toISOString(),
        })
        .eq("id", order_id);

      // Fetch seller email
      const { data: seller } = await supabase
        .from("sellers")
        .select("email, shop_name")
        .eq("id", order.seller_id)
        .single();

      // Send email to seller with approve/decline links
      if (seller?.email) {
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://founderpilot-theta.vercel.app";
        const approveUrl = `${appUrl}/api/karakata/order/cancel/respond?order_id=${order_id}&seller_id=${order.seller_id}&action=approve`;
        const declineUrl = `${appUrl}/api/karakata/order/cancel/respond?order_id=${order_id}&seller_id=${order.seller_id}&action=decline`;

        await sendMail({
          to: seller.email,
          subject: `⚠️ Cancellation Request for Order #${order.id}`,
          html: `
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
              <h2 style="color:#dc2626;">Buyer Cancellation Request</h2>
              <p>A buyer has requested to cancel their order. Please respond within 24 hours, or the system will auto-approve the cancellation.</p>
              <div style="background:#f8fafc;padding:15px;border-radius:6px;margin:20px 0;">
                <p><strong>Order #:</strong> ${order.id}</p>
                <p><strong>Amount:</strong> $${Number(order.total_amount).toFixed(2)}</p>
                <p><strong>Reason:</strong> ${reason}</p>
                <p><strong>Requested at:</strong> ${now.toLocaleString()}</p>
              </div>
              <div style="display:flex;gap:10px;margin-top:20px;">
                <a href="${approveUrl}" style="flex:1;background:#059669;color:white;padding:12px;text-align:center;border-radius:6px;text-decoration:none;font-weight:bold;">Approve & Refund</a>
                <a href="${declineUrl}" style="flex:1;background:#dc2626;color:white;padding:12px;text-align:center;border-radius:6px;text-decoration:none;font-weight:bold;">Decline (Already Shipped)</a>
              </div>
              <p style="margin-top:20px;color:#64748b;font-size:12px;">If you do not respond within 24 hours, the system will auto-approve and refund the buyer.</p>
            </div>
          `,
        });
      }

      return NextResponse.json({ ok: true, message: "Cancellation request sent to seller" });
    }

    return NextResponse.json({ ok: false, error: "Invalid mode" }, { status: 400 });
  } catch (error: any) {
    console.error("Cancel API error:", error);
    return NextResponse.json({ ok: false, error: error.message || "Internal error" }, { status: 500 });
  }
}
