import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, User, GripVertical } from 'lucide-react';

type Task = { id: string; title: string; assignee: string; status: 'todo' | 'doing' | 'done'; due: string };
const KEY = 'karaFlowTasks';

export default function KaraFlow() {
  const [tasks, setTasks] = useState<Task[]>(() => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } });
  const [newTask, setNewTask] = useState({ title: '', assignee: '', due: '' });
  const [dragId, setDragId] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(tasks)); }, [tasks]);

  const addTask = () => {
    if (!newTask.title) return;
    setTasks([...tasks, { id: Date.now().toString(36), ...newTask, status: 'todo' }]);
    setNewTask({ title: '', assignee: '', due: '' });
  };
  const move = (id: string, s: Task['status']) => {
    setTasks(ts => ts.map(t => t.id === id ? { ...t, status: s } : t));
    if (s === 'done') {
      const t = tasks.find(x => x.id === id);
      window.dispatchEvent(new CustomEvent('kara-flow-task-done', { detail: { title: t ? t.title : 'Task' } }));
    }
  };
  const del = (id: string) => setTasks(tasks.filter(t => t.id !== id));

  const cols: { id: Task['status']; label: string; color: string }[] = [
    { id: 'todo', label: 'To Do', color: 'bg-slate-100' },
    { id: 'doing', label: 'In Progress', color: 'bg-blue-50' },
    { id: 'done', label: 'Done', color: 'bg-green-50' }
  ];

  return (
    <div className="h-full flex flex-col bg-slate-50 p-4">
      <div className="flex gap-2 mb-4 bg-white p-3 rounded shadow-sm">
        <input value={newTask.title} onChange={e => setNewTask(p => ({ ...p, title: e.target.value }))} placeholder="Task title" className="flex-1 border border-slate-200 rounded px-2 text-sm" />
        <input value={newTask.assignee} onChange={e => setNewTask(p => ({ ...p, assignee: e.target.value }))} placeholder="Assignee" className="w-32 border border-slate-200 rounded px-2 text-sm" />
        <input type="date" value={newTask.due} onChange={e => setNewTask(p => ({ ...p, due: e.target.value }))} className="border border-slate-200 rounded px-2 text-sm" />
        <button onClick={addTask} className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700 flex items-center gap-1"><Plus size={14}/> Add</button>
      </div>
      <p className="text-[11px] text-slate-400 mb-2">Drag cards between columns. Dropping into Done fires Kara Connect automations.</p>
      <div className="flex-1 flex gap-4 overflow-x-auto">
        {cols.map(c => (
          <div key={c.id} className={`flex-1 min-w-[280px] ${c.color} rounded p-3 flex flex-col`}
            onDragOver={e => e.preventDefault()}
            onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('text/plain') || dragId; if (id) move(id, c.id); setDragId(null); }}>
            <h3 className="font-bold text-slate-700 mb-3 flex items-center justify-between">
              {c.label} <span className="text-xs bg-slate-200 px-2 py-0.5 rounded-full">{tasks.filter(t => t.status === c.id).length}</span>
            </h3>
            <div className="flex-1 space-y-2 overflow-y-auto">
              {tasks.filter(t => t.status === c.id).map(t => (
                <div key={t.id} draggable onDragStart={e => { e.dataTransfer.setData('text/plain', t.id); setDragId(t.id); }} onDragEnd={() => setDragId(null)}
                  className="bg-white p-3 rounded shadow-sm border border-slate-200 group cursor-grab active:cursor-grabbing hover:shadow-md">
                  <div className="flex items-start gap-2">
                    <GripVertical size={14} className="text-slate-300 mt-0.5 flex-shrink-0"/>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-800 mb-2">{t.title}</p>
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="flex items-center gap-1"><User size={12}/> {t.assignee || 'Unassigned'}</span>
                        <span className="flex items-center gap-1"><Calendar size={12}/> {t.due || 'No date'}</span>
                      </div>
                    </div>
                    <button onClick={() => del(t.id)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={12}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
