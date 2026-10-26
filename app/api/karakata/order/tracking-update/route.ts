import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMail } from "@/lib/mail";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Stage definitions (in order)
const STAGE_ORDER = [
  "label_created",
  "picked_up",
  "in_transit",
  "out_for_delivery",
  "delivered",
];

const STAGE_LABELS: Record<string, string> = {
  label_created: "Label Created",
  picked_up: "Picked Up by Carrier",
  in_transit: "In Transit",
  out_for_delivery: "Out for Delivery 🚚",
  delivered: "Delivered ✅",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, stage, location, carrier_reference } = body;

    if (!order_id || !stage) {
      return NextResponse.json({ ok: false, error: "Missing order_id or stage" }, { status: 400 });
    }

    if (!STAGE_ORDER.includes(stage)) {
      return NextResponse.json({ ok: false, error: `Invalid stage: ${stage}` }, { status: 400 });
    }

    // 1. Fetch order
    const { data: order, error } = await supabase
      .from("kara_orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (error || !order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    // 2. Append the new stage to tracking_stages
    const existingStages = Array.isArray(order.tracking_stages) ? order.tracking_stages : [];
    const newStage = {
      stage,
      time: new Date().toISOString(),
      location: location || "Unknown",
      carrier_reference: carrier_reference || null,
    };

    // Avoid duplicates
    const updatedStages = [...existingStages.filter((s: any) => s.stage !== stage), newStage];

    // 3. Update database
    const updateData: any = { tracking_stages: updatedStages };
    
    // If this is the "delivered" stage, update status
    if (stage === "delivered") {
      updateData.status = "delivered";
    } else if (order.status === "escrow_active" || order.status === "shipped") {
      updateData.status = "shipped";
    }

    await supabase.from("kara_orders").update(updateData).eq("id", order_id);

    // 4. Email buyer for key stages
    if (order.buyer_email && ["out_for_delivery", "delivered"].includes(stage)) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://founderpilot-theta.vercel.app";
      const trackUrl = `${appUrl}/karakata/track?email=${encodeURIComponent(order.buyer_email)}&orderId=${order.stripe_session_id || ""}`;
      
      const subject = stage === "out_for_delivery"
        ? "🚚 Your KaraKata Order Is Out for Delivery!"
        : "✅ Your KaraKata Order Has Been Delivered!";
      
      const body_html = stage === "out_for_delivery"
        ? `<p>Great news! Your package is <strong>on the truck and heading to you today</strong>. Keep an eye out for the carrier!</p>`
        : `<p>Your package has been delivered. Please inspect it and <strong>confirm receipt</strong> to release funds to the seller.</p>`;

      await sendMail({
        to: order.buyer_email,
        subject,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;">
            <h2 style="color:#7c3aed;">${STAGE_LABELS[stage]}</h2>
            ${body_html}
            <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:20px 0;">
              <p><strong>Carrier:</strong> ${order.carrier?.toUpperCase()}</p>
              <p><strong>Tracking:</strong> ${order.tracking_number}</p>
              <p><strong>Location:</strong> ${location || "See tracking details"}</p>
            </div>
            <p><a href="${trackUrl}" style="background:#7c3aed;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">View Full Tracking Timeline →</a></p>
          </div>
        `,
      });
    }

    return NextResponse.json({ ok: true, message: "Tracking updated", stage: STAGE_LABELS[stage] });
  } catch (error: any) {
    console.error("Tracking update error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
