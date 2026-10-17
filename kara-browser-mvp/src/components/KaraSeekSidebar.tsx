import { useState } from 'react';
import { Search, Zap, Globe, Shield, ShieldOff, Loader2, AlertCircle } from 'lucide-react';

export default function KaraSeekSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [prompt, setPrompt] = useState('');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [offlineMode, setOfflineMode] = useState(false);

  const executeMission = async () => {
    if (!prompt.trim()) return;
    setStatus('scanning');
    setError('');
    setResult(null);
    
    try {
      const res = await fetch('http://localhost:3001/api/seek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompt, offlineMode: offlineMode })
      });
      
      if (!res.ok) throw new Error(`Backend HTTP Error: ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      
      setResult(data);
      setStatus('done');
    } catch (e: any) {
      setStatus('error');
      setError(e.message || 'Unknown error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-[450px] bg-slate-900 text-white border-l border-slate-700 shadow-2xl z-50 flex flex-col">
      <div className="p-4 border-b border-slate-700 flex items-center justify-between bg-slate-800">
        <h2 className="text-lg font-bold flex items-center gap-2 text-cyan-400"><Search size={20} /> Kara Seek</h2>
        <button onClick={onClose} className="text-slate-400 hover:text-white">?</button>
      </div>

      <div className="p-4 border-b border-slate-700 space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1">
            {offlineMode ? <Shield size={14} className="text-emerald-400"/> : <ShieldOff size={14} className="text-slate-400"/>}
            {offlineMode ? '100% Sovereign (Offline)' : 'High-Flier (Local 3B)'}
          </span>
          <button 
            onClick={() => setOfflineMode(!offlineMode)}
            className={`px-2 py-1 rounded text-xs font-bold ${offlineMode ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}
          >Toggle</button>
        </div>
        
        <textarea 
          value={prompt} onChange={(e) => setPrompt(e.target.value)}
          placeholder="Ask anything (e.g., List African nations and count them)..."
          className="w-full h-20 bg-slate-800 border border-slate-600 rounded p-2 text-sm focus:ring-2 focus:ring-cyan-500 outline-none resize-none"
        />
        
        <button 
          onClick={executeMission} disabled={status === 'scanning'}
          className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 rounded flex items-center justify-center gap-2 font-semibold disabled:opacity-50 transition"
        >
          {status === 'scanning' ? <><Loader2 className="animate-spin" size={16}/> Analyzing...</> : <><Zap size={16}/> Launch Mission</>}
        </button>
      </div>

      {/* LIMITLESS SCROLLABLE RESULTS AREA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {error && (
          <div className="bg-red-900/30 border border-red-700 p-3 rounded text-xs text-red-300 flex items-start gap-2">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" /><span>{error}</span>
          </div>
        )}

        {status === 'done' && result && (
          <>
            {result.context && (
              <div className="bg-slate-800/50 p-3 rounded border border-slate-700">
                <p className="text-[10px] text-slate-400 uppercase font-bold mb-1 flex items-center gap-1"><Globe size={10}/> Live Search Context</p>
                <p className="text-xs text-slate-300 italic line-clamp-3">{result.context}</p>
              </div>
            )}
            
            {/* THE LIMITLESS ANSWER BOX */}
            {result.answer && (
              <div className="bg-slate-800 p-4 rounded border border-emerald-700/50">
                <p className="text-[10px] text-emerald-400 uppercase font-bold mb-2">Comprehensive Answer</p>
                <div className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed break-words max-h-[60vh] overflow-y-auto pr-2">
                  {result.answer}
                </div>
              </div>
            )}
          </>
        )}
        
        {status === 'idle' && !error && (
          <div className="text-center text-slate-500 text-sm mt-8">
            <Globe size={32} className="mx-auto mb-2 opacity-50" />
            <p>Ready to search the sovereign web.</p>
          </div>
        )}
      </div>
    </div>
  );
}