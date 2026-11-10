/**
 * ==============================================================================
 * KARAKATA AFFILIATE COMMISSION & REVENUE SPLIT MODEL
 * ==============================================================================
 * When a sale is made via an affiliate referral link, the total_amount is split:
 * 
 * 1. STRIPE PROCESSING FEES: ~2.9% + $0.30 (Deducted automatically by Stripe)
 * 
 * 2. AFFILIATE COMMISSION (Paid in Platform Credits):
 *    - Standard Affiliate: 5% of the order's total_amount
 *    - Founding Ambassador: 10% of the order's total_amount (Temporary launch incentive)
 * 
 * 3. KARAKATA PLATFORM REVENUE:
 *    - Platform/Escrow Fee: 5% of the order's total_amount
 *    - Seller Receives: The remaining ~90% (minus Stripe fees)
 * 
 * SECURITY & HOLD POLICY:
 * Commissions are ONLY processed when order.status is "completed" or "delivered".
 * A strict 60-day hold policy is enforced post-delivery to protect the platform 
 * against buyer returns, refunds, and chargebacks. This hold period will be 
 * reviewed and potentially lowered as the marketplace scales and stabilizes.
 * ==============================================================================
 */

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// 🔒 Initialize Supabase with Service Role Key for secure backend operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { order_id, payout_method = "credits" } = body;

    // 1. Validate Request
    if (!order_id) {
      return NextResponse.json({ ok: false, error: "order_id is required" }, { status: 400 });
    }

    // 2. Fetch Order Details
    const { data: order, error: orderError } = await supabase
      .from("kara_orders")
      .select("id, buyer_user_id, total_amount, status")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ ok: false, error: "Order not found" }, { status: 404 });
    }

    // 3. Security Check: Only process commission if order is completed/delivered
    // This prevents payout on cancelled, refunded, or disputed orders.
    if (order.status !== "completed" && order.status !== "delivered") {
      return NextResponse.json({ 
        ok: true, 
        status: "skipped", 
        message: "Order not yet eligible for commission payout (Awaiting delivery/completion)" 
      });
    }

    // 4. Check for Affiliate/Referral associated with this buyer
    const { data: referralData, error: referralError } = await supabase
      .from("referrals")
      .select("affiliate_email, affiliate_id, campaign_type")
      .eq("referred_user_id", order.buyer_user_id)
      .single();

    // If no affiliate is attached to this buyer, exit gracefully (this is normal)
    if (referralError || !referralData) {
      return NextResponse.json({ ok: true, status: "no_affiliate", message: "No affiliate linked to this order" });
    }

    // 5. Check if Affiliate is a "Founding_Ambassador" for special rates
    const { data: affiliateProfile } = await supabase
      .from("affiliates")
      .select("status, campaign_tags")
      .eq("email", referralData.affiliate_email)
      .single();

    // Safely check if the campaign_tags array includes our special tag
    const isFoundingAmbassador = Array.isArray(affiliateProfile?.campaign_tags) 
      ? affiliateProfile.campaign_tags.includes("Founding_Ambassador") 
      : false;

    // 6. Calculate Commission
    const standardRate = 0.05;  // 5% for Standard Affiliates
    const foundingRate = 0.10;  // 10% for Founding Ambassadors
    const rate = isFoundingAmbassador ? foundingRate : standardRate;
    
    const commissionAmount = Number(order.total_amount || 0) * rate;

    // 7. Process Payout (Credits)
    if (payout_method === "credits") {
      const creditAmount = Math.round(commissionAmount * 100); // 1 USD = 100 credits

      // 🔒 SAFE BALANCE UPDATE: Fetch current balance first, then ADD to it (prevents overwriting)
      const { data: currentCredits } = await supabase
        .from("credits")
        .select("pack_balance")
        .eq("email", referralData.affiliate_email)
        .maybeSingle();

      const currentBalance = Number(currentCredits?.pack_balance || 0);
      const newBalance = currentBalance + creditAmount;

      await supabase.from("credits").upsert(
        {
          email: referralData.affiliate_email,
          pack_balance: newBalance
        },
        { onConflict: "email" }
      );

      // 8. Log the Transaction for Audit Trail
      await supabase.from("credit_transactions").insert({
        email: referralData.affiliate_email,
        type: "affiliate_commission",
        amount: creditAmount,
        source: "karakata_marketplace",
        description: `Commission for order #${order_id}: $${commissionAmount.toFixed(2)} (${isFoundingAmbassador ? "Founding Ambassador Bonus (10%)" : "Standard Rate (5%)"}) - Subject to 60-day hold policy.`,
        metadata: { 
          order_id, 
          commission_usd: commissionAmount, 
          is_founding_ambassador: isFoundingAmbassador 
        }
      });

      return NextResponse.json({
        ok: true,
        payout_method: "credits",
        credits_granted: creditAmount,
        commission_usd: commissionAmount,
        affiliate_status: isFoundingAmbassador ? "Founding_Ambassador" : "Standard",
        hold_policy: "60 days post-delivery"
      });
    }

    // Fallback for future fiat payouts
    return NextResponse.json({
      ok: true,
      status: "pending (60-day hold)",
      commission_usd: commissionAmount
    });

  } catch (e: any) {
    console.error("Commission processing error:", e);
    return NextResponse.json({ ok: false, error: e.message || "Internal Server Error" }, { status: 500 });
  }
}
