import { useState, useEffect } from 'react';
import { Send, Inbox, PenTool, Trash2, Star, Archive, Bot, CheckCircle, AlertCircle, ArrowLeft, Reply, CalendarDays } from 'lucide-react';

type Email = { 
  id: string; 
  folder: 'inbox' | 'sent' | 'drafts' | 'trash'; 
  from: string; 
  to: string; 
  cc?: string;
  bcc?: string;
  subject: string; 
  body: string; 
  date: number; 
  read: boolean; 
  starred: boolean;
};

const STORAGE_KEY = 'karaMailData';
const USER_EMAIL = 'user@karaoffice.local';

export default function KaraMail() {
  const [emails, setEmails] = useState<Email[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [view, setView] = useState<'inbox' | 'compose' | 'read' | 'sent' | 'drafts' | 'trash'>('inbox');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composeData, setComposeData] = useState({ to: '', cc: '', bcc: '', subject: '', body: '' });
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [replyPrompt, setReplyPrompt] = useState('');
  const [replyThinking, setReplyThinking] = useState(false);
  const [showApproval, setShowApproval] = useState(false);
  const [approvalEmail, setApprovalEmail] = useState<Email | null>(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(emails)); }, [emails]);

  const selectedEmail = emails.find(e => e.id === selectedId);
  const inboxEmails = emails.filter(e => e.folder === 'inbox' && !e.read).length;

  // AI Draft Assistant for COMPOSE (appends to textarea, NOT part of email body)
  const aiDraft = async () => {
    if (!aiPrompt.trim()) return;
    setAiThinking(true);
    try {
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ((window as any).__karaAi || {}).model || 'qwen2.5:3b',
          prompt: `You are a professional email assistant. Draft a concise, polite email body based on this request: "${aiPrompt}". The email is to: ${composeData.to}, subject: ${composeData.subject}. Return ONLY the email body text, no greeting or signature.`,
          stream: false, temperature: ((window as any).__karaAi || {}).temperature ?? 0.7
        })
      });
      const d = await res.json();
      const generated = (d.response || '').trim();
      // Append to textarea content - this becomes the actual email body
      setComposeData(prev => ({ ...prev, body: prev.body + (prev.body ? '\n\n' : '') + generated }));
    } catch (e) {
      alert('AI offline. Ensure Ollama is running.');
    }
    setAiThinking(false);
    setAiPrompt('');
  };

  // AI Reply Assistant for READ view (generates reply, opens compose pre-filled)
  const aiReply = async () => {
    if (!replyPrompt.trim() || !selectedEmail) return;
    setReplyThinking(true);
    try {
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ((window as any).__karaAi || {}).model || 'qwen2.5:3b',
          prompt: `You are replying to this email:\n\nFrom: ${selectedEmail.from}\nSubject: ${selectedEmail.subject}\nBody:\n${selectedEmail.body}\n\nUser instruction: ${replyPrompt}\n\nDraft a professional reply. Return ONLY the reply body, no greeting.`,
          stream: false, temperature: ((window as any).__karaAi || {}).temperature ?? 0.7
        })
      });
      const d = await res.json();
      const replyBody = (d.response || '').trim();
      // Open compose with reply pre-filled
      setComposeData({
        to: selectedEmail.from,
        cc: '',
        bcc: '',
        subject: `Re: ${selectedEmail.subject}`,
        body: replyBody
      });
      setView('compose');
    } catch (e) {
      alert('AI offline.');
    }
    setReplyThinking(false);
    setReplyPrompt('');
  };

  const saveDraft = () => {
    if (!composeData.subject && !composeData.body) return;
    const draft: Email = {
      id: Date.now().toString(36),
      folder: 'drafts',
      from: USER_EMAIL,
      to: composeData.to,
      cc: composeData.cc,
      bcc: composeData.bcc,
      subject: composeData.subject || '(No Subject)',
      body: composeData.body,
      date: Date.now(),
      read: true,
      starred: false
    };
    setEmails(prev => [draft, ...prev]);
    setView('drafts');
    setComposeData({ to: '', cc: '', bcc: '', subject: '', body: '' });
  };

  const requestApproval = () => {
    const email: Email = {
      id: Date.now().toString(36),
      folder: 'sent',
      from: USER_EMAIL,
      to: composeData.to,
      cc: composeData.cc,
      bcc: composeData.bcc,
      subject: composeData.subject || '(No Subject)',
      body: composeData.body,  // ONLY the textarea content - AI box is NOT included
      date: Date.now(),
      read: true,
      starred: false
    };
    setApprovalEmail(email);
    setShowApproval(true);
  };

  const approveAndSend = () => {
    if (approvalEmail) {
      setEmails(prev => [approvalEmail, ...prev]);
      const mailtoLink = `mailto:${encodeURIComponent(approvalEmail.to)}?subject=${encodeURIComponent(approvalEmail.subject)}&body=${encodeURIComponent(approvalEmail.body)}`;
      window.open(mailtoLink, '_blank');
    }
    setShowApproval(false);
    setApprovalEmail(null);
    setView('sent');
    setComposeData({ to: '', cc: '', bcc: '', subject: '', body: '' });
  };

  const markRead = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, read: true } : e));
    setSelectedId(id);
    setView('read');
  };

  const moveToTrash = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, folder: 'trash' } : e));
    setView('inbox');
    setSelectedId(null);
  };

  const toggleStar = (id: string) => {
    setEmails(prev => prev.map(e => e.id === id ? { ...e, starred: !e.starred } : e));
  };

  return (
    <div className="flex h-full bg-slate-50">
      {/* Sidebar */}
      <div className="w-56 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-800">
          <button onClick={() => { setView('compose'); setComposeData({ to: '', cc: '', bcc: '', subject: '', body: '' }); setAiPrompt(''); setReplyPrompt(''); }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 text-sm">
            <PenTool size={14} /> Compose
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          <button onClick={() => { setView('inbox'); setSelectedId(null); }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm ${view === 'inbox' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'}`}>
            <Inbox size={14} /> Inbox
            {inboxEmails > 0 && <span className="ml-auto bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full">{inboxEmails}</span>}
          </button>
          <button onClick={() => { setView('sent'); setSelectedId(null); }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm ${view === 'sent' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'}`}>
            <Send size={14} /> Sent
          </button>
          <button onClick={() => { setView('drafts'); setSelectedId(null); }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm ${view === 'drafts' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'}`}>
            <PenTool size={14} /> Drafts
          </button>
          <button onClick={() => { setView('trash'); setSelectedId(null); }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm ${view === 'trash' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800'}`}>
            <Trash2 size={14} /> Trash
          </button>
        </nav>
        <div className="p-4 border-t border-slate-800 text-[10px] text-slate-500">
          Kara Mail v1.0<br/>Sovereign & AI-Native
        </div>
      </div>

      {/* Email List */}
      {(view === 'inbox' || view === 'sent' || view === 'drafts' || view === 'trash') && (
        <div className="flex-1 border-r border-slate-200 bg-white overflow-y-auto">
          <div className="p-3 border-b border-slate-200 bg-slate-50">
            <h2 className="text-sm font-semibold text-slate-700 capitalize">{view}</h2>
          </div>
          {emails.filter(e => e.folder === view).length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">No emails in {view}</div>
          ) : (
            emails.filter(e => e.folder === view).sort((a, b) => b.date - a.date).map(email => (
              <div key={email.id} onClick={() => markRead(email.id)}
                className={`p-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 ${!email.read ? 'bg-indigo-50' : ''}`}>
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-sm ${!email.read ? 'font-bold text-slate-900' : 'text-slate-700'}`}>
                    {view === 'sent' ? `To: ${email.to}` : email.from}
                  </span>
                  <div className="flex gap-1">
                    <button onClick={(e) => { e.stopPropagation(); toggleStar(email.id); }} className="text-slate-400 hover:text-yellow-500">
                      <Star size={14} fill={email.starred ? 'currentColor' : 'none'} color={email.starred ? '#eab308' : 'currentColor'} />
                    </button>
                    <span className="text-[10px] text-slate-400">{new Date(email.date).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="text-sm text-slate-800 truncate">{email.subject}</div>
                <div className="text-xs text-slate-500 truncate mt-1">{email.body.substring(0, 60)}...</div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Compose View - AI Draft Assistant is SEPARATE from email body */}
      {view === 'compose' && (
        <div className="flex-1 flex flex-col bg-white">
          <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <button onClick={() => { setView('inbox'); setAiPrompt(''); }} className="text-slate-600 hover:text-slate-900 flex items-center gap-1">
              <ArrowLeft size={16} /> Back
            </button>
            <div className="flex gap-2">
              <button onClick={saveDraft} className="px-3 py-1.5 text-xs bg-slate-200 text-slate-700 rounded hover:bg-slate-300">Save Draft</button>
              <button onClick={requestApproval} className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-1">
                <Send size={12} /> Send (Review First)
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <input value={composeData.to} onChange={e => setComposeData(p => ({ ...p, to: e.target.value }))}
              placeholder="To:" className="w-full border-b border-slate-200 py-2 text-sm outline-none focus:border-indigo-500" />
            <input value={composeData.cc} onChange={e => setComposeData(p => ({ ...p, cc: e.target.value }))}
              placeholder="CC:" className="w-full border-b border-slate-200 py-2 text-sm outline-none focus:border-indigo-500" />
            <input value={composeData.bcc} onChange={e => setComposeData(p => ({ ...p, bcc: e.target.value }))}
              placeholder="BCC:" className="w-full border-b border-slate-200 py-2 text-sm outline-none focus:border-indigo-500" />
            <input value={composeData.subject} onChange={e => setComposeData(p => ({ ...p, subject: e.target.value }))}
              placeholder="Subject:" className="w-full border-b border-slate-200 py-2 text-sm outline-none focus:border-indigo-500" />
            
            {/* AI Draft Assistant - SEPARATE TOOL, not part of email body */}
            <div className="bg-indigo-50 border border-indigo-200 rounded p-3">
              <div className="flex items-center gap-2 mb-2">
                <Bot size={14} className="text-indigo-600" />
                <span className="text-xs font-semibold text-indigo-700">AI Draft Assistant (optional)</span>
              </div>
              <div className="flex gap-2">
                <input value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && aiDraft()}
                  placeholder="e.g., 'Follow up on the Georgia Tech partnership proposal...'"
                  className="flex-1 border border-indigo-200 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-indigo-500" />
                <button onClick={aiDraft} disabled={aiThinking}
                  className="px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 disabled:opacity-50">
                  {aiThinking ? 'Drafting...' : 'Generate'}
                </button>
              </div>
              <p className="text-[10px] text-indigo-500 mt-1">Generated text is appended to the email body below. The AI box itself is NOT sent.</p>
            </div>

            {/* Email body textarea - THIS is what gets sent */}
            <textarea value={composeData.body} onChange={e => setComposeData(p => ({ ...p, body: e.target.value }))}
              placeholder="Write your email..."
              className="w-full flex-1 min-h-[300px] border border-slate-200 rounded p-3 text-sm outline-none focus:ring-1 focus:ring-indigo-500 resize-none" />
          </div>
        </div>
      )}

      {/* Read View - with AI Reply Assistant */}
      {view === 'read' && selectedEmail && (
        <div className="flex-1 flex flex-col bg-white">
          <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <button onClick={() => { setView('inbox'); setSelectedId(null); setReplyPrompt(''); }} className="text-slate-600 hover:text-slate-900 flex items-center gap-1">
              <ArrowLeft size={16} /> Back to Inbox
            </button>
            <div className="flex gap-2">
              <button onClick={() => { setComposeData({ to: selectedEmail.from, cc: '', bcc: '', subject: `Re: ${selectedEmail.subject}`, body: '' }); setView('compose'); setReplyPrompt(''); }}
                className="px-3 py-1.5 text-xs bg-slate-200 text-slate-700 rounded hover:bg-slate-300 flex items-center gap-1">
                <Reply size={12} /> Reply
              </button>
              <button onClick={() => { localStorage.setItem('karaCalendarPending', JSON.stringify({ title: selectedEmail.subject, date: new Date().toISOString().slice(0, 10), time: '09:00', source: 'Kara Mail' })); window.dispatchEvent(new CustomEvent('kara-navigate', { detail: { app: 'calendar' } })); }}
                className="px-3 py-1.5 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200 flex items-center gap-1">
                <CalendarDays size={12} /> To Calendar
              </button>
              <button onClick={() => moveToTrash(selectedEmail.id)} className="px-3 py-1.5 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200">
                <Trash2 size={12} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6">
            <h1 className="text-xl font-bold text-slate-900 mb-4">{selectedEmail.subject}</h1>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                {selectedEmail.from.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="text-sm font-semibold text-slate-900">{selectedEmail.from}</div>
                <div className="text-xs text-slate-500">To: {selectedEmail.to} • {new Date(selectedEmail.date).toLocaleString()}</div>
              </div>
            </div>
            <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed mb-6">
              {selectedEmail.body}
            </div>

            {/* AI Reply Assistant - SEPARATE from email body */}
            <div className="bg-emerald-50 border border-emerald-200 rounded p-3 mt-6">
              <div className="flex items-center gap-2 mb-2">
                <Bot size={14} className="text-emerald-600" />
                <span className="text-xs font-semibold text-emerald-700">AI Reply Assistant (optional)</span>
              </div>
              <div className="flex gap-2">
                <input value={replyPrompt} onChange={e => setReplyPrompt(e.target.value)} onKeyDown={e => e.key === 'Enter' && aiReply()}
                  placeholder="e.g., 'Accept the meeting and propose Thursday 2pm...'"
                  className="flex-1 border border-emerald-200 rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-emerald-500" />
                <button onClick={aiReply} disabled={replyThinking}
                  className="px-3 py-1 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 disabled:opacity-50">
                  {replyThinking ? 'Thinking...' : 'Suggest Reply'}
                </button>
              </div>
              <p className="text-[10px] text-emerald-500 mt-1">AI generates a reply and opens Compose pre-filled. The AI box itself is NOT sent.</p>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {showApproval && approvalEmail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle size={20} className="text-amber-500" />
                Review Before Sending
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-600">To:</label>
                <div className="text-sm text-slate-900">{approvalEmail.to}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Subject:</label>
                <div className="text-sm text-slate-900">{approvalEmail.subject}</div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600">Body:</label>
                <div className="text-sm text-slate-800 whitespace-pre-wrap bg-slate-50 p-3 rounded border border-slate-200 max-h-60 overflow-y-auto">
                  {approvalEmail.body}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 flex justify-end gap-3">
              <button onClick={() => setShowApproval(false)} className="px-4 py-2 text-sm bg-slate-200 text-slate-700 rounded hover:bg-slate-300">
                Cancel & Edit
              </button>
              <button onClick={approveAndSend} className="px-4 py-2 text-sm bg-emerald-600 text-white rounded hover:bg-emerald-700 flex items-center gap-2">
                <CheckCircle size={16} /> Approve & Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

