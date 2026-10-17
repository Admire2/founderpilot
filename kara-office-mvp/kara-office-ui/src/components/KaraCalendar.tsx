import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Download, Upload } from 'lucide-react';
import { emitFlowEvent } from '../lib/automate';

type Ev = { id: string; title: string; date: string; time: string; source?: string };
const KEY = 'karaCalendarEvents';
const iso = (d: Date) => d.toISOString().slice(0, 10);

export default function KaraCalendar() {
  const [events, setEvents] = useState<Ev[]>(() => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } });
  const [cursor, setCursor] = useState(new Date());
  const [sel, setSel] = useState(iso(new Date()));
  const [form, setForm] = useState({ title: '', time: '09:00' });

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(events)); }, [events]);
  useEffect(() => {
    const p = localStorage.getItem('karaCalendarPending');
    if (p) { try { const e = JSON.parse(p); setEvents(ev => [{ id: Date.now().toString(36), ...e }, ...ev]); setSel(e.date); } catch (err) {} localStorage.removeItem('karaCalendarPending'); }
  }, []);

  const y = cursor.getFullYear(), m = cursor.getMonth();
  const offset = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells: (number | null)[] = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  const dayEvents = events.filter(e => e.date === sel).sort((a, b) => a.time.localeCompare(b.time));
  const exportEvents = () => { const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'kara-calendar-' + Date.now() + '.json'; a.click(); };
  const importEvents = (f: File) => { f.text().then(t => { try { const arr = JSON.parse(t); if (Array.isArray(arr) && arr.every((x: any) => x && x.title && x.date)) { setEvents(prev => [...arr.map((x: any, i: number) => ({ id: String(x.id || Date.now() + i), title: String(x.title), date: String(x.date), time: String(x.time || '09:00'), source: x.source || 'import' })), ...prev]); alert('Imported ' + arr.length + ' events.'); } else { alert('JSON must be a Kara Calendar export.'); } } catch (e) { alert('Import failed: ' + (e as any).message); } }); };

  const addEvent = () => { if (!form.title) return; setEvents(ev => [{ id: Date.now().toString(36), title: form.title, date: sel, time: form.time, source: 'Kara Calendar' }, ...ev]); emitFlowEvent('Kara Calendar', 'Event Scheduled', { title: form.title, date: sel }); setForm({ title: '', time: '09:00' }); };

  return (
    <div className="flex h-full bg-slate-50">
      <div className="flex-1 flex flex-col p-4 min-w-0">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-slate-800">{cursor.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
          <div className="flex gap-1">
            <button onClick={() => setCursor(new Date(y, m - 1, 1))} className="p-2 bg-white border border-slate-200 rounded hover:bg-slate-100"><ChevronLeft size={16}/></button>
            <button onClick={() => setCursor(new Date())} className="px-3 py-2 bg-white border border-slate-200 rounded text-xs hover:bg-slate-100">Today</button>
            <button onClick={() => setCursor(new Date(y, m + 1, 1))} className="p-2 bg-white border border-slate-200 rounded hover:bg-slate-100"><ChevronRight size={16}/></button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 flex-1 auto-rows-fr">
          {cells.map((d, i) => {
            const dateStr = d ? iso(new Date(y, m, d)) : '';
            const count = d ? events.filter(e => e.date === dateStr).length : 0;
            return (
              <button key={i} onClick={() => d && setSel(dateStr)} disabled={!d}
                className={`rounded border text-left p-1.5 align-top ${!d ? 'border-transparent' : dateStr === sel ? 'border-amber-500 bg-amber-50' : 'border-slate-200 bg-white hover:bg-slate-100'}`}>
                {d && <>
                  <div className="text-xs font-semibold text-slate-600">{d}</div>
                  {count > 0 && <div className="mt-1 text-[9px] bg-amber-500 text-white rounded px-1 inline-block">{count}</div>}
                </>}
              </button>
            );
          })}
        </div>
      </div>
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col flex-shrink-0">
        <div className="p-3 border-b border-slate-200">
          <h3 className="text-sm font-bold text-slate-700">{new Date(sel + 'T00:00:00').toDateString()}</h3>
        </div>
        <div className="p-3 border-b border-slate-200 space-y-2">
          <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Event title" className="w-full border border-slate-200 rounded text-xs py-1.5 px-2"/>
          <div className="flex gap-2">
            <input type="time" value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} className="border border-slate-200 rounded text-xs py-1.5 px-2"/>
            <button onClick={addEvent} className="flex-1 flex items-center justify-center gap-1 bg-amber-600 text-white text-xs rounded hover:bg-amber-700"><Plus size={12}/> Add</button>
            <button onClick={exportEvents} title="Export events" className="px-2 py-1.5 bg-slate-200 text-slate-700 text-xs rounded hover:bg-slate-300"><Download size={12} /></button>
            <label title="Import events" className="px-2 py-1.5 bg-slate-600 text-white text-xs rounded hover:bg-slate-500 cursor-pointer"><Upload size={12} /><input type="file" accept=".json" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) importEvents(f); e.target.value = ''; }} /></label>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {dayEvents.length === 0 && <p className="text-xs text-slate-400">No events. Tip: open Kara Mail and press "To Calendar".</p>}
          {dayEvents.map(e => (
            <div key={e.id} className="border border-slate-200 rounded p-2 bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-amber-700 bg-amber-100 rounded px-1">{e.time}</span>
                <span className="text-xs font-semibold text-slate-800 flex-1 truncate">{e.title}</span>
                <button onClick={() => setEvents(ev => ev.filter(x => x.id !== e.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={12}/></button>
              </div>
              {e.source && <div className="text-[9px] text-slate-400 mt-1">via {e.source}</div>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


