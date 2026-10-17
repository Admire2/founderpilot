const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'kara-reload-api/server.js');
let code = fs.readFileSync(serverPath, 'utf8');

// Add fetch import if not present
if (!code.includes('const fetch = require')) {
  code = code.replace(
    "const express = require('express');",
    "const fetch = require('node-fetch');\nconst express = require('express');"
  );
}

// Find the bulk purchase endpoint and add credit payment option
const bulkEndpoint = `app.post('/api/v1/inventory/bulk', async (req, res) => {
  const { network, denomination, quantity, affiliate_email, payment_method } = req.body;
  
  // Calculate cost in credits (e.g., $5 airtime = 5 credits, 1000 units = 5000 credits)
  const creditCost = denomination * quantity;
  
  // If paying with credits, deduct from wallet
  if (payment_method === 'credits' && affiliate_email) {
    try {
      const creditCheck = await fetch(\`http://localhost:3000/api/credits?email=\${encodeURIComponent(affiliate_email)}\`);
      const creditData = await creditCheck.json();
      
      if (creditData.balance < creditCost) {
        return res.status(402).json({ 
          error: \`Insufficient credits. Need \${creditCost}, have \${creditData.balance}\`,
          required: creditCost,
          available: creditData.balance
        });
      }
      
      // Deduct credits
      await fetch('http://localhost:3000/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: affiliate_email, 
          cost: creditCost,
          source: 'kara_reload_bulk',
          description: \`Bulk airtime: \${quantity} x $\${denomination} \${network}\`,
          metadata: { network, denomination, quantity }
        })
      });
      
      console.log(\`?? Deducted \${creditCost} credits from \${affiliate_email} for bulk airtime\`);
    } catch (err) {
      console.error('Credit deduction failed:', err.message);
      return res.status(500).json({ error: 'Billing service unavailable' });
    }
  }`;

// Replace the existing bulk endpoint
code = code.replace(
  /app\.post\('\/api\/v1\/inventory\/bulk', async \(req, res\) => \{[\s\S]*?const \{ network, denomination, quantity \} = req\.body;/,
  bulkEndpoint
);

fs.writeFileSync(serverPath, code, 'utf8');
console.log('? Kara Reload wired to accept wallet credit payments');
