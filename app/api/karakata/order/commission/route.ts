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

    // Only process commission if order is completed/delivered (prevents payout on cancelled orders)
    if (order.status !== "completed" && order.status !== "delivered") {
      return NextResponse.json({ 
        ok: true, 
        status: "skipped", 
        message: "Order not yet eligible for commission payout" 
      });
    }

    // 3. Check for Affiliate/Referral associated with this buyer
    const { data: referralData, error: referralError } = await supabase
      .from("referrals")
      .select("affiliate_email, affiliate_id, campaign_type")
      .eq("referred_user_id", order.buyer_user_id)
      .single();

    // If no affiliate is attached to this buyer, exit gracefully (this is normal)
    if (referralError || !referralData) {
      return NextResponse.json({ ok: true, status: "no_affiliate", message: "No affiliate linked to this order" });
    }

    // 4. Check if Affiliate is a "Founding_Ambassador" for special rates
    const { data: affiliateProfile } = await supabase
      .from("affiliates")
      .select("status, campaign_tags")
      .eq("email", referralData.affiliate_email)
      .single();

    // Safely check if the campaign_tags array includes our special tag
    const isFoundingAmbassador = Array.isArray(affiliateProfile?.campaign_tags) 
      ? affiliateProfile.campaign_tags.includes("Founding_Ambassador") 
      : false;

    // 5. Calculate Commission
    // Standard rate: 5% of total_amount. Founding Ambassador rate: 10% (adjust as needed)
    const standardRate = 0.05;
    const foundingRate = 0.10;
    const rate = isFoundingAmbassador ? foundingRate : standardRate;
    
    const commissionAmount = Number(order.total_amount || 0) * rate;

    // 6. Process Payout (Credits)
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

      // 7. Log the Transaction for Audit Trail
      await supabase.from("credit_transactions").insert({
        email: referralData.affiliate_email,
        type: "affiliate_commission",
        amount: creditAmount,
        source: "karakata_marketplace",
        description: `Commission for order #${order_id}: $${commissionAmount.toFixed(2)} (${isFoundingAmbassador ? "Founding Ambassador Bonus" : "Standard Rate"})`,
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
        affiliate_status: isFoundingAmbassador ? "Founding_Ambassador" : "Standard"
      });
    }

    // Fallback for future fiat payouts
    return NextResponse.json({
      ok: true,
      status: "pending_fiat_payout",
      commission_usd: commissionAmount
    });

  } catch (e: any) {
    console.error("Commission processing error:", e);
    return NextResponse.json({ ok: false, error: e.message || "Internal Server Error" }, { status: 500 });
  }
}
