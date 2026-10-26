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
    const { order_id, buyer_email } = body;

    if (!order_id || !buyer_email) {
      return NextResponse.json({ ok: false, error: "Missing order_id or buyer_email" }, { status: 400 });
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

    // 2. Verify buyer owns this order
    if (order.buyer_email?.toLowerCase() !== buyer_email.toLowerCase()) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 403 });
    }

    // 3. Verify order is in a state that can be completed
    if (!["shipped", "delivered", "escrow_active"].includes(order.status)) {
      return NextResponse.json({ ok: false, error: `Cannot confirm receipt for status: ${order.status}` }, { status: 400 });
    }

    // 4. Fetch seller to get their Stripe Connected Account ID
    const { data: seller, error: sellerError } = await supabase
      .from("sellers")
      .select("stripe_account_id, email, shop_name")
      .eq("id", order.seller_id)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json({ ok: false, error: "Seller not found" }, { status: 404 });
    }

    if (!seller.stripe_account_id) {
      return NextResponse.json({ 
        ok: false, 
        error: "Seller has not completed Stripe onboarding. Your funds are held safely in Escrow until they do." 
      }, { status: 400 });
    }

    // 5. Calculate Payout Amount (Total Amount - Escrow Fee = 95% to Seller)
    // Stripe expects amounts in cents, so we multiply by 100 and round
    const payoutAmount = Math.round((Number(order.total_amount) - Number(order.escrow_amount)) * 100);

    // 6. Execute Stripe Transfer
    const transfer = await stripe.transfers.create({
      amount: payoutAmount,
      currency: "usd",
      destination: seller.stripe_account_id,
      transfer_group: order.id, // Groups the charge and transfer together
      metadata: {
        order_id: order.id,
        karakata_fee: Math.round(Number(order.escrow_amount) * 100).toString(),
      },
    });

    // 7. Update Order Status to Completed
    const now = new Date().toISOString();
    await supabase
      .from("kara_orders")
      .update({
        status: "completed",
        completed_at: now,
      })
      .eq("id", order_id);

    // 8. Send Completion Emails
    if (order.buyer_email) {
      await sendMail({
        to: order.buyer_email,
        subject: "✅ Order Completed - Thank you for shopping with KaraKata!",
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
            <h2 style="color:#059669;">Order Completed! 🎉</h2>
            <p>Thank you for confirming receipt of your order. Your funds have been securely released to the seller.</p>
            <p>We hope you love your purchase! If you have a moment, please consider leaving a review for <strong>${seller.shop_name || 'the seller'}</strong>.</p>
            <p style="margin-top:30px;color:#64748b;font-size:12px;">— The KaraKata Team</p>
          </div>
        `,
      });
    }

    if (seller.email) {
      await sendMail({
        to: seller.email,
        subject: "💰 Payout Released - Order Completed",
        html: `
          <div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px;">
            <h2 style="color:#059669;">Funds Released to Your Account! 💰</h2>
            <p>The buyer has confirmed receipt of their order. A payout of <strong>$${(payoutAmount / 100).toFixed(2)}</strong> has been transferred to your connected Stripe account.</p>
            <p><strong>Order #:</strong> ${order.id}</p>
            <p><strong>Transfer ID:</strong> ${transfer.id}</p>
            <p style="margin-top:30px;color:#64748b;font-size:12px;">— The KaraKata Team</p>
          </div>
        `,
      });
    }

    return NextResponse.json({ 
      ok: true, 
      message: "Order completed and funds released successfully", 
      transfer_id: transfer.id 
    });

  } catch (error: any) {
    console.error("Confirm Receipt API error:", error);
    return NextResponse.json({ ok: false, error: error.message || "Internal error" }, { status: 500 });
  }
}
