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
    console.log('Searching SearXNG at:', \`\${SEARXNG_URL}/search?q=\${prompt}\`);
    
    const searchRes = await axios.get(\`\${SEARXNG_URL}/search\`, {
      params: { 
        q: prompt, 
        format: 'json',
        categories: 'general'
      },
      timeout: 10000
    });

    console.log('SearXNG response:', JSON.stringify(searchRes.data).substring(0, 200));

    let liveContext = "";
    let resultsCount = 0;
    
    if (searchRes.data && searchRes.data.results && searchRes.data.results.length > 0) {
      resultsCount = searchRes.data.results.length;
      // Get MORE results and include titles + content
      liveContext = searchRes.data.results.slice(0, 10)
        .map((r, i) => \`[\${i+1}] \${r.title}: \${r.content || r.url}\`)
        .join('\\n');
      console.log('Found', resultsCount, 'results');
    } else {
      console.log('No results from SearXNG');
      liveContext = "Search returned no results.";
    }

    const modelToUse = offlineMode ? FALLBACK_MODEL : HIGH_FLYER_MODEL;

    // EXTRACTION PROMPT - Forces AI to read and compile from search results
    const aiRes = await axios.post(OLLAMA_URL, {
      model: modelToUse,
      prompt: \`You are an INTELLIGENCE EXTRACTION ENGINE. Your job is to read search results and compile a comprehensive answer.

SEARCH RESULTS:
\${liveContext}

USER QUESTION: "\${prompt}"

INSTRUCTIONS:
1. READ the search results above carefully.
2. EXTRACT the answer directly from those results.
3. If the results contain a list, reproduce the COMPLETE list.
4. If the results contain a number, state that number.
5. COMPILE all relevant information into one comprehensive answer.
6. Do NOT say "I cannot answer" - use the search results to answer.
7. If results are empty, answer from your knowledge but be comprehensive.

Format your response as:

ANSWER: [Your comprehensive answer compiled from the search results]

Be thorough. If asked to list items, list ALL of them. If asked for a count, give the count AND the list.\`,
      stream: false,
      temperature: 0.2
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
      context: liveContext.substring(0, 800),
      results_count: resultsCount
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
console.log('? Backend updated with extraction-focused prompt!');
