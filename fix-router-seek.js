const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'kara-seek-engine/server.js');

const serverCode = `const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const SEARXNG_PORT = process.env.SEARXNG_PORT || '8888';
const SEARXNG_URL = \`http://localhost:\${SEARXNG_PORT}\`;
const OLLAMA_URL = 'http://localhost:11434/api/generate';

// KARA CLOUD CONFIGURATION (Qwen 3.8 / 3.75)
// You will need to add your DashScope/Alibaba API key here
const QWEN_CLOUD_API_KEY = process.env.QWEN_API_KEY || 'YOUR_API_KEY_HERE'; 
const QWEN_CLOUD_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

app.post('/api/seek', async (req, res) => {
  const { prompt, offlineMode } = req.body;

  try {
    // 1. ALWAYS fetch live context from local SearXNG (Privacy-safe search)
    const searchRes = await axios.get(\`\${SEARXNG_URL}/search\`, {
      params: { q: prompt, format: 'json', categories: 'general' },
      timeout: 10000
    });

    let liveContext = "";
    if (searchRes.data && searchRes.data.results && searchRes.data.results.length > 0) {
      liveContext = searchRes.data.results.slice(0, 5)
        .map((r, i) => \`[\${i+1}] \${r.title}: \${r.content || ''}\`)
        .join('\\n');
    }

    let finalAnswer = "";

    // 2. THE KARA ROUTER: Decide which brain to use
    if (offlineMode) {
      // === TIER 1: SOVEREIGN / ON-PREM (Local 3B Model) ===
      // Used for: Private data extraction, sensitive docs, offline mode.
      console.log('?? Routing to SOVEREIGN Local Engine (qwen2.5:3b)');
      
      const aiRes = await axios.post(OLLAMA_URL, {
        model: 'qwen2.5:3b',
        prompt: \`You are a STRICT TEXT PARSER. Read the search text below and answer: "\${prompt}". 
        SEARCH TEXT: "\${liveContext || 'No results'}". 
        Extract ONLY items explicitly mentioned in the text. Output a simple numbered list.\`,
        stream: false,
        temperature: 0.1
      });
      finalAnswer = aiRes.data.response || "Local engine returned no data.";

    } else {
      // === TIER 2: KARA CLOUD (Qwen 3.8 / 3.75) ===
      // Used for: General knowledge, complex reasoning, "List nations of Africa".
      console.log('? Routing to KARA CLOUD Engine (Qwen 3.8)');

      if (QWEN_CLOUD_API_KEY === 'YOUR_API_KEY_HERE') {
        // Fallback if no API key is provided: Use the massive local 33B model instead!
        console.log('?? No Cloud API Key found. Falling back to local Nemotron 33B for high-flier mode.');
        const aiRes = await axios.post(OLLAMA_URL, {
          model: 'nemotron3:33b', // Your massive local brain!
          prompt: \`Based on this context: "\${liveContext}", answer comprehensively: "\${prompt}". List all items fully.\`,
          stream: false,
          temperature: 0.3
        });
        finalAnswer = aiRes.data.response;
      } else {
        // Actual Cloud API Call
        const cloudRes = await axios.post(QWEN_CLOUD_URL, {
          model: 'qwen-max', // Or qwen-3.8
          messages: [
            { role: 'system', content: 'You are Kara Cloud, an advanced AI. Answer comprehensively.' },
            { role: 'user', content: \`Context: \${liveContext}\\n\\nQuestion: \${prompt}\` }
          ]
        }, {
          headers: { 'Authorization': \`Bearer \${QWEN_CLOUD_API_KEY}\` }
        });
        finalAnswer = cloudRes.data.choices[0].message.content;
      }
    }

    // 3. Return the answer
    res.json({
      success: true,
      answer: finalAnswer,
      context: liveContext.substring(0, 500),
      mode: offlineMode ? 'SOVEREIGN (Local)' : 'KARA CLOUD (High-Flier)'
    });

  } catch (error) {
    console.error('Seek Engine Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(\`?? Kara Seek Router running on port \${PORT}\`);
});
`;

fs.writeFileSync(serverPath, serverCode, 'utf8');
console.log('? Kara Router deployed!');
