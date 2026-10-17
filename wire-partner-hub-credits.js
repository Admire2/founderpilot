const fs = require('fs');
const path = require('path');

// Update the commission route to offer credit payouts
const commissionPath = path.join(__dirname, 'app/api/karakata/order/commission/route.ts');
let code = fs.readFileSync(commissionPath, 'utf8');

// Find where it updates total_earned and add credit option
const creditPayoutLogic = `
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
        description: \`Commission for order #\${order_id}: $\${commissionAmount}\`,
        metadata: { order_id, commission_usd: commissionAmount }
      });
      
      return NextResponse.json({
        ok: true,
        payout_method: "credits",
        credits_granted: creditAmount,
        commission_usd: commissionAmount
      });
    }`;

// Inject the credit payout option before the final return
code = code.replace(
  /return NextResponse\.json\(\{[\s\S]*?status: "pending \(14-day hold\)"/,
  creditPayoutLogic + '\n\n    return NextResponse.json({\n      ok: true,\n      status: "pending (14-day hold)"'
);

fs.writeFileSync(commissionPath, code, 'utf8');
console.log('? Partner Hub wired to pay affiliates in wallet credits');
