import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMail } from "@/lib/mail";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Map EasyPost statuses to our stages
const STATUS_MAP: Record<string, string> = {
  pre_transit: "label_created",
  in_transit: "in_transit",
  out_for_delivery: "out_for_delivery",
  delivered: "delivered",
  available_for_pickup: "delivered",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // EasyPost sends the tracker data in the "result" field
    const tracker = body.result || body;
    
    if (!tracker.tracking_code || !tracker.id) {
      return NextResponse.json({ ok: true, message: "Ping received" });
    }

    // 1. Find the order by EasyPost tracker ID
    const { data: order, error } = await supabase
      .from("kara_orders")
      .select("*")
      .eq("easypost_tracker_id", tracker.id)
      .single();

    if (error || !order) {
      // Order not found - might be a test ping from EasyPost setup
      return NextResponse.json({ ok: true, message: "Order not found" });
    }

    // 2. Build the new stage
    const newStage = {
      stage: STATUS_MAP[tracker.status] || "in_transit",
      time: tracker.updated_at || new Date().toISOString(),
      location: tracker.tracking_details?.[0]?.tracking_location?.city || "In Transit",
      description: tracker.tracking_details?.[0]?.message || `Status: ${tracker.status}`,
    };

    // 3. Append to existing stages (avoid duplicates)
    const existingStages = Array.isArray(order.tracking_stages) ? order.tracking_stages : [];
    const isDuplicate = existingStages.some(
      (s: any) => s.stage === newStage.stage && s.time === newStage.time
    );

    let updatedStages = existingStages;
    if (!isDuplicate) {
      updatedStages = [...existingStages, newStage].sort(
        (a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime()
      );
    }

    // 4. Update database
    const updateData: any = { tracking_stages: updatedStages };
    
    if (tracker.status === "delivered" && order.status !== "delivered") {
      updateData.status = "delivered";
      updateData.delivered_at = new Date().toISOString();
    }

    await supabase.from("kara_orders").update(updateData).eq("id", order.id);

    // 5. Send email for key status changes
    if (order.buyer_email && ["out_for_delivery", "delivered"].includes(tracker.status)) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://founderpilot-theta.vercel.app";
      const trackUrl = `${appUrl}/karakata/track?email=${encodeURIComponent(order.buyer_email)}&orderId=${order.stripe_session_id || ""}`;
      
      const subject = tracker.status === "out_for_delivery"
        ? "🚚 Your KaraKata Order Is Out for Delivery!"
        : "✅ Your KaraKata Order Has Been Delivered!";
      
      const bodyHtml = tracker.status === "out_for_delivery"
        ? `<p>Great news! Your package is <strong>on the truck and heading to you today</strong>. Keep an eye out for the carrier!</p>`
        : `<p>Your package has been delivered. Please inspect it and <strong>confirm receipt</strong> to release funds to the seller.</p>
           <p style="background:#fef3c7;padding:12px;border-radius:6px;font-size:13px;margin-top:12px;">⏰ <strong>Note:</strong> Funds will automatically release to the seller after a 24-hour inspection window if no dispute is filed.</p>`;

      try {
        await sendMail({
          to: order.buyer_email,
          subject,
          html: `
            <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;">
              <h2 style="color:#7c3aed;">${tracker.status === "out_for_delivery" ? "🚚" : "✅"} ${tracker.status === "out_for_delivery" ? "Out for Delivery" : "Delivered"}</h2>
              ${bodyHtml}
              <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:20px 0;">
                <p><strong>Order #:</strong> ${order.id}</p>
                <p><strong>Carrier:</strong> ${order.carrier?.toUpperCase()}</p>
                <p><strong>Tracking:</strong> ${order.tracking_number}</p>
                <p><strong>Location:</strong> ${newStage.location}</p>
              </div>
              <p><a href="${trackUrl}" style="background:#7c3aed;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;">View Full Tracking Timeline →</a></p>
              <p style="color:#64748b;font-size:12px;margin-top:20px;">— The KaraKata Team</p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error("Webhook email failed:", emailError);
      }
    }

    return NextResponse.json({ ok: true, message: "Webhook processed" });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
