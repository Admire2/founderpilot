import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMail } from "@/lib/mail";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const TRACKING_URLS: Record<string, string> = {
  fedex: "https://www.fedex.com/fedextrack/?trknbr=",
  dhl: "https://www.dhl.com/en/express/tracking.html?AWB=",
  usps: "https://tools.usps.com/go/TrackConfirmAction?tLabels=",
  ups: "https://www.ups.com/track?tracknum=",
  "local-courier": "",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, seller_id, carrier, tracking_number } = body;

    if (!order_id || !seller_id || !carrier) {
      return NextResponse.json(
        { ok: false, error: "Missing order_id, seller_id, or carrier" },
        { status: 400 }
      );
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

    // 2. Verify seller ownership
    if (String(order.seller_id) !== String(seller_id)) {
      return NextResponse.json({ ok: false, error: "Unauthorized: this is not your order" }, { status: 403 });
    }

    // 3. BLOCK shipping if a cancellation request is awaiting review
    if (order.status === "cancellation_requested") {
      return NextResponse.json({
        ok: false,
        error: "This order has a pending cancellation request. Resolve it in your inbox before shipping.",
      }, { status: 400 });
    }

    // 4. Validate current status
    if (!["escrow_active", "delivered"].includes(order.status)) {
      return NextResponse.json({
        ok: false,
        error: `Cannot ship an order with status: ${order.status}`,
      }, { status: 400 });
    }

    // 5. Require tracking number for real carriers
    const cleanCarrier = String(carrier).toLowerCase();
    const cleanTracking = String(tracking_number || "").trim();

    if (cleanCarrier !== "local-courier" && cleanTracking.length < 5) {
      return NextResponse.json({
        ok: false,
        error: "Please enter a valid tracking number (at least 5 characters).",
      }, { status: 400 });
    }

    // 6. Update the order
    const { error: updateError } = await supabase
      .from("kara_orders")
      .update({
        status: "shipped",
        carrier: cleanCarrier,
        tracking_number: cleanTracking,
        shipped_at: new Date().toISOString(),
      })
      .eq("id", order_id);

    if (updateError) {
      console.error("Ship update error:", updateError);
      return NextResponse.json({ ok: false, error: "Database update failed" }, { status: 500 });
    }

    // 7. Email the buyer their tracking details
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://founderpilot-theta.vercel.app";
    const trackPageUrl = `${appUrl}/karakata/track?email=${encodeURIComponent(order.buyer_email || "")}&orderId=${order.stripe_session_id || ""}`;
    const carrierUrl = (TRACKING_URLS[cleanCarrier] || "") + encodeURIComponent(cleanTracking);

    if (order.buyer_email) {
      try {
        await sendMail({
          to: order.buyer_email,
          subject: "📦 Your KaraKata Order Is On The Way!",
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#0f172a;">
              <h2 style="color:#7c3aed;">Your order has shipped! 📦</h2>
              <p>Great news! The seller has handed your order over for delivery.</p>
              <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:20px 0;">
                <p><strong>Carrier:</strong> ${cleanCarrier.toUpperCase()}</p>
                <p><strong>Tracking Number:</strong> ${cleanTracking || "Local delivery - no tracking number"}</p>
              </div>
              ${carrierUrl ? `<p><a href="${carrierUrl}" style="background:#7c3aed;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">Track with ${cleanCarrier.toUpperCase()}</a></p>` : ""}
              <p><a href="${trackPageUrl}" style="color:#059669;font-weight:bold;">View your KaraKata order status →</a></p>
              <p style="background:#ecfdf5;padding:12px;border-radius:6px;font-size:13px;">🛡️ Your payment remains safely held in Smart Escrow. Once your item arrives, confirm receipt to release the funds to the seller.</p>
              <p style="color:#64748b;font-size:12px;">— The KaraKata Team</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Shipping email failed:", emailError);
      }
    }

    return NextResponse.json({
      ok: true,
      message: "Order marked as shipped. Buyer has been notified.",
      tracking_url: carrierUrl,
    });
  } catch (error: any) {
    console.error("Ship API error:", error);
    return NextResponse.json({ ok: false, error: error.message || "Internal error" }, { status: 500 });
  }
}
