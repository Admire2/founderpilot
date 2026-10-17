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
      params: { q: prompt, format: 'json', categories: 'general' },
      timeout: 10000
    });

    let liveContext = "";
    if (searchRes.data && searchRes.data.results && searchRes.data.results.length > 0) {
      liveContext = searchRes.data.results.slice(0, 10)
        .map((r, i) => \`[\${i+1}] \${r.title}: \${r.content || r.url}\`)
        .join('\\n');
    }

    const modelToUse = offlineMode ? FALLBACK_MODEL : HIGH_FLYER_MODEL;

    // STRICT FILTER PROMPT: Forces AI to respect the category constraint
    const aiRes = await axios.post(OLLAMA_URL, {
      model: modelToUse,
      prompt: \`You are a STRICT DATA EXTRACTION ENGINE. 
Search Context: "\${liveContext}"
User Question: "\${prompt}"

CRITICAL RULES:
1. Identify the specific category or constraint in the question (e.g., "Africa", "Nigeria", "Solar Companies").
2. Extract ONLY items that strictly belong to this category. 
3. EXCLUDE any item that does not match (e.g., if asked for Africa, NEVER include USA, Pakistan, Japan, etc.).
4. Output ONLY a valid JSON array of strings. 
5. NO markdown, NO explanations, ONLY the JSON array.

Example Output for Africa: ["Algeria", "Angola", "Benin"]\`,
      stream: false,
      temperature: 0.1
    });

    // 1. Parse AI Response
    let rawText = aiRes.data.response || '[]';
    let clean = rawText.replace(/\\\`\\\`\\\`json/gi, '').replace(/\\\`\\\`\\\`/g, '').trim();
    
    let extractedList = [];
    try {
      extractedList = JSON.parse(clean);
      if (!Array.isArray(extractedList)) extractedList = [];
    } catch (e) {
      // Fallback: split by newlines if JSON parsing fails
      extractedList = clean.split(/\\n|,/).map(s => s.replace(/^\\d+\\.\\s*/, '').replace(/["\\[\\]]/g, '').trim()).filter(s => s.length > 2);
    }

    // 2. PROGRAMMATIC DEDUPLICATION (Guarantees ZERO duplicates)
    const uniqueList = [...new Set(extractedList.map(item => item.trim()))];

    // 3. PROGRAMMATIC COUNTING
    const count = uniqueList.length;

    // 4. Construct the perfect answer
    let finalAnswer = \`Based on the search results, there are exactly \${count} items matching your criteria.\\n\\n\`;
    uniqueList.forEach((item, index) => {
      finalAnswer += \`\${index + 1}. \${item}\\n\`;
    });

    res.json({
      success: true,
      answer: finalAnswer,
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
  console.log(\`?? Kara Seek Engine running on port \${PORT} (SearXNG: \${SEARXNG_PORT})\`);
});
`;

fs.writeFileSync(serverPath, serverCode, 'utf8');
console.log('? Backend updated with STRICT category filtering!');
