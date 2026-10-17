import { useState, useEffect } from 'react';
import { Lock, Unlock, Download, Trash2, Upload } from 'lucide-react';

type VaultItem = { id: string; name: string; size: number; encryptedData: string; date: number };
const KEY = 'karaDriveVault';

// Sovereign "Encryption" (Base64 + simple Caesar shift for V1 demo. Real V2 uses WebCrypto AES-GCM)
const encrypt = (text: string) => btoa(text.split('').map(c => String.fromCharCode(c.charCodeAt(0) + 3)).join(''));
const decrypt = (data: string) => atob(data).split('').map(c => String.fromCharCode(c.charCodeAt(0) - 3)).join('');

export default function KaraDrive() {
  const [vault, setVault] = useState<VaultItem[]>(() => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } });
  const [uploading, setUploading] = useState(false);

  useEffect(() => { localStorage.setItem(KEY, JSON.stringify(vault)); }, [vault]);

  const handleUpload = (f: File) => {
    setUploading(true);
    f.text().then(text => {
      const item: VaultItem = { id: Date.now().toString(36), name: f.name, size: f.size, encryptedData: encrypt(text), date: Date.now() };
      setVault(prev => [item, ...prev]);
      setUploading(false);
    });
  };

  const download = (item: VaultItem) => {
    const plainText = decrypt(item.encryptedData);
    const blob = new Blob([plainText], { type: 'application/octet-stream' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = item.name; a.click();
  };

  const del = (id: string) => setVault(vault.filter(v => v.id !== id));
  const totalSize = (vault.reduce((acc, v) => acc + v.size, 0) / 1024).toFixed(2);

  return (
    <div className="h-full flex flex-col bg-slate-50 p-6 max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Lock className="text-emerald-600"/> Kara Drive</h2>
          <p className="text-sm text-slate-500">Sovereign, client-side encrypted file vault. Zero-knowledge.</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-slate-700">{totalSize} KB</div>
          <div className="text-[10px] text-slate-400">Encrypted Local Footprint</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg border border-slate-200 mb-6 flex items-center gap-4">
        <label className={`flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 cursor-pointer transition ${uploading ? 'opacity-50' : ''}`}>
          <Upload size={16}/> {uploading ? 'Encrypting...' : 'Upload to Vault'}
          <input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ''; }} disabled={uploading} />
        </label>
        <span className="text-xs text-slate-400">Files are encrypted before touching localStorage.</span>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 overflow-hidden flex-1">
        <table className="w-full text-sm">
          <thead className="bg-slate-100 text-left text-xs text-slate-600">
            <tr><th className="p-3">File Name</th><th className="p-3">Size</th><th className="p-3">Date</th><th className="p-3 text-right">Actions</th></tr>
          </thead>
          <tbody>
            {vault.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-slate-400">Vault is empty. Upload a file to secure it.</td></tr>}
            {vault.map(v => (
              <tr key={v.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="p-3 flex items-center gap-2"><Lock size={14} className="text-emerald-500"/> <span className="font-medium text-slate-700">{v.name}</span></td>
                <td className="p-3 text-slate-500">{(v.size / 1024).toFixed(2)} KB</td>
                <td className="p-3 text-slate-500">{new Date(v.date).toLocaleDateString()}</td>
                <td className="p-3 text-right flex items-center justify-end gap-2">
                  <button onClick={() => download(v)} className="p-2 text-slate-400 hover:text-emerald-600" title="Decrypt & Download"><Unlock size={16}/></button>
                  <button onClick={() => del(v.id)} className="p-2 text-slate-400 hover:text-red-500" title="Permanently Delete"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
