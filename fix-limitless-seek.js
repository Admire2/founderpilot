const fs = require('fs');
const path = require('path');

// --- FIX 1: BACKEND (Simpler prompt for local AI) ---
const serverPath = path.join(__dirname, 'kara-seek-engine/server.js');
const serverCode = `const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

const SEARXNG_URL = 'http://localhost:8888';
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

    // SIMPLIFIED PROMPT: Just ask for a full answer.
    const aiRes = await axios.post(OLLAMA_URL, {
      model: modelToUse,
      prompt: \`Based on this LIVE SEARCH CONTEXT: "\${liveContext}"

Question: "\${prompt}"

CRITICAL: Answer EVERY part of the question fully. If asked for a list, list them all. Do not summarize.
Start your response with "ANSWER: " and then provide the full text. Do not use JSON.\`,
      stream: false,
      temperature: 0.3
    });

    const rawText = aiRes.data.response || '';
    
    // Parse the answer
    let answer = rawText;
    const match = rawText.match(/ANSWER:\s*([\s\S]*)/i);
    if (match) {
      answer = match[1].trim();
    }

    res.json({
      success: true,
      answer: answer,
      context: liveContext.substring(0, 500)
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(\`?? Kara Seek Engine running locally on port \${PORT}\`);
});
`;
fs.writeFileSync(serverPath, serverCode, 'utf8');
console.log('? Backend updated with simpler, more reliable prompt.');

// --- FIX 2: FRONTEND (Limitless, scrollable answer box) ---
const sidebarPath = path.join(__dirname, 'kara-browser-mvp/src/components/KaraSeekSidebar.tsx');
const sidebarCode = `import { useState } from 'react';
import { Search, Zap, Globe, Shield, ShieldOff, Loader2, AlertCircle } from 'lucide-react';

export default function KaraSeekSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [offlineMode, setOfflineMode] = useState(false);

  const executeMission = async () => {
    if (!prompt.trim()) return;
    setStatus('scanning');
    setError('');
    setResult(null);
    
    try {
      const res = await fetch('http://localhost:3001/api/seek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt, offlineMode: offlineMode })
      });
      
      if (!res.ok) throw new Error(\`Backend HTTP Error: \${res.status}\`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setResult(data);
      setStatus('done');
    } catch (e: any) {
      setStatus('error');
      setError(e.message || 'Unknown error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-[450px] bg-slate-900 text-white border-l border-slate-700 shadow-2xl z-50 flex flex-col">
      <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800">
        <h2 className="text-lg font-bold flex items-center gap-2 text-cyan-400"><Search size={20} /> Kara Seek</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white">?</button>
      </div>

      <div className="p-4 border-b border-slate-700 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1">
            {offlineMode ? <Shield size={14} className="text-emerald-400"/> : <ShieldOff size={14} className="text-slate-400"/>}
            {offlineMode ? '100% Sovereign (Offline)' : 'High-Flier (Local 3B)'}
          </span>
          <button 
            onClick={() => setOfflineMode(!offlineMode)}
            className={\`px-2 py-1 rounded text-xs font-bold \${offlineMode ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}\`}
          >Toggle</button>
        </div>
        
        <textarea 
          value={prompt} onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask anything (e.g., List African nations and count them)..."
          className="w-full h-20 bg-slate-800 border border-slate-600 rounded p-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none resize-none"
        />
        
        <button 
          onClick={executeMission} disabled={status === 'scanning'}
          className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 rounded flex items-center justify-center gap-2 font-semibold disabled:opacity-50 transition"
        >
          {status === 'scanning' ? <><Loader2 className="animate-spin" size={16}/> Analyzing...</> : <><Zap size={16}/> Launch Mission</>}
        </button>
      </div>

      {/* LIMITLESS SCROLLABLE RESULTS AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="bg-red-900/30 border border-red-700 p-3 rounded text-xs text-red-300 flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" /><span>{error}</span>
          </div>
        )}

        {status === 'done' && result && (
          <>
            {result.context && (
              <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 flex items-center gap-1"><Globe size={10}/> Live Search Context</p>
                <p className="text-xs text-slate-300 italic line-clamp-3">{result.context}</p>
              </div>
            )}
            
            {/* THE LIMITLESS ANSWER BOX */}
            {result.answer && (
              <div className="bg-slate-800 p-4 rounded border border-emerald-700/50">
                <p className="text-[10px] text-emerald-400 uppercase font-bold mb-2">Comprehensive Answer</p>
                <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed break-words max-h-[60vh] overflow-y-auto pr-2">
                  {result.answer}
                </div>
              </div>
            )}
          </>
        )}
        
        {status === 'idle' && !error && (
          <div className="text-center text-slate-500 text-sm mt-8">
            <Globe size={32} className="mx-auto mb-2 opacity-50" />
            <p>Ready to search the sovereign web.</p>
          </div>
        )}
      </div>
    </div>
  );
}`;
fs.writeFileSync(sidebarPath, sidebarCode, 'utf8');
console.log('? Frontend updated with limitless, scrollable answer box.');
console.log('?? Fix complete!');
