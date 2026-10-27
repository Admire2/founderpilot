import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendMail } from "@/lib/mail";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, seller_id, evidence_type, evidence_value, evidence_notes } = body;

    if (!order_id || !seller_id || !evidence_type || !evidence_value) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
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

    // 3. Verify order is in dispute state
    if (order.status !== "dispute_open") {
      return NextResponse.json(
        { ok: false, error: `Order is not in dispute (current status: ${order.status})` },
        { status: 400 }
      );
    }

    // 4. Build the evidence object
    const evidenceItem = {
      type: evidence_type,
      value: evidence_value,
      notes: evidence_notes || "",
      submitted_at: new Date().toISOString(),
      submitted_by: seller_id,
    };

    // 5. Append to existing evidence array
    const existingEvidence = Array.isArray(order.dispute_evidence) ? order.dispute_evidence : [];
    const updatedEvidence = [...existingEvidence, evidenceItem];

   // 6. Update the order
await supabase
  .from("kara_orders")
  .update({
    status: "dispute_under_review", // ✅ THIS IS THE MAGIC LINE
    dispute_evidence: updatedEvidence,
    dispute_resolution: "under_review",
  })
  .eq("id", order_id);

    // 7. Email the buyer
    if (order.buyer_email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://founderpilot-theta.vercel.app";
      const trackUrl = `${appUrl}/karakata/track?email=${encodeURIComponent(order.buyer_email)}&orderId=${order.stripe_session_id || ""}`;
      
      await sendMail({
        to: order.buyer_email,
        subject: `📋 Seller Has Responded to Your Dispute - Order #${order.id}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#0f172a;">
            <h2 style="color:#7c3aed;">📋 Seller Has Submitted Evidence</h2>
            <p>The seller of Order #${order.id} has responded to your dispute by submitting proof of delivery.</p>
            <div style="background:#f8fafc;padding:16px;border-radius:8px;margin:20px 0;">
              <p><strong>Order #:</strong> ${order.id}</p>
              <p><strong>Amount in Escrow:</strong> $${Number(order.total_amount).toFixed(2)}</p>
              <p><strong>Status:</strong> Under Review by KaraKata Admin</p>
            </div>
            <p>KaraKata Admin will review the evidence within 48 hours and make a final decision. <strong>Your funds remain safely frozen</strong> until the dispute is resolved.</p>
            <p><a href="${trackUrl}" style="color:#7c3aed;font-weight:bold;">View your order status →</a></p>
            <p style="color:#64748b;font-size:12px;">— The KaraKata Team</p>
          </div>
        `,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Evidence submitted successfully. KaraKata Admin will review within 48 hours.",
    });
  } catch (error: any) {
    console.error("Dispute respond API error:", error);
    return NextResponse.json({ ok: false, error: error.message || "Internal error" }, { status: 500 });
  }
}
