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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const orderId = searchParams.get("order_id");
    const sellerId = searchParams.get("seller_id");
    const action = searchParams.get("action"); // 'approve' or 'decline'

    if (!orderId || !sellerId || !action) {
      return new NextResponse("Missing parameters", { status: 400 });
    }

    // 1. Fetch order
    const { data: order, error } = await supabase
      .from("kara_orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    // 2. Verify seller owns this order
    if (String(order.seller_id) !== String(sellerId)) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    // 3. Verify order is in cancellation_requested state
    if (order.status !== "cancellation_requested") {
      return new NextResponse(`Order is not awaiting cancellation decision (current: ${order.status})`, { status: 400 });
    }

    const now = new Date();

    // ✅ APPROVE: Issue refund
    if (action === "approve") {
      if (!order.stripe_payment_intent) {
        return new NextResponse("Cannot refund: missing payment intent", { status: 400 });
      }

      const refund = await stripe.refunds.create({
        payment_intent: order.stripe_payment_intent,
        reason: "requested_by_customer",
      });

      await supabase
        .from("kara_orders")
        .update({
          status: "canceled",
          refund_id: refund.id,
          cancellation_decided_at: now.toISOString(),
          cancellation_decided_by: "seller",
        })
        .eq("id", orderId);

      // Email buyer
      if (order.buyer_email) {
        await sendMail({
          to: order.buyer_email,
          subject: "✅ Your Cancellation Was Approved - Refund Issued",
          html: `
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
              <h2 style="color:#059669;">Cancellation Approved ✅</h2>
              <p>The seller has approved your cancellation request. A full refund of <strong>$${Number(order.total_amount).toFixed(2)}</strong> has been issued.</p>
              <p><strong>Refund ID:</strong> ${refund.id}</p>
              <p>Please allow 5-10 business days for the refund to appear on your statement.</p>
            </div>
          `,
        });
      }

      return new NextResponse(`
        <html>
          <body style="font-family:sans-serif;text-align:center;padding:50px;background:#f0fdf4;">
            <h1 style="color:#059669;">✅ Cancellation Approved</h1>
            <p>The buyer has been refunded. You can close this window.</p>
          </body>
        </html>
      `, { headers: { "Content-Type": "text/html" } });
    }

    // ✅ DECLINE: Revert to escrow_active
    if (action === "decline") {
      await supabase
        .from("kara_orders")
        .update({
          status: "escrow_active",
          cancellation_decided_at: now.toISOString(),
          cancellation_decided_by: "seller",
        })
        .eq("id", orderId);

      // Email buyer
      if (order.buyer_email) {
        await sendMail({
          to: order.buyer_email,
          subject: "❌ Cancellation Request Declined",
          html: `
            <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
              <h2 style="color:#dc2626;">Cancellation Request Declined</h2>
              <p>The seller has declined your cancellation request. This typically means your item has already been packed and is ready to ship.</p>
              <p>Your order will continue processing. Once it ships, you will receive tracking information. If the item arrives and has issues, you can initiate a return.</p>
              <p><strong>Order #:</strong> ${order.id}</p>
            </div>
          `,
        });
      }

      return new NextResponse(`
        <html>
          <body style="font-family:sans-serif;text-align:center;padding:50px;background:#fef2f2;">
            <h1 style="color:#dc2626;">❌ Cancellation Declined</h1>
            <p>The buyer has been notified. You can close this window.</p>
          </body>
        </html>
      `, { headers: { "Content-Type": "text/html" } });
    }

    return new NextResponse("Invalid action", { status: 400 });
  } catch (error: any) {
    console.error("Respond API error:", error);
    return new NextResponse(error.message || "Internal error", { status: 500 });
  }
}
