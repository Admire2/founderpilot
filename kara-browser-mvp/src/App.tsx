import { useState, useRef } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Shield, MessageSquare, Lock, Gamepad2, Briefcase, Folder, Wallet, X, Search } from 'lucide-react';
import KaraSeekSidebar from './components/KaraSeekSidebar';

function App() {
  const [url, setUrl] = useState('https://www.google.com');
  const [inputUrl, setInputUrl] = useState('https://www.google.com');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isSeekOpen, setIsSeekOpen] = useState(false);
  const webviewRef = useRef(null);

  const handleGo = (e: React.FormEvent) => { e.preventDefault(); setUrl(inputUrl); };
  const goBack = () => webviewRef.current?.goBack();
  const goForward = () => webviewRef.current?.goForward();
  const refresh = () => webviewRef.current?.reload();

  const dockApps = [
    { name: 'Gamers Hub', icon: Gamepad2, url: 'https://karaverse.city' },
    { name: 'Kara Office', icon: Briefcase, url: 'http://localhost:3005/office' },
    { name: 'Kara OS', icon: Folder, url: 'http://localhost:3005/os' },
    { name: 'Kara Vault', icon: Wallet, url: 'http://localhost:3005/vault' },
  ];

  return (
    <div className="flex h-screen bg-slate-900 text-white">
      <div className="flex-1 flex flex-col">
        <div className="bg-slate-800 p-2 flex items-center gap-2 border-b border-slate-700">
          <button onClick={goBack} className="p-2 hover:bg-slate-700 rounded"><ArrowLeft size={18}/></button>
          <button onClick={goForward} className="p-2 hover:bg-slate-700 rounded"><ArrowRight size={18}/></button>
          <button onClick={refresh} className="p-2 hover:bg-slate-700 rounded"><RotateCw size={18}/></button>
          <form onSubmit={handleGo} className="flex-1 flex">
            <input value={inputUrl} onChange={(e)=>setInputUrl(e.target.value)} className="w-full bg-slate-700 rounded-full px-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search or enter URL" />
          </form>
          
          {/* Kara Seek Toggle Button */}
          <button 
            onClick={() => setIsSeekOpen(!isSeekOpen)} 
            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded border transition ${isSeekOpen ? 'bg-cyan-600 border-cyan-500 text-white' : 'bg-cyan-900/30 border-cyan-800 text-cyan-400 hover:bg-cyan-900/50'}`}
          >
            <Search size={14} /> 
            <span>{isSeekOpen ? 'Seek Active' : 'Kara Seek'}</span>
          </button>

          {/* Secure Enclave Toggle Button */}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded border transition ${sidebarOpen ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-emerald-900/30 border-emerald-800 text-emerald-400 hover:bg-emerald-900/50'}`}
          >
            <Shield size={14} /> 
            <span>{sidebarOpen ? 'Enclave Active' : 'Secure Enclave'}</span>
          </button>
        </div>
        <webview ref={webviewRef} src={url} className="flex-1 w-full bg-white" />
      </div>

      {/* Kara Seek Sidebar */}
      {isSeekOpen && (
        <KaraSeekSidebar isOpen={isSeekOpen} onClose={() => setIsSeekOpen(false)} />
      )}

      {/* Secure Enclave Sidebar */}
      {sidebarOpen && (
        <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col">
           <div className="h-12 border-b border-slate-700 flex items-center justify-between px-4 font-semibold">
              <div className="flex items-center"><MessageSquare className="mr-2 text-blue-400"/> Kara AI</div>
              <button onClick={() => setSidebarOpen(false)} className="text-slate-400 hover:text-white"><X size={18}/></button>
           </div>
           <div className="p-2 border-b border-slate-700 grid grid-cols-4 gap-2">
              {dockApps.map((app) => (
                <button key={app.name} onClick={() => setUrl(app.url)} className="flex flex-col items-center justify-center p-2 hover:bg-slate-700 rounded transition group" title={app.name}>
                  <app.icon size={20} className="text-slate-400 group-hover:text-blue-400" />
                  <span className="text-[10px] text-slate-500 mt-1 truncate w-full text-center">{app.name.split(' ')[0]}</span>
                </button>
              ))}
           </div>
           <div className="flex-1 p-4 text-sm text-slate-400">
              <div className="w-full h-full bg-slate-900 rounded border border-slate-700 flex items-center justify-center text-xs text-slate-600">
                 Chat with Kara AI...
              </div>
           </div>
           <div className="p-4 border-t border-slate-700">
              <button className="w-full bg-blue-600 py-2 rounded text-sm hover:bg-blue-500 flex items-center justify-center gap-2"><Lock size={14}/> Unlock Kara Vault</button>
           </div>
        </div>
      )}
    </div>
  );
}

export default App;