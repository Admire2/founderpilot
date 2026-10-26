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
    const { order_id, reason } = body;

    if (!order_id || !reason || reason.trim().length < 5) {
      return NextResponse.json(
        { ok: false, error: "Missing order_id or reason (min 5 characters)" },
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

    // 2. Only allow disputes on shipped orders (before auto-release)
    if (order.status !== "shipped") {
      return NextResponse.json(
        { ok: false, error: `Cannot file dispute for status: ${order.status}` },
        { status: 400 }
      );
    }

    // 3. Check if auto-release has already happened
    if (order.auto_release_at && new Date(order.auto_release_at) < new Date()) {
      return NextResponse.json(
        { ok: false, error: "This order has already been auto-completed. Please contact support." },
        { status: 400 }
      );
    }

    const now = new Date().toISOString();

    // 4. Freeze the order
    await supabase
      .from("kara_orders")
      .update({
        status: "dispute_open",
        dispute_status: "open",
        dispute_reason: reason,
        dispute_opened_at: now,
      })
      .eq("id", order_id);

    // 5. Fetch seller info
    const { data: seller } = await supabase
      .from("sellers")
      .select("email, shop_name")
      .eq("id", order.seller_id)
      .single();

    // 6. Email the seller: "Upload proof of delivery"
    if (seller?.email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://founderpilot-theta.vercel.app";
      await sendMail({
        to: seller.email,
        subject: `⚠️ Dispute Opened on Order #${order.id} - Action Required`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#0f172a;">
            <h2 style="color:#dc2626;">⚠️ Buyer Filed a Dispute</h2>
            <p>The buyer has reported an issue with Order #${order.id}. <strong>Escrow funds are now frozen.</strong></p>
            <div style="background:#fef2f2;padding:16px;border-radius:8px;margin:20px 0;border-left:4px solid #dc2626;">
              <p><strong>Buyer's Issue:</strong></p>
              <p style="font-style:italic;">"${reason}"</p>
            </div>
            <p><strong>Next Steps:</strong></p>
            <ol style="line-height:1.8;">
              <li>Log into your <a href="${appUrl}/karakata/sellercenter/orders">Seller Center</a></li>
              <li>Upload your <strong>Proof of Delivery</strong> (e.g., FedEx/UPS tracking screenshot showing delivery photo)</li>
              <li>KaraKata support will review within 48 hours</li>
            </ol>
            <p style="background:#ecfdf5;padding:12px;border-radius:6px;font-size:13px;">💰 Funds remain safely held in KaraKata Escrow until this dispute is resolved.</p>
            <p style="color:#64748b;font-size:12px;">— The KaraKata Team</p>
          </div>
        `,
      });
    }

    // 7. Email the buyer: confirmation
    if (order.buyer_email) {
      await sendMail({
        to: order.buyer_email,
        subject: `🛡️ Dispute Filed - Escrow Frozen for Order #${order.id}`,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:20px;color:#0f172a;">
            <h2 style="color:#059669;">🛡️ Your Dispute Has Been Filed</h2>
            <p>We've received your report. <strong>Your funds are now safely frozen in KaraKata Escrow.</strong></p>
            <div style="background:#ecfdf5;padding:16px;border-radius:8px;margin:20px 0;">
              <p><strong>Order #:</strong> ${order.id}</p>
              <p><strong>Amount Protected:</strong> $${Number(order.total_amount).toFixed(2)}</p>
              <p><strong>Status:</strong> Dispute Open - Awaiting Seller's Proof of Delivery</p>
            </div>
            <p>KaraKata support will contact the seller to provide proof of delivery (e.g., carrier photo). You will receive an email when the dispute is resolved.</p>
            <p style="color:#64748b;font-size:12px;">— The KaraKata Team</p>
          </div>
        `,
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Dispute filed. Escrow frozen.",
    });
  } catch (error: any) {
    console.error("Dispute API error:", error);
    return NextResponse.json({ ok: false, error: error.message || "Internal error" }, { status: 500 });
  }
}
