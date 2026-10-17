const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const engineDir = path.join(__dirname, 'kara-seek-engine');

// Ensure directory exists
if (!fs.existsSync(engineDir)) {
    fs.mkdirSync(engineDir, { recursive: true });
}

// 2. Write the 100% Local, Free server.js
const serverCode = `const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const SEARXNG_URL = 'http://localhost:8888'; // Local Docker SearXNG
const OLLAMA_URL = 'http://localhost:11434/api/generate';

// 100% Local Models (No Cloud, No Cost)
const HIGH_FLYER_MODEL = 'qwen2.5:3b'; // Powerful local reasoning
const FALLBACK_MODEL = 'qwen2.5:0.5b'; // Fast, lightweight local fallback

app.post('/api/seek', async (req, res) => {
  const { prompt, offlineMode } = req.body;

  try {
    // STEP 1: Fetch live context from LOCAL SearXNG
    const searchRes = await axios.get(\`\${SEARXNG_URL}/search\`, {
      params: { q: prompt, format: 'json' }
    });

    let liveContext = "No live search results found.";
    if (searchRes.data.results && searchRes.data.results.length > 0) {
      liveContext = searchRes.data.results.slice(0, 10)
        .map(r => \`\${r.title}: \${r.content || ''}\`)
        .join('\\n');
    }

    // STEP 2: Choose local model based on mode
    const modelToUse = offlineMode ? FALLBACK_MODEL : HIGH_FLYER_MODEL;

    // STEP 3: Send to LOCAL Ollama for structured extraction
    const aiRes = await axios.post(OLLAMA_URL, {
      model: modelToUse,
      prompt: \`Based on this LIVE SEARCH CONTEXT: "\${liveContext}". Mission: "\${prompt}". Extract structured data. Output ONLY a raw JSON array of objects with keys: "entity", "metric", "value". If no data, output []. No markdown.\`,
      stream: false,
      temperature: 0.2
    });

    // STEP 4: Parse and clean the JSON
    const rawText = aiRes.data.response || '';
    const clean = rawText.replace(/\\\`\\\`\\\`json/gi, '').replace(/\\\`\\\`\\\`/g, '').trim();
    const start = clean.indexOf('[');
    const end = clean.lastIndexOf(']');
    
    let extractedData = [];
    if (start !== -1 && end !== -1) {
      extractedData = JSON.parse(clean.substring(start, end + 1));
    }

    // STEP 5: Return 100% local results to the browser
    res.json({
      success: true,
      model_used: modelToUse,
      context: liveContext.substring(0, 500) + '...',
      data: extractedData
    });

  } catch (error) {
    console.error('Seek Engine Error:', error.message);
    res.status(500).json({ 
      error: \`Engine Error: \${error.message}. Ensure SearXNG (8888) and Ollama (11434) are running.\` 
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(\`?? Kara Seek Engine running locally on port \${PORT} (100% Free, 100% On-Prem)\`);
});
`;

fs.writeFileSync(path.join(engineDir, 'server.js'), serverCode, 'utf8');
console.log('? server.js created successfully.');

// 3. Create package.json
const pkgPath = path.join(engineDir, 'package.json');
const pkg = {
    name: "kara-seek-engine",
    version: "1.0.0",
    description: "100% Local, Free, On-Prem AI Search Backend",
    main: "server.js",
    scripts: {
        start: "node server.js"
    },
    dependencies: {
        express: "^4.18.2",
        cors: "^2.8.5",
        axios: "^1.6.0"
    }
};
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2), 'utf8');
console.log('? package.json created.');

// 4. Install dependencies
console.log('? Installing dependencies (express, cors, axios)...');
try {
    execSync('npm install', { cwd: engineDir, stdio: 'inherit' });
    console.log('? Dependencies installed successfully!');
} catch (error) {
    console.error('? Failed to install dependencies. Run "npm install" manually in the folder.');
}

console.log('?? Kara Seek Engine setup complete!');
