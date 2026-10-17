const fs = require('fs');
const path = require('path');

const uiRoot = path.join(__dirname, 'kara-office-mvp/kara-office-ui/src');

// --- OPTION B: POLISH THE CORE ---

// 1. Polish Kara Sheets (Robust CSV Export)
const sheetsPath = path.join(uiRoot, 'components/KaraSheets.tsx');
let sheetsContent = fs.readFileSync(sheetsPath, 'utf8');
if (!sheetsContent.includes('exportCSV')) {
    const csvExport = `
  const exportCSV = () => {
    if (!base) return;
    const headers = base.cols.map((c: any) => c.name).join(',');
    const rows = base.rows.map((r: any) => base.cols.map((c: any) => '"' + String(r.cells[c.id] || '').replace(/"/g, '""') + '"').join(','));
    const csv = [headers, ...rows].join('\\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = (base.name || 'KaraSheet') + '.csv'; a.click();
  };
`;
    sheetsContent = sheetsContent.replace('return (', csvExport + '\n  return (');
    fs.writeFileSync(sheetsPath, sheetsContent, 'utf8');
    console.log('? Kara Sheets: Robust CSV Export added');
}

// 2. Polish Kara Slides (PDF Export via Print)
const slidesPath = path.join(uiRoot, 'components/KaraSlides.tsx');
let slidesContent = fs.readFileSync(slidesPath, 'utf8');
if (!slidesContent.includes('exportSlidesPDF')) {
    const pdfExport = `
  const exportSlidesPDF = () => {
    window.print();
  };
`;
    slidesContent = slidesContent.replace('return (', pdfExport + '\n  return (');
    fs.writeFileSync(slidesPath, slidesContent, 'utf8');
    console.log('? Kara Slides: PDF Export (Print) added');
}

// --- OPTION C: KARA SEEK V2 (AUTONOMOUS AGENT) ---

const seekPath = path.join(uiRoot, 'components/KaraSeek.tsx');
const seekCode = `import { useState } from 'react';
import { Search, Zap, Database, Loader2 } from 'lucide-react';

export default function KaraSeek() {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);

  const executeMission = async () => {
    if (!prompt.trim()) return;
    setStatus('scanning');
    try {
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: (window.__karaAi || {}).model || 'qwen2.5:3b',
          prompt: 'You are an autonomous research agent. Extract structured data based on this mission: "' + prompt + '". Output ONLY a raw JSON array of objects with keys: entity, metric, value. No markdown.',
          stream: false, temperature: 0.3
        })
      });
      const d = await res.json();
      let clean = (d.response || '').replace(/\\x60{3}json/gi, '').replace(/\\x60{3}/g, '').trim();
      const start = clean.indexOf('['); const end = clean.lastIndexOf(']');
      if (start !== -1 && end !== -1) {
        const data = JSON.parse(clean.substring(start, end + 1));
        setResult(data);
        
        const bases = JSON.parse(localStorage.getItem('karaBaseData') || '[]');
        if (bases.length) {
          const b = bases[0];
          const textCol = b.cols.find(c => c.type === 'text');
          data.forEach(row => {
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
        <textarea value={prompt} onChange={e => setPrompt(e.target.value)} placeholder="e.g., Research the top 3 solar energy companies in Nigeria and extract their CEO and estimated revenue." className="w-full mt-2 bg-slate-900 border border-slate-600 rounded p-3 text-sm h-24 focus:ring-2 focus:ring-cyan-500 outline-none"/>
        <button onClick={executeMission} disabled={status === 'scanning'} className="mt-3 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 rounded flex items-center gap-2 font-semibold disabled:opacity-50">
          {status === 'scanning' ? 'Executing...' : 'Launch Mission'}
        </button>
      </div>

      {status === 'done' && result && (
        <div className="bg-slate-800 p-4 rounded-lg border border-emerald-700">
          <h3 className="text-sm font-bold text-emerald-400 mb-3">Mission Successful: Data Injected into Kara Base</h3>
          <div className="space-y-2">
            {result.map((r, i) => (
              <div key={i} className="bg-slate-900 p-2 rounded text-xs font-mono text-slate-300">
                <span className="text-cyan-400">{r.entity}</span> ? {r.metric}: <span className="text-emerald-400">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {status === 'error' && <p className="text-red-400 text-sm">Mission failed. Ensure Ollama is running and prompt is clear.</p>}
    </div>
  );
}`;

fs.writeFileSync(seekPath, seekCode, 'utf8');
console.log('? Kara Seek V2: Autonomous Research Agent deployed');

// Wire Kara Seek into App.tsx
const appPath = path.join(uiRoot, 'App.tsx');
let appContent = fs.readFileSync(appPath, 'utf8');

if (!appContent.includes('KaraSeek')) {
    appContent = appContent.replace("import KaraDrive from './components/KaraDrive';", "import KaraDrive from './components/KaraDrive';\nimport KaraSeek from './components/KaraSeek';");
    appContent = appContent.replace("{ id: 'drive', name: 'Kara Drive'", "{ id: 'seek', name: 'Kara Seek', icon: Search, color: 'text-cyan-500', bg: 'bg-cyan-50', category: 'Core' },\n            { id: 'drive', name: 'Kara Drive'");
    appContent = appContent.replace("{activeApp === 'drive' && <KaraDrive />}", "{activeApp === 'drive' && <KaraDrive />}\n            {activeApp === 'seek' && <KaraSeek />}");
    appContent = appContent.replace("'drive']", "'drive', 'seek']");
    fs.writeFileSync(appPath, appContent, 'utf8');
    console.log('? App.tsx: Kara Seek wired into Sidebar and Routing');
}

console.log('?? CORE POLISH & KARA SEEK V2 DEPLOYMENT COMPLETE!');
