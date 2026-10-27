import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { sendMail } from "@/lib/mail"; // ✅ Added sendMail import

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16", 
});

// Initialize Supabase (Server-side with Service Role for secure writes/reads)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ✅ Upgraded to Service Role
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cart, subtotal, shippingCost, shippingCountry, grandTotal, escrowFee, seller_id, buyer_email } = body;

    if (!cart || cart.length === 0) {
      return NextResponse.json({ ok: false, error: "Cart is empty" }, { status: 400 });
    }

    const finalChargeAmount = grandTotal + escrowFee;
    
    const { data: order, error: orderError } = await supabase
      .from("kara_orders")
      .insert({
        buyer_email: buyer_email || "guest@karakata.com",
        seller_id: seller_id,
        status: "pending_payment",
        total_amount: finalChargeAmount, 
        escrow_amount: escrowFee,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Supabase Order Error:", orderError);
      return NextResponse.json({ ok: false, error: "Failed to save order to database" }, { status: 500 });
    }

    // ✅ NEW: Fetch seller info to send New Order Alert
    const { data: sellerData } = await supabase
      .from("sellers")
      .select("email, shop_name")
      .eq("id", seller_id)
      .single();

    if (sellerData?.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://founderpilot-theta.vercel.app";
      try {
        await sendMail({
          to: sellerData.email,
          subject: `📦 New Order Received! - Order #${order.id}`,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#0f172a;">
              <h2 style="color:#059669;">📦 New Order Received!</h2>
              <p>Congratulations! A buyer has just purchased an item from your store. Funds are safely held in KaraKata Escrow.</p>
              <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:20px 0;">
                <p><strong>Order #:</strong> ${order.id}</p>
                <p><strong>Total Amount:</strong> $${Number(order.total_amount).toFixed(2)}</p>
                <p><strong>Buyer Email:</strong> ${order.buyer_email}</p>
                <p><strong>Shipping To:</strong> ${shippingCountry || "Not specified"}</p>
              </div>
              <p><strong>Next Step:</strong> Please prepare the item for shipment and mark it as "Shipped" in your Seller Center within 2 business days.</p>
              <p style="text-align:center;margin-top:24px;">
                <a href="${appUrl}/karakata/sellercenter/orders" style="background:#059669;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Go to Seller Center →</a>
              </p>
              <p style="color:#64748b;font-size:12px;margin-top:30px;">— The KaraKata Team</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("New order email failed:", emailError);
      }
    }

    // Build Stripe Line Items
    const lineItems: any[] = cart.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.title,
          images: item.image_url ? [item.image_url] : [],
        },
        unit_amount: Math.round((Number(item.price) || Number(item.price_usd) || 0) * 100),
      },
      quantity: item.qty || 1,
    }));

    if (shippingCost > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: `Shipping to ${shippingCountry}` },
          unit_amount: Math.round(shippingCost * 100),
        },
        quantity: 1,
      });
    }

    if (escrowFee > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "KaraKata Smart Escrow Protection (5%)" },
          unit_amount: Math.round(escrowFee * 100),
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://founderpilot-theta.vercel.app"}/karakata/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://founderpilot-theta.vercel.app"}/karakata/checkout`,
      metadata: {
        order_id: order.id,
        seller_id: seller_id,
      },
    });

    await supabase
      .from("kara_orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    return NextResponse.json({ ok: true, url: session.url });

  } catch (error: any) {
    console.error("Checkout API Error:", error);
    return NextResponse.json({ ok: false, error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
