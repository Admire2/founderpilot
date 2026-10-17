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

const HIGH_FLYER_MODEL = 'qwen2.5:3b';
const FALLBACK_MODEL = 'qwen2.5:0.5b';

app.post('/api/seek', async (req, res) => {
  const { prompt, offlineMode } = req.body;

  try {
    const searchRes = await axios.get(\`\${SEARXNG_URL}/search\`, {
      params: { q: prompt, format: 'json' }
    });

    let liveContext = "";
    if (searchRes.data.results && searchRes.data.results.length > 0) {
      // Get MORE results for comprehensive answers
      liveContext = searchRes.data.results.slice(0, 15)
        .map(r => \`\${r.title}: \${r.content || ''}\`)
        .join('\\n');
    } else {
      liveContext = "Search returned no results. Use your training knowledge to answer.";
    }

    const modelToUse = offlineMode ? FALLBACK_MODEL : HIGH_FLYER_MODEL;

    // AGGRESSIVE PROMPT - Forces listing
    const aiRes = await axios.post(OLLAMA_URL, {
      model: modelToUse,
      prompt: \`You are a COMPREHENSIVE ANSWER ENGINE. Based on this context: "\${liveContext}"

Question: "\${prompt}"

RULES:
1. If asked to LIST items, you MUST list EVERY SINGLE ONE. Do not summarize.
2. If asked "how many", give the number AND list them all.
3. NEVER say "there are X nations" without listing them.
4. Use bullet points or numbered lists for clarity.
5. Be exhaustive and thorough.

Provide your answer in this format:

ANSWER: [Your complete, comprehensive answer listing EVERYTHING requested]

Example for "List African nations":
ANSWER: There are 54 nations in Africa:
1. Algeria
2. Angola
3. Benin
4. Botswana
[...continues for all 54]
54. Zimbabwe\`,
      stream: false,
      temperature: 0.1,
      top_p: 0.9
    });

    const rawText = aiRes.data.response || '';
    
    let answer = rawText;
    const match = rawText.match(/ANSWER:\\s*([\\s\\S]*)/i);
    if (match) {
      answer = match[1].trim();
    }

    res.json({
      success: true,
      answer: answer,
      context: liveContext.substring(0, 500),
      results_count: searchRes.data.results ? searchRes.data.results.length : 0
    });

  } catch (error) {
    console.error('Seek Engine Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(\`?? Kara Seek Engine running locally on port \${PORT} (SearXNG on port \${SEARXNG_PORT})\`);
});
`;

fs.writeFileSync(serverPath, serverCode, 'utf8');
console.log('? Backend updated with AGGRESSIVE listing prompt!');
