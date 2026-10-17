import { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { emitFlowEvent } from '../lib/automate';
import { publishArtifact } from '../lib/intelligence';

type Col = { id: string; name: string; type: 'text' | 'number' | 'select' | 'check'; options?: string[] };
type Row = { id: string; cells: Record<string, any> };
type Base = { id: string; name: string; cols: Col[]; rows: Row[] };
const KEY = 'karaBaseData';

export default function KaraBase() {
  const [bases, setBases] = useState<Base[]>(() => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [view, setView] = useState<'grid' | 'kanban'>('grid');
  const [newCol, setNewCol] = useState({ name: '', type: 'text' });

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(bases)); }, [bases]);
  const base = bases.find(b => b.id === activeId) || null;
  const update = (fn: (b: Base) => Base) => setBases(bs => bs.map(b => b.id === activeId ? fn(b) : b));

  const addBase = () => { const b: Base = { id: Date.now().toString(36), name: 'Base ' + (bases.length + 1), cols: [{ id: 'c1', name: 'Name', type: 'text' }, { id: 'c2', name: 'Status', type: 'select', options: ['Todo', 'Doing', 'Done'] }], rows: [] }; setBases([b, ...bases]); setActiveId(b.id); };
  const addCol = () => { const nm = newCol.name.trim() || ('Column ' + ((base?.cols.length || 0) + 1)); update(b => ({ ...b, cols: [...b.cols, { id: 'c' + Date.now().toString(36), name: nm, type: newCol.type as Col['type'], options: newCol.type === 'select' ? ['A', 'B', 'C'] : undefined }] })); setNewCol({ name: '', type: 'text' }); };
  const addRow = () => { update(b => ({ ...b, rows: [...b.rows, { id: 'r' + Date.now().toString(36), cells: {} }] })); emitFlowEvent('Kara Base', 'Record Created', { base: base?.name }); };
  const setCell = (rid: string, cid: string, v: any) => update(b => ({ ...b, rows: b.rows.map(r => r.id === rid ? { ...r, cells: { ...r.cells, [cid]: v } } : r) }));
  const delRow = (rid: string) => update(b => ({ ...b, rows: b.rows.filter(r => r.id !== rid) }));
  const delBase = (id: string) => { setBases(bs => bs.filter(b => b.id !== id)); if (activeId === id) setActiveId(null); };

  const loadSample = () => {
    const cols: Col[] = [
      { id: 'c1', name: 'Task', type: 'text' },
      { id: 'c2', name: 'Status', type: 'select', options: ['Todo', 'Doing', 'Done'] },
      { id: 'c3', name: 'Owner', type: 'text' },
      { id: 'c4', name: 'Budget (NGN)', type: 'number' },
      { id: 'c5', name: 'Approved', type: 'check' },
    ];
    const rows: Row[] = [
      { id: 'r1', cells: { c1: 'Deploy Kara Office to Lekki HQ', c2: 'Doing', c3: 'IT Division', c4: 4500000, c5: true } },
      { id: 'r2', cells: { c1: 'Train 200 staff on Kara Word + Sheets', c2: 'Todo', c3: 'HR Training', c4: 1200000, c5: true } },
      { id: 'r3', cells: { c1: 'Migrate legacy Excel models to Kara Sheets Quant', c2: 'Todo', c3: 'Finance', c4: 800000, c5: false } },
      { id: 'r4', cells: { c1: 'Pilot Kara Mail for procurement desk', c2: 'Doing', c3: 'Procurement', c4: 350000, c5: true } },
      { id: 'r5', cells: { c1: 'Board demo deck via Kara Slides AI Builder', c2: 'Done', c3: 'CEO Office', c4: 0, c5: true } },
      { id: 'r6', cells: { c1: 'Air-gap sync drill with Kara Sync bundles', c2: 'Todo', c3: 'Security', c4: 150000, c5: false } },
    ];
    const b: Base = { id: Date.now().toString(36), name: 'Dangote Rollout Plan', cols, rows };
    setBases(bs => [b, ...bs]); setActiveId(b.id); setView('grid');
  };

  const exportJSON = () => { if (!base) return; const blob = new Blob([JSON.stringify(base, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = base.name.replace(/[^a-z0-9]/gi, '_') + '.karaBase.json'; a.click(); };
  const exportCSV = () => { if (!base) return; const esc = (v: any) => '"' + String(v ?? '').replace(/"/g, '""') + '"'; const lines = [base.cols.map(c => esc(c.name)).join(',')].concat(base.rows.map(r => base.cols.map(c => esc(r.cells[c.id])).join(','))); const blob = new Blob([lines.join('\n')], { type: 'text/csv' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = base.name.replace(/[^a-z0-9]/gi, '_') + '.csv'; a.click(); };
  const importFile = (f: File) => {
    f.text().then(txt => {
      try {
        if (f.name.endsWith('.json')) {
          const obj = JSON.parse(txt);
          if (obj.cols && obj.rows) { obj.id = Date.now().toString(36); setBases(bs => [obj, ...bs]); setActiveId(obj.id); alert('Base imported from JSON.'); }
          else alert('JSON must be a Kara Base export (with cols and rows).');
        } else {
          const rows = txt.split(/\r?\n/).filter(l => l.trim());
          const parse = (l: string) => { const out: string[] = []; let cur = '', q = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (q) { if (ch === '"') { if (l[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += ch; } else { if (ch === '"') q = true; else if (ch === ',') { out.push(cur); cur = ''; } else cur += ch; } } out.push(cur); return out; };
          const head = parse(rows[0]);
          const cols: Col[] = head.map((h, i) => ({ id: 'c' + (i + 1), name: h || ('Col ' + (i + 1)), type: 'text' }));
          const dataRows: Row[] = rows.slice(1).map((r, ri) => { const cells: Record<string, any> = {}; parse(r).forEach((v, i) => { if (cols[i]) cells[cols[i].id] = v; }); return { id: 'r' + Date.now().toString(36) + ri, cells }; });
          const b: Base = { id: Date.now().toString(36), name: f.name.replace(/\.[^.]+$/, ''), cols, rows: dataRows };
          setBases(bs => [b, ...bs]); setActiveId(b.id);
          alert('CSV imported as new base: ' + dataRows.length + ' rows.');
        }
      } catch (e) { alert('Import failed: ' + (e as any).message); }
    });
  };

  const sendToFlow = () => {
    if (!base) return;
    const textCol = base.cols.find(c => c.type === 'text');
    const tasks = base.rows.map(r => ({ id: 'bf' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), title: String(r.cells[textCol ? textCol.id : ''] || 'Base task'), assignee: 'Kara Base', status: 'todo', due: '' }));
    try { const cur = JSON.parse(localStorage.getItem('karaFlowTasks') || '[]'); localStorage.setItem('karaFlowTasks', JSON.stringify([...tasks, ...cur])); } catch (e) {}
    window.dispatchEvent(new CustomEvent('kara-navigate', { detail: { app: 'flow' } }));
    alert(tasks.length + ' tasks sent to Kara Flow.');
  };

  const publishBase = () => {
    if (!base) return;
    const lines = [base.cols.map(c => c.name).join(',')].concat(base.rows.map(r => base.cols.map(c => String(r.cells[c.id] ?? '')).join(',')));
    publishArtifact('base', base.name + ' (table)', lines.join('\n'));
    alert('Base published to Kara Intelligence. Open the Kara Intelligence drawer (top bar) to route it to Word, Slides, or a Combined Report.');
  };

  const [briefing, setBriefing] = useState(false);
  const aiBrief = async () => {
    if (!base) return;
    setBriefing(true);
    const summaryRows = base.rows.map(r => base.cols.map(c => c.name + ': ' + String(r.cells[c.id] ?? '-')).join(' | ')).join('\n');
    try {
      const res = await fetch('http://localhost:11434/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: ((window as any).__karaAi || {}).model || 'qwen2.5:3b', prompt: 'Summarize this project database into a 5-bullet executive brief including total budget and top risks:\n' + summaryRows, stream: false, temperature: ((window as any).__karaAi || {}).temperature ?? 0.7 }) });
      const d = await res.json();
      publishArtifact('base', base.name + ' (AI brief)', d.response || '');
      alert('AI brief published to Kara Intelligence.');
    } catch (e) { alert('AI offline. Start Ollama.'); }
    setBriefing(false);
  };

  const selectCol = base?.cols.find(c => c.type === 'select');
  const firstText = base?.cols.find(c => c.type === 'text');

  return (
    <div className="flex h-full bg-slate-50">
      <div className="w-52 bg-white border-r border-slate-200 flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-slate-200">
          <button onClick={addBase} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"><Plus size={14}/> New Base</button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {bases.map(b => (
            <div key={b.id} className={`flex items-center gap-1 px-2 py-2 rounded cursor-pointer text-sm ${b.id === activeId ? 'bg-indigo-50 text-indigo-800 font-semibold' : 'hover:bg-slate-100 text-slate-700'}`}>
              <button onClick={() => setActiveId(b.id)} className="flex-1 text-left truncate">{b.name}</button>
              <button onClick={() => delBase(b.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={12}/></button>
            </div>
          ))}
        </div>
        <div className="p-3 text-[10px] text-slate-400 border-t border-slate-200">Kara Base v1 - sovereign relational engine</div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {!base ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">Create a base to start structuring your data.</div>
        ) : (
          <>
            <div className="bg-white border-b border-slate-200 p-2 flex items-center gap-2 flex-wrap flex-shrink-0">
              <button onClick={() => setView('grid')} className={`px-3 py-1.5 text-xs rounded ${view === 'grid' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>Grid</button>
              <button onClick={() => setView('kanban')} className={`px-3 py-1.5 text-xs rounded ${view === 'kanban' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}>Kanban</button>
              <div className="h-5 w-px bg-slate-200"></div>
              <input value={newCol.name} onChange={e => setNewCol(p => ({ ...p, name: e.target.value }))} placeholder="New column name" className="border border-slate-200 rounded text-xs py-1 px-2 w-40"/>
              <select value={newCol.type} onChange={e => setNewCol(p => ({ ...p, type: e.target.value }))} className="border border-slate-200 rounded text-xs py-1 px-2">
                <option value="text">Text</option><option value="number">Number</option><option value="select">Select</option><option value="check">Checkbox</option>
              </select>
              <button onClick={addCol} title="Type a name above, or leave blank for auto-name" className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded hover:bg-indigo-200 border border-indigo-200">Add Column</button>
              <button onClick={addRow} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 flex items-center gap-1"><Plus size={12}/> Add Row</button>
              <button onClick={loadSample} className="px-3 py-1.5 bg-teal-600 text-white text-xs rounded hover:bg-teal-700">Sample Data</button>
              <button onClick={publishBase} className="px-3 py-1.5 bg-slate-800 text-white text-xs rounded hover:bg-slate-700">Publish</button>
              <button onClick={aiBrief} className="px-3 py-1.5 bg-purple-600 text-white text-xs rounded hover:bg-purple-700">{briefing ? 'Briefing...' : 'AI Brief'}</button>
              <label className="px-3 py-1.5 bg-slate-600 text-white text-xs rounded hover:bg-slate-500 cursor-pointer">Import<input type="file" accept=".json,.csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) importFile(f); e.target.value = ''; }} /></label>
              <button onClick={exportJSON} className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs rounded hover:bg-slate-300">Export JSON</button>
              <button onClick={exportCSV} className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs rounded hover:bg-slate-300">Export CSV</button>
              <button onClick={sendToFlow} className="px-3 py-1.5 bg-amber-600 text-white text-xs rounded hover:bg-amber-700">Send to Flow</button>
              <span className="text-[10px] text-slate-400 ml-auto">{base.rows.length} records - stored locally</span>
            </div>

            {view === 'grid' && (
              <div className="flex-1 overflow-auto p-4">
                <table className="w-full bg-white border border-slate-200 rounded text-sm">
                  <thead><tr className="bg-slate-100 text-left">
                    {base.cols.map(c => <th key={c.id} className="p-2 border-b border-slate-200 text-xs font-semibold text-slate-600">{c.name} <span className="text-slate-400">({c.type})</span></th>)}
                    <th className="p-2 border-b border-slate-200 w-8"></th>
                  </tr></thead>
                  <tbody>
                    {base.rows.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50">
                        {base.cols.map(c => (
                          <td key={c.id} className="p-1 border-b border-slate-100">
                            {c.type === 'check' ? <input type="checkbox" checked={!!r.cells[c.id]} onChange={e => setCell(r.id, c.id, e.target.checked)} className="ml-2"/>
                              : c.type === 'select' ? <select value={r.cells[c.id] || ''} onChange={e => setCell(r.id, c.id, e.target.value)} className="w-full border-none bg-transparent text-sm p-1">
                                  <option value=""></option>{(c.options || []).map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                              : <input type={c.type === 'number' ? 'number' : 'text'} value={r.cells[c.id] || ''} onChange={e => setCell(r.id, c.id, e.target.value)} className="w-full border-none bg-transparent text-sm p-1 outline-none focus:bg-indigo-50"/>}
                          </td>
                        ))}
                        <td className="p-1 border-b border-slate-100 text-center"><button onClick={() => delRow(r.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={12}/></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {view === 'kanban' && (
              <div className="flex-1 overflow-auto p-4 flex gap-3 items-start">
                {(selectCol?.options || ['Uncategorized']).map(opt => (
                  <div key={opt} className="w-64 bg-slate-100 rounded p-2 flex-shrink-0">
                    <div className="text-xs font-bold text-slate-600 mb-2">{opt} ({base.rows.filter(r => (r.cells[selectCol?.id || ''] || 'Uncategorized') === opt).length})</div>
                    {base.rows.filter(r => (r.cells[selectCol?.id || ''] || 'Uncategorized') === opt).map(r => (
                      <div key={r.id} onClick={() => setView('grid')} className="bg-white rounded shadow-sm p-2 mb-2 text-xs cursor-pointer hover:shadow-md">
                        <div className="font-semibold text-slate-800">{r.cells[firstText?.id || ''] || '(untitled)'}</div>
                        {base.cols.filter(c => c.id !== firstText?.id && c.type !== 'select').slice(0, 3).map(c => (
                          <div key={c.id} className="text-slate-500 mt-1">{c.name}: {String(r.cells[c.id] ?? '-')}</div>
                        ))}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}






