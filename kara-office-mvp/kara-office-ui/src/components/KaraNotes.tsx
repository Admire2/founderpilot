import { useState, useEffect } from 'react';
import { Plus, Search, FileText, Bot, FileDown, ChevronLeft, MoreVertical, Trash2, Upload } from 'lucide-react';

type Note = {
  id: string;
  title: string;
  content: string;
  tags: string[];
  date: number;
};

const TEMPLATES = {
  blank: { title: 'New Note', content: '' },
  meeting: { title: 'Meeting Minutes', content: 'Date: \nAttendees: \n\nDecisions:\n- \n\nAction Items:\n- ' },
  kickoff: { title: 'Project Kickoff Brief', content: 'Objective: \nScope: \nTimeline: \nKey Stakeholders: ' },
  standup: { title: 'Daily Standup', content: 'Yesterday: \nToday: \nBlockers: ' },
  research: { title: 'Research & Competitor Analysis', content: 'Topic: \nKey Findings:\n- \nCompetitors:\n- ' },
};

const STORAGE_KEY = 'karaNotesData';

export default function KaraNotes() {
  const [notes, setNotes] = useState<Note[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [activeId, setActiveId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'edit' | 'preview'>('edit');
  const [aiSummary, setAiSummary] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(notes)); }, [notes]);

  const activeNote = notes.find(n => n.id === activeId);

  const createNote = (templateKey: keyof typeof TEMPLATES = 'blank') => {
    const tpl = TEMPLATES[templateKey];
    const newNote: Note = {
      id: Date.now().toString(36),
      title: tpl.title + ' ' + new Date().toLocaleDateString(),
      content: tpl.content,
      tags: [],
      date: Date.now(),
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveId(newNote.id);
    setView('edit');
    setShowTemplates(false);
  };

  const updateNote = (patch: Partial<Note>) => {
    if (!activeId) return;
    setNotes(prev => prev.map(n => n.id === activeId ? { ...n, ...patch, date: Date.now() } : n));
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(search.toLowerCase()) || 
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  // MOAT 2: Bi-Directional Linking Renderer
  const renderContent = (text: string) => {
    const parts = text.split(/(\[\[.*?\]\])/g);
    return parts.map((part, i) => {
      const match = part.match(/\[\[(.*?)\]\]/);
      if (match) {
        return (
          <span 
            key={i} 
            className="text-blue-600 underline cursor-pointer hover:text-blue-800 font-medium bg-blue-50 px-1 rounded"
            onClick={() => {
              const target = notes.find(n => n.title.toLowerCase() === match[1].toLowerCase());
              if (target) setActiveId(target.id);
              else createNote('blank'); // Or prompt to create
            }}
          >
            {match[1]}
          </span>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  // MOAT 1: Second Brain Local AI Summarization
  const aiSummarize = async () => {
    if (!activeNote || !activeNote.content.trim()) return;
    setAiThinking(true);
    setAiSummary('');
    try {
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ((window as any).__karaAi || {}).model || 'qwen2.5:3b',
          prompt: `You are Kara Notes AI. Summarize the following note and extract key action items. Format clearly with bullet points.\n\nNote:\n${activeNote.content}`,
          stream: false, temperature: ((window as any).__karaAi || {}).temperature ?? 0.7
        })
      });
      const d = await res.json();
      setAiSummary(d.response || 'No summary generated.');
    } catch (e) {
      setAiSummary('AI offline. Ensure Ollama (qwen2.5:3b) is running.');
    }
    setAiThinking(false);
  };

  // MOAT 3: One-Click Promote to Document
    const exportNote = () => { if (!activeNote) return; const blob = new Blob(['# ' + activeNote.title + '\n\n' + activeNote.content], { type: 'text/markdown' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = activeNote.title.replace(/[^a-z0-9]/gi, '_') + '.md'; a.click(); };

  const promoteToWord = () => {
    if (!activeNote) return;
    
    // Prepare content for Kara Word
    const wordContent = `# ${activeNote.title}\n\n**Date:** ${new Date(activeNote.date).toLocaleString()}\n\n---\n\n${activeNote.content}\n\n${aiSummary ? `---\n\n## AI Summary & Action Items\n\n${aiSummary}` : ''}`;
    
    // Store in localStorage for Kara Word to access
    localStorage.setItem('karaWordImport', JSON.stringify({
      title: activeNote.title,
      content: wordContent,
      source: 'Kara Notes',
      timestamp: Date.now()
    }));
    
    // Navigate to Kara Word via custom event
    window.dispatchEvent(new CustomEvent('kara-navigate', { detail: { app: 'word', importNote: true } }));
    
    alert('Opening in Kara Word...');
  };

  return (
    <div className="flex h-full bg-white">
      {/* Sidebar */}
      <div className="w-72 border-r border-slate-200 flex flex-col bg-slate-50">
        <div className="p-4 border-b border-slate-200">
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-2.5 text-slate-400" size={16} />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search notes..." 
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowTemplates(!showTemplates)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm font-medium"
            >
              <Plus size={16} /> New Note
            </button>
            {showTemplates && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded shadow-lg z-10 overflow-hidden">
                {Object.entries(TEMPLATES).map(([key, tpl]) => (
                  <button 
                    key={key} 
                    onClick={() => createNote(key as keyof typeof TEMPLATES)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 border-b border-slate-100 last:border-0 capitalize"
                  >
                    {key === 'blank' ? 'Blank Note' : tpl.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredNotes.map(note => (
            <div 
              key={note.id} 
              onClick={() => { setActiveId(note.id); setView('edit'); setAiSummary(''); }}
              className={`p-3 border-b border-slate-100 cursor-pointer hover:bg-slate-100 transition ${activeId === note.id ? 'bg-indigo-50 border-l-4 border-l-indigo-600' : 'border-l-4 border-l-transparent'}`}
            >
              <h3 className="font-semibold text-sm text-slate-800 truncate">{note.title || 'Untitled'}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{note.content || 'No content'}</p>
              <span className="text-[10px] text-slate-400 mt-2 block">{new Date(note.date).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeNote ? (
          <>
            {/* Toolbar */}
            <div className="h-14 border-b border-slate-200 flex items-center justify-between px-4 bg-white flex-shrink-0">
              <div className="flex items-center gap-2">
                <button onClick={() => setView(view === 'edit' ? 'preview' : 'edit')} className="px-3 py-1.5 text-xs font-medium bg-slate-100 text-slate-700 rounded hover:bg-slate-200">
                  {view === 'edit' ? 'Preview Links' : 'Edit'}
                </button>
                <button onClick={aiSummarize} disabled={aiThinking} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-100 text-purple-700 rounded hover:bg-purple-200 disabled:opacity-50">
                  <Bot size={14} /> {aiThinking ? 'Thinking...' : 'AI Summarize'}
                </button>
                <button onClick={promoteToWord} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200">
                  <FileDown size={14} /> Promote to Word
                </button>
              </div>
              <button onClick={() => deleteNote(activeNote.id)} className="p-2 text-slate-400 hover:text-red-600 rounded hover:bg-red-50">
                <Trash2 size={16} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
              <input 
                value={activeNote.title} 
                onChange={e => updateNote({ title: e.target.value })}
                placeholder="Note Title"
                className="w-full text-3xl font-bold text-slate-900 placeholder-slate-300 border-none outline-none bg-transparent mb-4"
              />
              
              {view === 'edit' ? (
                <textarea 
                  value={activeNote.content} 
                  onChange={e => updateNote({ content: e.target.value })}
                  placeholder="Start typing... Use [[Note Name]] to link to other notes."
                  className="w-full h-[calc(100vh-250px)] resize-none text-slate-700 leading-relaxed border-none outline-none bg-transparent font-mono text-sm"
                />
              ) : (
                <div className="w-full h-[calc(100vh-250px)] overflow-y-auto text-slate-800 leading-relaxed whitespace-pre-wrap text-sm">
                  {renderContent(activeNote.content)}
                </div>
              )}

              {/* AI Summary Panel */}
              {aiSummary && (
                <div className="mt-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h4 className="text-sm font-bold text-purple-800 mb-2 flex items-center gap-2">
                    <Bot size={16} /> Kara AI Summary & Action Items
                  </h4>
                  <div className="text-sm text-purple-900 whitespace-pre-wrap">{aiSummary}</div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
            <FileText size={48} className="mb-4 text-slate-300" />
            <p className="text-lg font-medium">Select a note or create a new one</p>
            <p className="text-sm mt-1">Tip: Type [[Meeting Minutes]] to auto-link to that note.</p>
          </div>
        )}
      </div>
    </div>
  );
}



