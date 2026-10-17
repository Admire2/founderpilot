const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'server.js');
let code = fs.readFileSync(serverPath, 'utf8');

// 1. Add Supabase imports and init at the top
const supabaseImport = `
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_ROLE_KEY'
);
`;
if (!code.includes('createClient')) {
  code = code.replace("const express = require('express');", "const express = require('express');\n" + supabaseImport);
}

// 2. Update the /api/v1/reload endpoint to write commissions
const reloadLogic = `
    const { phone_number, network, amount, affiliate_id } = req.body;
    
    // Calculate micro-commission (e.g., 2% of the $2 airtime = $0.04)
    const commissionRate = 0.02; 
    const commissionAmount = amount * commissionRate;

    console.log(\`? Dispensing \${amount} to \${phone_number} (\${network}) | Commission: $\${commissionAmount}\`);

    // WRITE TO SUPABASE (The Unified Ledger)
    try {
      // Insert transaction record
      await supabase.from('kara_telecom_transactions').insert({
        affiliate_code: affiliate_id,
        transaction_id: 'TXN-' + Date.now(),
        phone_number: phone_number,
        network: network,
        amount_usd: amount,
        commission_usd: commissionAmount
      });

      // Update affiliate's total_earned and telecom stats
      await supabase.rpc('increment_affiliate_earnings', { 
        p_code: affiliate_id, 
        p_amount: commissionAmount 
      }).catch(async () => {
        // Fallback if RPC doesn't exist: manual update
        const { data: aff } = await supabase.from('affiliates').select('total_earned').eq('affiliate_code', affiliate_id).single();
        if (aff) {
          await supabase.from('affiliates').update({ 
            total_earned: (aff.total_earned || 0) + commissionAmount,
            telecom_volume_usd: (aff.telecom_volume_usd || 0) + amount,
            telecom_tx_count: (aff.telecom_tx_count || 0) + 1
          }).eq('affiliate_code', affiliate_id);
        }
      });

    } catch (dbErr) {
      console.error('Supabase write failed:', dbErr.message);
    }

    res.json({
      success: true,
      transaction_id: 'TXN-' + Date.now(),
      commission_earned: commissionAmount,
      status: 'SUCCESS'
    });
`;

// Replace the old mock logic with the real Supabase logic
code = code.replace(
  /console\.log\(`? Dispensing[\s\S]*?}\);/,
  reloadLogic + '\n});'
);

fs.writeFileSync(serverPath, code, 'utf8');
console.log('? Supabase Unified Ledger wired into Kara Reload API!');
