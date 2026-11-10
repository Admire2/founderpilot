/**
 * ==============================================================================
 * KARAKATA AFFILIATE COMMISSION & HYBRID PAYOUT MODEL
 * ==============================================================================
 * 1. STRIPE FEES: ~2.9% + $0.30 (Deducted automatically)
 * 
 * 2. AFFILIATE COMMISSION (Base Rates):
 *    - Standard Affiliate: 2.5% of total_amount
 *    - Founding Ambassador: 5% of total_amount (Temporary launch incentive)
 * 
 * 3. PAYOUT OPTIONS (Hybrid Threshold Model):
 *    - PLATFORM CREDITS: Base Commission + 20% Bonus. Available instantly after 
 *      the 60-day hold clears. No minimum withdrawal. (Recommended)
 *    - CASH (Bank/PayPal): Base Commission ONLY. 90-day total hold (60-day return 
 *      window + 30-day processing). Strict $100 minimum withdrawal threshold.
 * 
 * 4. KARAKATA PLATFORM REVENUE: 5% Smart Escrow Fee.
 * ==============================================================================
 */

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order_id, payout_method = "credits" } = body;

    if (!order_id) {
      return NextResponse.json({ ok: false, error: "order_id is required" }, { status: 400 });
    }

    // 1. Fetch Order Details
    const { data: order, error: orderError } = await supabase
      .from("kara_orders")
      .select("id, buyer_user_id, total_amount, status")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    // 2. Security Check: Only process if delivered/completed
    if (order.status !== "completed" && order.status !== "delivered") {
      return NextResponse.json({ 
        ok: true, 
        status: "skipped", 
        message: "Order not yet eligible (Awaiting delivery/completion)" 
      });
    }

    // 3. Check for Affiliate
    const { data: referralData, error: referralError } = await supabase
      .from("referrals")
      .select("affiliate_email, affiliate_id, campaign_type")
      .eq("referred_user_id", order.buyer_user_id)
      .single();

    if (referralError || !referralData) {
      return NextResponse.json({ ok: true, status: "no_affiliate", message: "No affiliate linked" });
    }

    // 4. Check Ambassador Status
    const { data: affiliateProfile } = await supabase
      .from("affiliates")
      .select("status, campaign_tags")
      .eq("email", referralData.affiliate_email)
      .single();

    const isFoundingAmbassador = Array.isArray(affiliateProfile?.campaign_tags) 
      ? affiliateProfile.campaign_tags.includes("Founding_Ambassador") 
      : false;

    // 5. Calculate Base Commission
    const standardRate = 0.025;  // 2.5%
    const foundingRate = 0.05;   // 5%
    const baseRate = isFoundingAmbassador ? foundingRate : standardRate;
    const baseCommissionAmount = Number(order.total_amount || 0) * baseRate;

    // 6. Process Payout based on Hybrid Model
    if (payout_method === "credits") {
      // Apply 20% bonus for choosing credits (protects startup cash flow)
      const bonusMultiplier = 1.20; 
      const finalCommissionAmount = baseCommissionAmount * bonusMultiplier;
      const creditAmount = Math.round(finalCommissionAmount * 100); // 1 USD = 100 credits

      // Safe balance update (fetch current, then add)
      const { data: currentCredits } = await supabase
        .from("credits")
        .select("pack_balance")
        .eq("email", referralData.affiliate_email)
        .maybeSingle();

      const currentBalance = Number(currentCredits?.pack_balance || 0);
      const newBalance = currentBalance + creditAmount;

      await supabase.from("credits").upsert(
        { email: referralData.affiliate_email, pack_balance: newBalance },
        { onConflict: "email" }
      );

      // Log Transaction
      await supabase.from("credit_transactions").insert({
        email: referralData.affiliate_email,
        type: "affiliate_commission",
        amount: creditAmount,
        source: "karakata_marketplace",
        description: `Commission + 20% Credit Bonus for order #${order_id}. Base: $${baseCommissionAmount.toFixed(2)}`,
        metadata: { order_id, base_commission_usd: baseCommissionAmount, is_founding_ambassador: isFoundingAmbassador }
      });

      return NextResponse.json({
        ok: true,
        payout_method: "credits",
        credits_granted: creditAmount,
        base_commission_usd: baseCommissionAmount,
        bonus_applied: "20%",
        message: "Credits added instantly after 60-day hold clearance."
      });

    } else if (payout_method === "cash") {
      // Cash payout logic: Enforce $100 minimum threshold
      const MIN_CASH_THRESHOLD = 100.00;
      
      // Fetch current pending cash balance for this affiliate
      const { data: pendingCash } = await supabase
        .from("credit_transactions") // Reusing this table or a dedicated payouts table
        .select("amount")
        .eq("email", referralData.affiliate_email)
        .eq("type", "pending_cash_payout")
        .sum("amount");

      const currentPendingCash = Number(pendingCash?.sum || 0) / 100; // Convert from cents
      const newPendingTotal = currentPendingCash + baseCommissionAmount;

      if (newPendingTotal < MIN_CASH_THRESHOLD) {
        return NextResponse.json({
          ok: true,
          status: "queued",
          message: `Cash payout queued. Minimum threshold is $${MIN_CASH_THRESHOLD}. You currently have $${newPendingTotal.toFixed(2)} pending. Switch to Credits for instant availability + 20% bonus!`,
          pending_cash_usd: newPendingTotal,
          hold_policy: "90 days total (60-day return window + 30-day processing)"
        });
      }

      // If over $100, log as approved for batch payout (actual bank transfer handled by admin batch job)
      await supabase.from("credit_transactions").insert({
        email: referralData.affiliate_email,
        type: "pending_cash_payout",
        amount: Math.round(baseCommissionAmount * 100),
        source: "karakata_marketplace",
        description: `Cash payout approved for order #${order_id} (Threshold met)`,
        metadata: { order_id, commission_usd: baseCommissionAmount }
      });

      return NextResponse.json({
        ok: true,
        payout_method: "cash",
        commission_usd: baseCommissionAmount,
        message: "Cash payout approved. Funds will be transferred within 30 days post-90-day hold.",
        hold_policy: "90 days total"
      });
    }

    return NextResponse.json({ ok: false, error: "Invalid payout method" }, { status: 400 });

  } catch (e: any) {
    console.error("Commission processing error:", e);
    return NextResponse.json({ ok: false, error: e.message || "Internal Server Error" }, { status: 500 });
  }
}
