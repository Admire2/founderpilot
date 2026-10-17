const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, 'kara-seek-engine/server.js');

const serverCode = `const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Docker-aware: reads port from environment variable, defaults to 8888
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

    let liveContext = "No live search results found.";
    if (searchRes.data.results && searchRes.data.results.length > 0) {
      liveContext = searchRes.data.results.slice(0, 8)
        .map(r => \`\${r.title}: \${r.content || ''}\`)
        .join('\\n');
    }

    const modelToUse = offlineMode ? FALLBACK_MODEL : HIGH_FLYER_MODEL;

    const aiRes = await axios.post(OLLAMA_URL, {
      model: modelToUse,
      prompt: \`Based on this LIVE SEARCH CONTEXT: "\${liveContext}"

Question: "\${prompt}"

CRITICAL: Answer EVERY part of the question fully. If asked for a list, list them all. Do not summarize.
Start your response with "ANSWER: " and then provide the full text.\`,
      stream: false,
      temperature: 0.3
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
      context: liveContext.substring(0, 500)
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
console.log('? server.js rewritten with correct syntax!');
