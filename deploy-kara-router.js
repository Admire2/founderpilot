const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const engineDir = path.join(__dirname, 'kara-seek-engine');

// Ensure dotenv is installed
try {
    execSync('npm install dotenv', { cwd: engineDir, stdio: 'inherit' });
} catch (e) { console.log('dotenv already installed or installing...'); }

const serverPath = path.join(engineDir, 'server.js');

const serverCode = `require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const SEARXNG_PORT = process.env.SEARXNG_PORT || '8888';
const SEARXNG_URL = \`http://localhost:\${SEARXNG_PORT}\`;
const OLLAMA_URL = 'http://localhost:11434/api/generate';

// KARA CLOUD CONFIGURATION
const QWEN_API_KEY = process.env.QWEN_API_KEY || '';
const PRIMARY_MODEL = process.env.QWEN_PRIMARY_MODEL || 'qwen-max';
const FALLBACK_MODEL = process.env.QWEN_FALLBACK_MODEL || 'qwen-plus';
const DASHSCOPE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

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
    let modeUsed = "";

    // 2. THE KARA ROUTER
    if (offlineMode) {
      // === TIER 1: SOVEREIGN / ON-PREM ===
      modeUsed = "SOVEREIGN (Local Ollama)";
      console.log('?? Routing to SOVEREIGN Local Engine');
      
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
      // === TIER 2: HIGH-FLIER CLOUD ROUTING ===
      if (!QWEN_API_KEY || QWEN_API_KEY === 'YOUR_ACTUAL_API_KEY_HERE') {
        console.log('?? No valid Qwen API Key. Falling back to local Nemotron 33B.');
        modeUsed = "LOCAL FALLBACK (Nemotron 33B)";
        const aiRes = await axios.post(OLLAMA_URL, {
          model: 'nemotron3:33b',
          prompt: \`Based on this context: "\${liveContext}", answer comprehensively: "\${prompt}". List all items fully.\`,
          stream: false,
          temperature: 0.3
        });
        finalAnswer = aiRes.data.response;
      } else {
        try {
          // Try Primary Cloud Model (e.g., 3.8 / qwen-max)
          modeUsed = \`KARA CLOUD (Primary: \${PRIMARY_MODEL})\`;
          console.log(\`?? Routing to Primary Cloud: \${PRIMARY_MODEL}\`);
          
          const cloudRes = await axios.post(DASHSCOPE_URL, {
            model: PRIMARY_MODEL,
            messages: [
              { role: 'system', content: 'You are Kara Cloud, an advanced enterprise AI. Provide comprehensive, accurate answers. If a list is requested, list all items clearly.' },
              { role: 'user', content: \`Search Context: \${liveContext}\\n\\nQuestion: \${prompt}\` }
            ]
          }, {
            headers: { 
              'Authorization': \`Bearer \${QWEN_API_KEY}\`,
              'Content-Type': 'application/json'
            }
          });
          finalAnswer = cloudRes.data.choices[0].message.content;

        } catch (primaryError) {
          console.warn('?? Primary Cloud Model failed. Trying Fallback Model...', primaryError.message);
          try {
            // Try Fallback Cloud Model (e.g., 3.75 / qwen-plus)
            modeUsed = \`KARA CLOUD (Fallback: \${FALLBACK_MODEL})\`;
            console.log(\`?? Routing to Fallback Cloud: \${FALLBACK_MODEL}\`);
            
            const fallbackRes = await axios.post(DASHSCOPE_URL, {
              model: FALLBACK_MODEL,
              messages: [
                { role: 'system', content: 'You are Kara Cloud. Provide a comprehensive answer.' },
                { role: 'user', content: \`Search Context: \${liveContext}\\n\\nQuestion: \${prompt}\` }
              ]
            }, {
              headers: { 
                'Authorization': \`Bearer \${QWEN_API_KEY}\`,
                'Content-Type': 'application/json'
              }
            });
            finalAnswer = fallbackRes.data.choices[0].message.content;

          } catch (fallbackError) {
            console.error('? Both Cloud Models failed. Ultimate fallback to Local Ollama.');
            modeUsed = "ULTIMATE FALLBACK (Local Ollama)";
            const aiRes = await axios.post(OLLAMA_URL, {
              model: 'qwen2.5:3b',
              prompt: \`Answer based on this context: "\${liveContext}". Question: "\${prompt}"\`,
              stream: false
            });
            finalAnswer = aiRes.data.response + "\\n\\n*(Note: Cloud API failed, used local fallback)*";
          }
        }
      }
    }

    // 3. Return the answer
    res.json({
      success: true,
      answer: finalAnswer,
      context: liveContext.substring(0, 500),
      mode: modeUsed
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
console.log('? Kara Tiered Router deployed successfully!');
