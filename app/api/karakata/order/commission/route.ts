import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { order_id } = await req.json();
    if (!order_id) 
    // OPTION: Pay affiliate in wallet credits instead of fiat
    // For now, we'll add credits to their pack_balance
    if (body.payout_method === 'credits') {
      const creditAmount = Math.round(commissionAmount * 100); // 1 USD = 100 credits
      
      await supabase.from("credits").upsert({
        email: referralData.affiliate_email,
        pack_balance: creditAmount
      }, { onConflict: 'email' });
      
      // Log the credit grant
      await supabase.from("credit_transactions").insert({
        email: referralData.affiliate_email,
        type: "affiliate_commission",
        amount: creditAmount,
        source: "karakata_marketplace",
        description: `Commission for order #${order_id}: ${commissionAmount}`,
        metadata: { order_id, commission_usd: commissionAmount }
      });
      
      return NextResponse.json({
        ok: true,
        payout_method: "credits",
        credits_granted: creditAmount,
        commission_usd: commissionAmount
      });
    }

    return NextResponse.json({
      ok: true,
      status: "pending (14-day hold)"
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}