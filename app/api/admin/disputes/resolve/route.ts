import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order_id, action, admin_note } = body;

    // ✅ 1. VERIFY REAL ADMIN AUTH
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ ok: false, error: "Unauthorized: No token provided" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    const sbAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user }, error: authError } = await sbAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized: Invalid session" }, { status: 401 });
    }

    const { data: profile } = await sbAdmin.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }

    if (!order_id || !["release_to_seller", "refund_buyer"].includes(action)) {
      return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
    }

    // ✅ 2. FETCH THE ORDER
    const { data: order, error: orderErr } = await sbAdmin
      .from("kara_orders")
      .select("*")
      .eq("id", order_id)
      .single();

    if (orderErr || !order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    const ip = req.headers.get("x-forwarded-for") || "unknown";

    // ✅ 3. EXECUTE ACTION & LOG TO AUDIT TRAIL
    if (action === "refund_buyer") {
      if (!order.stripe_payment_intent) {
        return NextResponse.json({ ok: false, error: "Cannot refund: missing payment intent" }, { status: 400 });
      }
      
      const refund = await stripe.refunds.create({
        payment_intent: order.stripe_payment_intent,
      });

      await sbAdmin.from("kara_orders").update({
        status: "refunded",
        dispute_resolution: "admin_refund",
        refund_id: refund.id,
        admin_note: admin_note || "",
        resolved_at: new Date().toISOString(),
        resolved_by: user.email
      }).eq("id", order_id);

      // 🛡️ WRITE TO AUDIT LOG
      await sbAdmin.from("admin_audit_logs").insert({
        admin_id: user.id,
        admin_email: user.email,
        action_type: "REFUND_BUYER",
        target_id: order_id,
        details: { refund_id: refund.id, amount: order.total_amount, reason: admin_note },
        ip_address: ip
      });

      return NextResponse.json({ ok: true, message: "Refund issued", refund_id: refund.id });

    } else {
      const { data: seller } = await sbAdmin.from("sellers").select("stripe_account_id").eq("id", order.seller_id).single();
      
      if (!seller?.stripe_account_id) {
        return NextResponse.json({ ok: false, error: "Seller has no Stripe account" }, { status: 400 });
      }

      const payoutAmount = Math.round((Number(order.total_amount) - Number(order.escrow_amount)) * 100);

      await stripe.transfers.create({
        amount: payoutAmount,
        currency: "usd",
        destination: seller.stripe_account_id,
        transfer_group: order.id,
        description: `KaraKata order payout - Admin released`,
      });

      await sbAdmin.from("kara_orders").update({
        status: "completed",
        dispute_resolution: "admin_release",
        admin_note: admin_note || "",
        resolved_at: new Date().toISOString(),
        resolved_by: user.email
      }).eq("id", order_id);

      // 🛡️ WRITE TO AUDIT LOG
      await sbAdmin.from("admin_audit_logs").insert({
        admin_id: user.id,
        admin_email: user.email,
        action_type: "RELEASE_SELLER",
        target_id: order_id,
        details: { payout_amount: payoutAmount, reason: admin_note },
        ip_address: ip
      });

      return NextResponse.json({ ok: true, message: "Funds released to seller" });
    }
  } catch (err: any) {
    console.error("Admin resolve error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
