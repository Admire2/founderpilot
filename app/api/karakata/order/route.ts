import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

// Initialize Stripe (Make sure STRIPE_SECRET_KEY is in your Vercel Environment Variables)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16", 
});

// Initialize Supabase (Server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY! 
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    // ✅ Added buyer_email to the destructured body
    const { cart, subtotal, shippingCost, shippingCountry, grandTotal, escrowFee, seller_id, buyer_email } = body;

    // 1. Basic Validation
    if (!cart || cart.length === 0) {
      return NextResponse.json({ ok: false, error: "Cart is empty" }, { status: 400 });
    }

    // 2. Save Order to Supabase
    const finalChargeAmount = grandTotal + escrowFee;
    
    const { data: order, error: orderError } = await supabase
      .from("kara_orders")
      .insert({
        buyer_email: buyer_email || "guest@karakata.com", // ✅ Captures real email from checkout!
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

    // 3. Build Stripe Line Items
    const lineItems: any[] = cart.map((item: any) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: item.title,
          images: item.image_url ? [item.image_url] : [],
        },
        unit_amount: Math.round((Number(item.price) || Number(item.price_usd) || 0) * 100), // Stripe expects cents
      },
      quantity: item.qty || 1,
    }));

    // Add Shipping as a line item
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

    // Add Escrow Fee as a line item
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

    // 4. Create Stripe Checkout Session
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

    // 5. Update Order with Stripe Session ID
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
