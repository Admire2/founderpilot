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
      // Get top 3 results for tight, accurate context
      liveContext = searchRes.data.results.slice(0, 3)
        .map((r, i) => \`Snippet \${i+1}: \${r.content || r.title}\`)
        .join('\\n\\n');
    }

    const modelToUse = offlineMode ? FALLBACK_MODEL : HIGH_FLYER_MODEL;

    // SIMPLE LIST PROMPT: Small models are great at numbered lists
    const aiRes = await axios.post(OLLAMA_URL, {
      model: modelToUse,
      prompt: \`You are a TEXT PARSER. Read the search text below and answer the user's question.

USER QUESTION: "\${prompt}"

SEARCH TEXT:
"""
\${liveContext}
"""

INSTRUCTIONS:
1. Answer the question using ONLY the information in the SEARCH TEXT.
2. If asked for a list, provide it as a simple numbered list (1. Item, 2. Item).
3. DO NOT add any items that are not explicitly mentioned in the SEARCH TEXT.
4. Start your response directly with the numbered list. No introductory text.\`,
      stream: false,
      temperature: 0.1
    });

    const rawText = aiRes.data.response || '';

    // PROGRAMMATIC EXTRACTION: Find all lines starting with a number and a dot
    const regex = /^\\d+\\.\\s+(.*)$/gm;
    let matches = [...rawText.matchAll(regex)];
    
    let extractedList = matches.map(match => match[1].trim());

    // If regex fails, fallback to splitting by newlines and filtering
    if (extractedList.length === 0) {
      extractedList = rawText.split('\\n')
        .map(line => line.replace(/^\\d+\\.\\s*/, '').replace(/^[\\-\\*]\\s*/, '').trim())
        .filter(line => line.length > 2 && !line.toLowerCase().includes('there are') && !line.toLowerCase().includes('based on'));
    }

    // DEDUPLICATION
    const uniqueList = [...new Set(extractedList)];

    // COUNTING
    const count = uniqueList.length;

    // If count is 0, the AI failed to list them. We provide a fallback message.
    let finalAnswer = "";
    if (count > 0) {
      finalAnswer = \`Based on the search results, there are exactly \${count} items.\\n\\n\`;
      uniqueList.forEach((item, index) => {
        finalAnswer += \`\${index + 1}. \${item}\\n\`;
      });
    } else {
      finalAnswer = "The search results contained the information, but the AI failed to format it as a list. Here is the raw search context:\\n\\n" + liveContext;
    }

    res.json({
      success: true,
      answer: finalAnswer,
      context: liveContext.substring(0, 600),
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
console.log('? Backend updated with bulletproof numbered list extraction!');
