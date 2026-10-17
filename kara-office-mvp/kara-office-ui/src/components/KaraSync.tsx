import { useState, useEffect } from 'react';
import { RefreshCw, Wifi, WifiOff, Download, Upload } from 'lucide-react';

export default function KaraSync() {
  const [peers, setPeers] = useState(0);
  const [log, setLog] = useState<string[]>([]);

  useEffect(() => {
    const mesh = new BroadcastChannel('kara_sovereign_mesh');
    mesh.onmessage = (e) => {
      if (e.data.type === 'SYNC_PULSE') {
        setPeers(p => p + 1);
        setLog(l => [`[Mesh] Received pulse from peer`, ...l].slice(0, 10));
        if (e.data.state) {
          Object.entries(e.data.state).forEach(([k, v]) => localStorage.setItem(k, v as string));
          window.location.reload();
        }
      }
    };
    const pulse = () => {
      mesh.postMessage({ type: 'SYNC_PULSE', ts: Date.now() });
      setLog(l => [`[Mesh] Emitted pulse`, ...l].slice(0, 10));
    };
    const interval = setInterval(pulse, 5000);
    pulse();
    return () => { clearInterval(interval); mesh.close(); };
  }, []);

  const exportMeshBundle = () => {
    const state: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('kara')) state[k] = localStorage.getItem(k) || '';
    }
    const blob = new Blob([JSON.stringify(state)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'kara-mesh-bundle-' + Date.now() + '.json'; a.click();
  };

  const importMeshBundle = (e: any) => {
    const f = e.target.files[0]; if (!f) return;
    f.text().then(t => {
      const state = JSON.parse(t);
      Object.entries(state).forEach(([k, v]) => localStorage.setItem(k, v as string));
      alert('Mesh bundle absorbed. Reloading...');
      window.location.reload();
    });
  };

  return (
    <div className="h-full flex flex-col bg-slate-50 p-8">
      <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3 mb-2"><RefreshCw className="text-teal-500"/> Kara Sync <span className="text-xs bg-teal-100 text-teal-800 px-2 py-1 rounded">P2P MESH V2</span></h2>
      <p className="text-slate-500 mb-6">Real-time local network synchronization. Zero cloud servers.</p>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            {peers > 0 ? <Wifi className="text-emerald-500"/> : <WifiOff className="text-slate-400"/>}
            <h3 className="font-bold text-slate-700">Local Mesh Status</h3>
          </div>
          <p className="text-3xl font-bold text-slate-800">{peers}</p>
          <p className="text-xs text-slate-500">Active peers detected on local broadcast channel.</p>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-3">
          <button onClick={exportMeshBundle} className="w-full px-4 py-2 bg-teal-600 text-white rounded flex items-center justify-center gap-2 hover:bg-teal-700"><Download size={16}/> Export Mesh Bundle</button>
          <label className="w-full px-4 py-2 bg-slate-800 text-white rounded flex items-center justify-center gap-2 hover:bg-slate-900 cursor-pointer">
            <Upload size={16}/> Import Mesh Bundle
            <input type="file" accept=".json" className="hidden" onChange={importMeshBundle}/>
          </label>
        </div>
      </div>
      <div className="bg-slate-900 text-emerald-400 p-4 rounded-lg font-mono text-xs flex-1 overflow-y-auto">
        <p className="text-slate-500 mb-2">--- MESH TELEMETRY ---</p>
        {log.map((l, i) => <p key={i}>{new Date().toLocaleTimeString()} | {l}</p>)}
      </div>
    </div>
  );
}