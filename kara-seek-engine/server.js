require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const fetch = require('node-fetch');

const app = express();
app.use(cors());
app.use(express.json());

// Infrastructure URLs
const SEARXNG_PORT = process.env.SEARXNG_PORT || '8888';
const SEARXNG_URL = `http://localhost:${SEARXNG_PORT}`;
const OLLAMA_URL = 'http://localhost:11434/api/generate';
const CREDITS_API_URL = 'http://localhost:3000/api/credits';

// Qwen Cloud Configuration (DashScope API)
const QWEN_API_KEY = process.env.QWEN_API_KEY || '';
const QWEN_PRIMARY_MODEL = process.env.QWEN_PRIMARY_MODEL || 'qwen-max'; // Qwen 3.8
const QWEN_FALLBACK_MODEL = process.env.QWEN_FALLBACK_MODEL || 'qwen-plus'; // Qwen 3.75
const DASHSCOPE_URL = 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions';

// Local Sovereign Models
const LOCAL_HIGH_FLYER = 'qwen2.5:3b';
const LOCAL_FALLBACK = 'qwen2.5:0.5b';

app.post('/api/seek', async (req, res) => {
  const { prompt, offlineMode, email } = req.body;

  // STEP 1: CREDIT DEDUCTION FOR CLOUD QUERIES
  if (!offlineMode && email) {
    try {
      const creditCheck = await fetch(`${CREDITS_API_URL}?email=${encodeURIComponent(email)}`);
      const creditData = await creditCheck.json();

      if (creditData.balance < 1) {
        return res.status(402).json({
          error: 'Insufficient credits for cloud AI query. Please purchase more credits.',
          balance: creditData.balance
        });
      }

      // Deduct 1 credit
      await fetch(CREDITS_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          cost: 1,
          source: 'kara_seek_cloud',
          description: `Kara Seek query: "${prompt.substring(0, 50)}..."`,
          metadata: { prompt_length: prompt.length, offlineMode }
        })
      });

      console.log(`?? Deducted 1 credit from ${email} for Kara Seek query`);
    } catch (err) {
      console.error('Credit deduction failed:', err.message);
      return res.status(500).json({ error: 'Billing service unavailable' });
    }
  }

  try {
    // STEP 2: FETCH LIVE CONTEXT FROM SEARXNG
    const searchRes = await axios.get(`${SEARXNG_URL}/search`, {
      params: { q: prompt, format: 'json', categories: 'general' },
      timeout: 10000
    });

    let liveContext = "";
    if (searchRes.data && searchRes.data.results && searchRes.data.results.length > 0) {
      liveContext = searchRes.data.results.slice(0, 5)
        .map((r, i) => `[${i+1}] ${r.title}: ${r.content || ''}`)
        .join('\n');
    }

    let finalAnswer = "";
    let modeUsed = "";

    // STEP 3: THE KARA ROUTER - QWEN 3.8 ? 3.75 ? LOCAL FALLBACK CHAIN
    if (offlineMode) {
      // === SOVEREIGN MODE: LOCAL OLLAMA ONLY ===
      modeUsed = "SOVEREIGN (Local Ollama)";
      console.log('?? Routing to SOVEREIGN Local Engine');

      const aiRes = await axios.post(OLLAMA_URL, {
        model: LOCAL_HIGH_FLYER,
        prompt: `You are a STRICT TEXT PARSER. Read the search text below and answer: "${prompt}".
SEARCH TEXT: "${liveContext || 'No results'}".
Extract ONLY items explicitly mentioned in the text. Output a simple numbered list.`,
        stream: false,
        temperature: 0.1
      });
      finalAnswer = aiRes.data.response || "Local engine returned no data.";

    } else {
      // === CLOUD MODE: QWEN 3.8 ? 3.75 ? LOCAL FALLBACK ===
      if (!QWEN_API_KEY || QWEN_API_KEY === 'YOUR_API_KEY_HERE') {
        console.log('?? No valid Qwen API Key. Falling back to local Ollama.');
        modeUsed = "LOCAL FALLBACK (No API Key)";
        const aiRes = await axios.post(OLLAMA_URL, {
          model: LOCAL_HIGH_FLYER,
          prompt: `Based on this context: "${liveContext}", answer comprehensively: "${prompt}". List all items fully.`,
          stream: false,
          temperature: 0.3
        });
        finalAnswer = aiRes.data.response;
      } else {
        try {
          // TRY PRIMARY: QWEN 3.8 (qwen-max)
          modeUsed = `KARA CLOUD (Primary: ${QWEN_PRIMARY_MODEL} - Qwen 3.8)`;
          console.log(`?? Routing to Primary Cloud: ${QWEN_PRIMARY_MODEL}`);

          const cloudRes = await axios.post(DASHSCOPE_URL, {
            model: QWEN_PRIMARY_MODEL,
            messages: [
              { role: 'system', content: 'You are Kara Cloud, an advanced enterprise AI. Provide comprehensive, accurate answers. If a list is requested, list all items clearly.' },
              { role: 'user', content: `Search Context: ${liveContext}\n\nQuestion: ${prompt}` }
            ]
          }, {
            headers: {
              'Authorization': `Bearer ${QWEN_API_KEY}`,
              'Content-Type': 'application/json'
            }
          });
          finalAnswer = cloudRes.data.choices[0].message.content;

        } catch (primaryError) {
          console.warn('?? Qwen 3.8 failed. Trying Qwen 3.75 fallback...', primaryError.message);

          try {
            // TRY FALLBACK: QWEN 3.75 (qwen-plus)
            modeUsed = `KARA CLOUD (Fallback: ${QWEN_FALLBACK_MODEL} - Qwen 3.75)`;
            console.log(`?? Routing to Fallback Cloud: ${QWEN_FALLBACK_MODEL}`);

            const fallbackRes = await axios.post(DASHSCOPE_URL, {
              model: QWEN_FALLBACK_MODEL,
              messages: [
                { role: 'system', content: 'You are Kara Cloud. Provide a comprehensive answer.' },
                { role: 'user', content: `Search Context: ${liveContext}\n\nQuestion: ${prompt}` }
              ]
            }, {
              headers: {
                'Authorization': `Bearer ${QWEN_API_KEY}`,
                'Content-Type': 'application/json'
              }
            });
            finalAnswer = fallbackRes.data.choices[0].message.content;

          } catch (fallbackError) {
            console.error('? Both Qwen 3.8 and 3.75 failed. Ultimate fallback to Local Ollama.');
            modeUsed = "ULTIMATE FALLBACK (Local Ollama)";
            const aiRes = await axios.post(OLLAMA_URL, {
              model: LOCAL_HIGH_FLYER,
              prompt: `Answer based on this context: "${liveContext}". Question: "${prompt}"`,
              stream: false
            });
            finalAnswer = aiRes.data.response + "\n\n*(Note: Cloud API failed, used local fallback)*";
          }
        }
      }
    }

    // STEP 4: RETURN THE ANSWER
    res.json({
      success: true,
      answer: finalAnswer,
      context: liveContext.substring(0, 500),
      mode: modeUsed,
      credits_used: offlineMode ? 0 : 1
    });

  } catch (error) {
    console.error('Seek Engine Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`?? Kara Seek Router running on port ${PORT}`);
  console.log(`   Primary: ${QWEN_PRIMARY_MODEL} (Qwen 3.8)`);
  console.log(`   Fallback: ${QWEN_FALLBACK_MODEL} (Qwen 3.75)`);
  console.log(`   Sovereign: Local Ollama`);
});
