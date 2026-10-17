const fs = require('fs');
const path = require('path');

const seekPath = path.join(__dirname, 'kara-office-mvp/kara-office-ui/src/components/KaraSeek.tsx');

const newCode = `import { useState } from 'react';
import { Search, Zap, Database, Loader2, AlertCircle, Globe } from 'lucide-react';

export default function KaraSeek() {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [searchContext, setSearchContext] = useState('');

  const executeMission = async () => {
    if (!prompt.trim()) return;
    setStatus('scanning');
    setError('');
    setResult(null);
    setSearchContext('');
    
    try {
      // 1. Fetch from SearXNG (Port 8888 based on your Docker screenshot)
      const searchQuery = encodeURIComponent(prompt);
      const searxngURL = 'http://localhost:8888'; 
      const searchRes = await fetch(\`\${searxngURL}/search?q=\${searchQuery}&format=json\`);
      
      if (!searchRes.ok) throw new Error(\`SearXNG HTTP Error: \${searchRes.status}\`);
      
      const searchData = await searchRes.json();
      let liveContext = '';
      if (searchData.results && searchData.results.length > 0) {
        liveContext = searchData.results.slice(0, 10).map((r: any) => \`\${r.title}: \${r.content || ''}\`).join('\\n');
      }
      if (!liveContext) liveContext = "No live search results found.";
      setSearchContext(liveContext.substring(0, 1500));

      // 2. Send to Local Ollama (Port 11434)
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen2.5:3b',
          prompt: \`Based on this LIVE SEARCH CONTEXT: "\${liveContext}". Mission: "\${prompt}". Extract structured data. Output ONLY a raw JSON array of objects with keys: "entity", "metric", "value". If no data, output []. No markdown.\`,
          stream: false,
          temperature: 0.2
        })
      });
      
      if (!res.ok) throw new Error(\`Ollama HTTP Error: \${res.status}\`);
      
      const d = await res.json();
      const rawText = d.response || '';
      let clean = rawText.replace(/\\\`\\\`\\\`json/gi, '').replace(/\\\`\\\`\\\`/g, '').trim();
      const start = clean.indexOf('[');
      const end = clean.lastIndexOf(']');
      
      if (start === -1 || end === -1) throw new Error('AI did not return valid JSON. Raw: ' + rawText.substring(0, 150));
      
      const data = JSON.parse(clean.substring(start, end + 1));
      if (data.length === 0) throw new Error('SearXNG found results, but AI could not extract structured data.');

      setResult(data);
      
      // 3. Auto-inject into Kara Base
      const bases = JSON.parse(localStorage.getItem('karaBaseData') || '[]');
      if (bases.length) {
        const b = bases[0];
        const textCol = b.cols.find((c: any) => c.type === 'text');
        data.forEach((row: any) => {
          b.rows.push({ 
            id: 'seek' + Date.now().toString(36) + Math.random().toString(36).slice(2,4), 
            cells: textCol ? { [textCol.id]: \`\${row.entity} | \${row.metric}: \${row.value}\` } : {} 
          });
        });
        localStorage.setItem('karaBaseData', JSON.stringify(bases));
        window.dispatchEvent(new CustomEvent('kara-base-record', { detail: { title: 'Seek Mission' } }));
      }
      setStatus('done');
    } catch (e: any) {
      setStatus('error');
      setError(e.message || 'Unknown error');
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white p-8 overflow-y-auto">
      <h2 className="text-2xl font-bold flex items-center gap-3 mb-2">
        <Search className="text-cyan-400"/> Kara Seek 
        <span className="text-xs bg-cyan-900 text-cyan-300 px-2 py-1 rounded flex items-center gap-1">
          <Globe size={12}/> SEARXNG + LOCAL AI
        </span>
      </h2>
      <p className="text-slate-400 mb-6">Fetches live web data via SearXNG, then uses local AI to extract structured JSON.</p>
      
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6">
        <label className="text-xs text-cyan-400 font-bold uppercase">Mission Parameters</label>
        <textarea 
          value={prompt} 
          onChange={e => setPrompt(e.target.value)} 
          placeholder="e.g., Top 3 solar energy companies in Nigeria CEO revenue" 
          className="w-full mt-2 bg-slate-900 border border-slate-600 rounded p-3 text-sm h-24 focus:ring-2 focus:ring-cyan-500 outline-none"
        />
        <button 
          onClick={executeMission} 
          disabled={status === 'scanning'} 
          className="mt-3 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded flex items-center gap-2 font-semibold disabled:opacity-50"
        >
          {status === 'scanning' ? <><Loader2 className="animate-spin" size={16}/> Searching & Analyzing...</> : <><Zap size={16}/> Launch Mission</>}
        </button>
      </div>

      {searchContext && status !== 'idle' && (
        <div className="bg-slate-800/50 p-3 rounded-lg border border-slate-700 mb-4">
          <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Live SearXNG Context:</p>
          <p className="text-xs text-slate-300 italic whitespace-pre-wrap">{searchContext}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/30 border border-red-700 p-4 rounded-lg mb-4">
          <h3 className="text-sm font-bold text-red-400 mb-2 flex items-center gap-2">
            <AlertCircle size={16}/> Engine Error
          </h3>
          <p className="text-xs text-red-300 font-mono break-words">{error}</p>
        </div>
      )}

      {status === 'done' && result && (
        <div className="bg-slate-800 p-4 rounded-lg border border-emerald-700">
          <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2">
            <Database size={16}/> Mission Successful: Data Injected into Kara Base
          </h3>
          <div className="space-y-2">
            {result.map((r: any, i: number) => (
              <div key={i} className="bg-slate-900 p-2 rounded text-xs font-mono text-slate-300">
                <span className="text-cyan-400">{r.entity}</span> ? {r.metric}: <span className="text-emerald-400">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}`;

fs.writeFileSync(seekPath, newCode);
console.log('? KaraSeek.tsx forcefully updated to V4 (SearXNG 8888 + Ollama 11434)');
