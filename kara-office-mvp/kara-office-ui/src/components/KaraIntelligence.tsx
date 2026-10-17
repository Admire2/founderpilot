import { useEffect, useState } from 'react';
import { getArtifacts, publishArtifact } from '../lib/intelligence';
import type { Artifact } from '../lib/intelligence';
import { getAiSettings, applyAiSettings } from '../lib/aiSettings';

export default function KaraIntelligence({ onClose, onToWord, onToSlides }: { onClose: () => void; onToWord: (t: string) => void; onToSlides: (t: string) => void }) {
  const [items, setItems] = useState<Artifact[]>([]);
  const [sel, setSel] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const [ai, setAi] = useState(getAiSettings());
  const [ollamaOn, setOllamaOn] = useState<boolean | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const refresh = () => setItems(getArtifacts());
    refresh();
    window.addEventListener('kara-intel-updated', refresh);
    fetch('http://localhost:11434/api/tags').then(() => setOllamaOn(true)).catch(() => setOllamaOn(false));
    return () => window.removeEventListener('kara-intel-updated', refresh);
  }, []);

  const saveAi = () => { applyAiSettings(ai); alert('Sovereign AI settings applied suite-wide.'); };

  const combined = async () => {
    const chosen = items.filter(i => sel[i.id]);
    if (chosen.length < 2) { alert('Select at least two artifacts (checkboxes) for a combined report.'); return; }
    setBusy(true);
    const bundle = chosen.map(c => '### ' + c.kind.toUpperCase() + ' - ' + c.title + '\n' + c.text.slice(0, 4000)).join('\n\n');
    let summary = '';
    try {
      const res = await fetch('http://localhost:11434/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: ((window as any).__karaAi || {}).model || 'qwen2.5:3b', prompt: 'Write a 5-sentence executive summary combining the following Kara Office artifacts.\n\n' + bundle, stream: false, temperature: ((window as any).__karaAi || {}).temperature ?? 0.7 }) });
      const d = await res.json();
      summary = (d.response || '').trim();
    } catch (e) { summary = '(AI offline - raw combined report below)'; }
    const report = 'KARA OFFICE INTELLIGENCE - COMBINED REPORT\n' + new Date().toLocaleString() + '\n\nEXECUTIVE SUMMARY (AI):\n' + summary + '\n\n' + bundle;
    publishArtifact('report', 'Combined Report (' + chosen.length + ' sources)', report);
    onToWord(report);
    setBusy(false);
  };

  const downloadArtifact = (it: Artifact) => {
    const blob = new Blob([it.text], { type: 'text/plain' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = it.title.replace(/[^a-z0-9]/gi, '_') + '.txt'; a.click();
  };

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white border-l border-slate-300 shadow-2xl z-50 flex flex-col">
      <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white">
        <b className="text-sm">Kara Office Intelligence</b>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowSettings(!showSettings)} className="text-[10px] px-2 py-1 bg-slate-700 rounded hover:bg-slate-600">AI Settings</button>
          <button onClick={onClose} className="text-slate-300 hover:text-white">✕</button>
        </div>
      </div>

      {showSettings && (
        <div className="p-3 border-b border-slate-200 bg-slate-50 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">Sovereign AI Control</span>
            <span className={ollamaOn ? 'text-emerald-600 font-semibold' : 'text-red-500 font-semibold'}>{ollamaOn === null ? 'checking...' : ollamaOn ? '● Ollama ONLINE' : '● Ollama OFFLINE'}</span>
          </div>
          <label className="text-[10px] text-slate-500">Model</label>
          <select value={ai.model} onChange={e => setAi(p => ({ ...p, model: e.target.value }))} className="w-full border border-slate-200 rounded text-xs p-1.5">
            <option value="qwen2.5:3b">qwen2.5:3b (fast, default)</option>
            <option value="qwen2.5:7b">qwen2.5:7b (smarter)</option>
            <option value="llama3.1:8b">llama3.1:8b</option>
            <option value="mistral:7b">mistral:7b</option>
          </select>
          <label className="text-[10px] text-slate-500">Creativity (temperature): {ai.temperature}</label>
          <input type="range" min="0" max="1.5" step="0.1" value={ai.temperature} onChange={e => setAi(p => ({ ...p, temperature: Number(e.target.value) }))} className="w-full" />
          <button onClick={saveAi} className="w-full px-2 py-1.5 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700">Apply Suite-Wide</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {items.length === 0 && <p className="text-xs text-slate-400">No artifacts yet. Use "Publish" in Word / Sheets / Slides / Base, or run a Seek mission.</p>}
        {items.map(it => (
          <div key={it.id} className="border border-slate-200 rounded p-2 bg-slate-50">
            <div className="flex items-start gap-2">
              <input type="checkbox" checked={!!sel[it.id]} onChange={() => setSel(s => ({ ...s, [it.id]: !s[it.id] }))} className="mt-1" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-slate-800 truncate">[{it.kind}] {it.title}</p>
                <p className="text-[10px] text-slate-400">{new Date(it.ts).toLocaleString()} • {it.text.length} chars</p>
              </div>
            </div>
            <div className="flex gap-1 mt-2">
              <button onClick={() => onToWord(it.text)} className="px-2 py-1 bg-blue-600 text-white text-[10px] rounded">To Word</button>
              <button onClick={() => onToSlides(it.text)} className="px-2 py-1 bg-orange-600 text-white text-[10px] rounded">To Slides</button>
              <button onClick={() => downloadArtifact(it)} className="px-2 py-1 bg-slate-600 text-white text-[10px] rounded">Download</button>
            </div>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-slate-200 flex gap-2">
        <button onClick={combined} disabled={busy} className="flex-1 px-3 py-2 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 disabled:opacity-50">{busy ? 'Composing...' : 'Combined Report (AI)'}</button>
        <button onClick={onClose} className="px-3 py-2 bg-slate-200 text-slate-700 text-xs rounded">Close</button>
      </div>
    </div>
  );
}
