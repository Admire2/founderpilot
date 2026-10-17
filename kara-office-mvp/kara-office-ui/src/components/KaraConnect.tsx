import { useState, useEffect } from 'react';
import { Zap, Plus, Trash2, Play, Pause, Flame } from 'lucide-react';

type Rule = { id: string; triggerApp: string; triggerEvent: string; actionApp: string; actionType: string; active: boolean; condition?: string; schedule?: string };
const KEY = 'karaConnectRules';
const LOG_KEY = 'karaConnectLog';
const triggerMap: Record<string, string> = {
  'Kara Base|Record Created': 'kara-base-record',
  'Kara Calendar|Event Scheduled': 'kara-calendar-event',
  'Kara Intelligence|Artifact Published': 'kara-intel-updated',
  'Kara Flow|Task Completed': 'kara-flow-task-done',
  'Kara Design|Design Exported': 'kara-design-export',
};
const eventsFor: Record<string, string[]> = {
  'Kara Base': ['Record Created'],
  'Kara Calendar': ['Event Scheduled'],
  'Kara Intelligence': ['Artifact Published'],
  'Kara Flow': ['Task Completed'],
  'Kara Design': ['Design Exported'],
};

export default function KaraConnect() {
  const [rules, setRules] = useState<Rule[]>(() => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } });
  const [logItems, setLogItems] = useState<{ ts: number; msg: string }[]>(() => { try { return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); } catch { return []; } });
  const [form, setForm] = useState({ triggerApp: 'Kara Base', triggerEvent: 'Record Created', actionApp: 'Kara Flow', actionType: 'Create Task', condition: '', schedule: 'none' });

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(rules)); }, [rules]);
  useEffect(() => {
    const refresh = () => { try { setLogItems(JSON.parse(localStorage.getItem(LOG_KEY) || '[]')); } catch (e) {} };
    window.addEventListener('kara-connect-log', refresh);
    return () => window.removeEventListener('kara-connect-log', refresh);
  }, []);

  const addRule = () => { setRules([...rules, { id: Date.now().toString(36), triggerApp: form.triggerApp, triggerEvent: form.triggerEvent, actionApp: form.actionApp, actionType: form.actionType, active: true, condition: form.condition || undefined, schedule: form.schedule }]); };
  const toggle = (id: string) => setRules(rules.map(r => r.id === id ? { ...r, active: !r.active } : r));
  const del = (id: string) => setRules(rules.filter(r => r.id !== id));
  const testFire = (r: Rule) => {
    const evt = triggerMap[r.triggerApp + '|' + r.triggerEvent];
    if (!evt) { alert('No live trigger for this combination.'); return; }
    window.dispatchEvent(new CustomEvent(evt, { detail: { title: 'TEST from Kara Connect' } }));
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 p-6 overflow-y-auto">
      <h2 className="text-xl font-bold text-slate-800 mb-1 flex items-center gap-2"><Zap className="text-amber-500"/> Kara Connect (Sovereign Automation)</h2>
      <p className="text-sm text-slate-500 mb-5">Rules execute locally and instantly. Add conditions ("only if contains...") and daily schedules.</p>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Create New Rule</h3>
        <div className="flex items-center gap-2 flex-wrap mb-2">
          <span className="text-sm font-medium text-slate-600">When</span>
          <select value={form.triggerApp} onChange={e => setForm(p => ({ ...p, triggerApp: e.target.value, triggerEvent: (eventsFor[e.target.value] || [''])[0] }))} className="border border-slate-200 rounded px-2 py-1.5 text-sm">
            {Object.keys(eventsFor).map(k => <option key={k}>{k}</option>)}
          </select>
          <select value={form.triggerEvent} onChange={e => setForm(p => ({ ...p, triggerEvent: e.target.value }))} className="border border-slate-200 rounded px-2 py-1.5 text-sm">
            {(eventsFor[form.triggerApp] || []).map(ev => <option key={ev}>{ev}</option>)}
          </select>
          <span className="text-sm font-medium text-slate-600">Then</span>
          <select value={form.actionApp} onChange={e => setForm(p => ({ ...p, actionApp: e.target.value }))} className="border border-slate-200 rounded px-2 py-1.5 text-sm">
            <option>Kara Flow</option><option>Kara Calendar</option><option>Kara Base</option><option>Kara Intelligence</option>
          </select>
          <select value={form.actionType} onChange={e => setForm(p => ({ ...p, actionType: e.target.value }))} className="border border-slate-200 rounded px-2 py-1.5 text-sm">
            <option>Create Task</option><option>Create Event</option><option>Create Record</option><option>Publish Artifact</option>
          </select>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-slate-600">Only if contains:</span>
          <input value={form.condition} onChange={e => setForm(p => ({ ...p, condition: e.target.value }))} placeholder="optional keyword filter" className="border border-slate-200 rounded px-2 py-1.5 text-sm w-48"/>
          <span className="text-sm font-medium text-slate-600">Schedule:</span>
          <select value={form.schedule} onChange={e => setForm(p => ({ ...p, schedule: e.target.value }))} className="border border-slate-200 rounded px-2 py-1.5 text-sm">
            <option value="none">Event-only</option>
            <option value="daily">Also daily</option>
          </select>
          <button onClick={addRule} className="px-3 py-1.5 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 flex items-center gap-1"><Plus size={14}/> Save Rule</button>
        </div>
      </div>

      <div className="space-y-3 mb-6">
        {rules.length === 0 && <p className="text-sm text-slate-400 text-center py-6">No rules yet. Build your first automation above.</p>}
        {rules.map(r => (
          <div key={r.id} className={`bg-white p-4 rounded-lg border flex items-center justify-between gap-3 ${r.active ? 'border-amber-200 shadow-sm' : 'border-slate-200 opacity-60'}`}>
            <div className="text-sm flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Zap size={16} className={r.active ? 'text-amber-500' : 'text-slate-400'} />
                <span>When <b className="text-indigo-600">{r.triggerApp}</b> {r.triggerEvent.toLowerCase()}</span>
                <span className="text-slate-400">→</span>
                <span><b className="text-indigo-600">{r.actionApp}</b> will {r.actionType.toLowerCase()}</span>
              </div>
              <div className="text-[10px] text-slate-400">
                {r.condition ? 'Filter: contains "' + r.condition + '" • ' : ''}{r.schedule === 'daily' ? 'Runs daily + on event' : 'Event-only'}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => testFire(r)} title="Test fire" className="p-2 text-slate-400 hover:text-orange-600"><Flame size={16}/></button>
              <button onClick={() => toggle(r.id)} title={r.active ? 'Disable' : 'Enable'} className="p-2 text-slate-400 hover:text-amber-600">{r.active ? <Play size={16} className="text-amber-500"/> : <Pause size={16}/>}</button>
              <button onClick={() => del(r.id)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-2">Execution Log (live)</h3>
        {logItems.length === 0 && <p className="text-xs text-slate-400">No executions yet.</p>}
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {logItems.map((l, i) => <p key={i} className="text-[11px] font-mono text-slate-600">{new Date(l.ts).toLocaleTimeString()} — {l.msg}</p>)}
        </div>
      </div>
    </div>
  );
}
