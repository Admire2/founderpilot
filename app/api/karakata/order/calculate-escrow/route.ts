import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { orderAmount, sellerId } = await req.json();

    if (!orderAmount || !sellerId) {
      return NextResponse.json({ error: "Missing order amount or seller ID" }, { status: 400 });
    }

    // Initialize Supabase (Use your standard env vars)
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // 1. Fetch Seller's Trust & Obligation Status
    const { data: seller, error } = await sb
      .from("sellers")
      .select("verification_status, obligation_met, trust_score")
      .eq("id", sellerId)
      .single();

    if (error || !seller) {
      console.warn("Seller not found in DB, applying default unverified rules.");
    }

    // 2. DEFAULT STANDARD ESCROW (Trusted Sellers)
    let holdPercentage = 1.0; // Hold 100% of the item price
    let releaseDays = 3;      // Release 3 days after delivery confirmation
    let bufferFee = 0;
    let message = "Standard escrow applied. Funds release in 3 days.";

    // 3. APPLY "HIGHER ESCROW" LOGIC FOR UNMET OBLIGATIONS
    if (seller && !seller.obligation_met) {
      holdPercentage = 1.05; // Hold 105% (5% buffer for potential return shipping/refunds)
      releaseDays = 14;      // Lock funds for 14 days to ensure buyer satisfaction
      bufferFee = orderAmount * 0.05;
      message = "⚠️ Extended hold applied: Seller has unmet obligations. Funds held for 14 days.";
      console.log(`⚠️ Seller ${sellerId} has unmet obligations. Applied 5% buffer and 14-day hold.`);
    } 
    // 4. APPLY LOGIC FOR UNVERIFIED / NEW SELLERS
    else if (seller && seller.verification_status === 'unverified') {
      releaseDays = 7; // Hold for 7 days for unverified sellers
      message = "⚠️ Seller is unverified. Funds held for 7 days.";
    }

    const finalHoldAmount = orderAmount * holdPercentage;

    // 5. RETURN CALCULATION TO FRONTEND
    return NextResponse.json({
      ok: true,
      escrow_hold_amount: finalHoldAmount,
      escrow_buffer_fee: bufferFee,
      release_days: releaseDays,
      message: message
    });

  } catch (error) {
    console.error("Escrow Calculation Error:", error);
    return NextResponse.json({ error: "Failed to calculate escrow" }, { status: 500 });
  }
}
