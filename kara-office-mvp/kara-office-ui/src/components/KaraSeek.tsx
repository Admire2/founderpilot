import { useState } from 'react';
import { Search, Zap, Database, Loader2 } from 'lucide-react';

export default function KaraSeek() {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState<any>(null);

  const executeMission = async () => {
    if (!prompt.trim()) return;
    setStatus('scanning');
    try {
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ((window as any).__karaAi || {}).model || 'qwen2.5:3b',
          prompt: `You are an autonomous research agent. Extract structured data based on this mission: "${prompt}". Output ONLY a raw JSON array of objects with keys: 'entity', 'metric', 'value'. No markdown.`,
          stream: false, temperature: 0.3
        })
      });
      const d = await res.json();
      let clean = (d.response || '').replace(/```json/g, '').replace(/```/g, '').trim();
      const start = clean.indexOf('['); const end = clean.lastIndexOf(']');
      if (start !== -1 && end !== -1) {
        const data = JSON.parse(clean.substring(start, end + 1));
        setResult(data);
        const bases = JSON.parse(localStorage.getItem('karaBaseData') || '[]');
        if (bases.length) {
          const b = bases[0];
          const textCol = b.cols.find((c: any) => c.type === 'text');
          data.forEach((row: any) => {
            b.rows.push({ id: 'seek' + Date.now().toString(36) + Math.random().toString(36).slice(2,4), cells: textCol ? { [textCol.id]: row.entity + ' | ' + row.metric + ': ' + row.value } : {} });
          });
          localStorage.setItem('karaBaseData', JSON.stringify(bases));
          window.dispatchEvent(new CustomEvent('kara-base-record', { detail: { title: 'Seek Mission' } }));
        }
        setStatus('done');
      } else { setStatus('error'); }
    } catch (e) { setStatus('error'); }
  };

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white p-8 overflow-y-auto">
      <h2 className="text-2xl font-bold flex items-center gap-3 mb-2"><Search className="text-cyan-400"/> Kara Seek <span className="text-xs bg-cyan-900 text-cyan-300 px-2 py-1 rounded">AUTONOMOUS AGENT</span></h2>
      <p className="text-slate-400 mb-6">Deploy the local AI to scan knowledge, extract structured data, and auto-inject it directly into Kara Base.</p>
      <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 mb-6">
        <label className="text-xs text-cyan-400 font-bold uppercase">Mission Parameters</label>
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g., Research the top 3 solar energy companies in Nigeria." className="w-full mt-2 bg-slate-900 border border-slate-600 rounded p-3 text-sm h-24 focus:ring-2 focus:ring-cyan-500 outline-none"/>
        <button onClick={executeMission} disabled={status === 'scanning'} className="mt-3 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded flex items-center gap-2 font-semibold disabled:opacity-50">
          {status === 'scanning' ? <><Loader2 className="animate-spin" size={16}/> Executing...</> : <><Zap size={16}/> Launch Mission</>}
        </button>
      </div>
      {status === 'done' && result && (
        <div className="bg-slate-800 p-4 rounded-lg border border-emerald-700">
          <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-2"><Database size={16}/> Mission Successful: Data Injected</h3>
          <div className="space-y-2">
            {result.map((r: any, i: number) => (
              <div key={i} className="bg-slate-900 p-2 rounded text-xs font-mono text-slate-300">
                <span className="text-cyan-400">{r.entity}</span> → {r.metric}: <span className="text-emerald-400">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {status === 'error' && <p className="text-red-400 text-sm">Mission failed. Ensure Ollama is running.</p>}
    </div>
  );
}