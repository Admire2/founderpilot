const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'kara-seek-engine/server.js');
let code = fs.readFileSync(serverPath, 'utf8');

// Add fetch import if not present
if (!code.includes('const fetch = require')) {
  code = code.replace(
    "const axios = require('axios');",
    "const axios = require('axios');\nconst fetch = require('node-fetch');"
  );
}

// Find the POST /api/seek endpoint and add credit deduction
const seekEndpoint = `app.post('/api/seek', async (req, res) => {
  const { prompt, offlineMode, email } = req.body; // Add email parameter

  // CREDIT DEDUCTION FOR CLOUD QUERIES (1 credit per High-Flier query)
  if (!offlineMode && email) {
    try {
      const creditCheck = await fetch(\`http://localhost:3000/api/credits?email=\${encodeURIComponent(email)}\`);
      const creditData = await creditCheck.json();
      
      if (creditData.balance < 1) {
        return res.status(402).json({ 
          error: 'Insufficient credits for cloud AI query. Please purchase more credits.',
          balance: creditData.balance
        });
      }
      
      // Deduct 1 credit
      await fetch('http://localhost:3000/api/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          cost: 1,
          source: 'kara_seek_cloud',
          description: \`Kara Seek High-Flier query: "\${prompt.substring(0, 50)}..."\`,
          metadata: { prompt_length: prompt.length, model: 'qwen-max' }
        })
      });
      
      console.log(\`?? Deducted 1 credit from \${email} for Kara Seek cloud query\`);
    } catch (err) {
      console.error('Credit deduction failed:', err.message);
      return res.status(500).json({ error: 'Billing service unavailable' });
    }
  }`;

// Replace the existing endpoint start
code = code.replace(
  /app\.post\('\/api\/seek', async \(req, res\) => \{[\s\S]*?const \{ prompt, offlineMode \} = req\.body;/,
  seekEndpoint
);

fs.writeFileSync(serverPath, code, 'utf8');
console.log('? Kara Seek wired to deduct 1 credit per cloud query');
