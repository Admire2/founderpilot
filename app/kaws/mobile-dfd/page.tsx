"use client";
import { useState, useRef } from "react";

export default function MobileDfdPage() {
  const [address, setAddress] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhoto(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;
    setLoading(true);
    
    // Mock API call to Kara Scout / Skip Tracing
    await new Promise(r => setTimeout(r, 2000));
    
    setResult({
      owner: "John & Jane Doe",
      phone: "(555) 123-4567",
      equity: "85%",
      estimated_value: "$320,000",
      mortgage: "$48,000",
      status: "Added to Kara Scout Pipeline"
    });
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 max-w-md mx-auto">
      <header className="mb-6 text-center">
        <div className="text-xs font-bold tracking-widest text-amber-400 uppercase mb-2">Track 2: Investor Exclusive</div>
        <h1 className="text-2xl font-bold">Kara Mobile: Driving for Dollars</h1>
        <p className="text-sm text-slate-400">Snap, scan, and skip-trace distressed properties on the go.</p>
      </header>

      <form onSubmit={handleScan} className="space-y-4">
        {/* Photo Capture Area */}
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="w-full h-48 bg-slate-800 border-2 border-dashed border-slate-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-amber-500 transition"
        >
          {photo ? (
            <img src={photo} alt="Captured" className="w-full h-full object-cover rounded-xl" />
          ) : (
            <>
              <span className="text-4xl mb-2">📸</span>
              <span className="text-sm text-slate-400">Tap to snap property photo</span>
            </>
          )}
          <input 
            type="file" 
            accept="image/*" 
            capture="environment" 
            ref={fileInputRef} 
            onChange={handlePhotoCapture} 
            className="hidden" 
          />
        </div>

        {/* Address Input */}
        <div>
          <label className="block text-xs text-slate-400 mb-1">Property Address</label>
          <input 
            required 
            value={address} 
            onChange={e => setAddress(e.target.value)} 
            placeholder="e.g. 123 Distressed Ln, Atlanta GA" 
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-amber-500 outline-none" 
          />
        </div>

        <button 
          disabled={loading} 
          className="w-full py-4 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-900/50 transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span> Skip-Tracing Owner...
            </>
          ) : (
            <>🔍 Scan & Skip-Trace</>
          )}
        </button>
      </form>

      {/* Results Card */}
      {result && (
        <div className="mt-6 p-4 bg-emerald-900/20 border border-emerald-700 rounded-xl animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-emerald-400 text-xl">✅</span>
            <h3 className="font-bold text-emerald-300">Owner Found & Added to Pipeline</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">Owner:</span> <span className="text-white font-semibold">{result.owner}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Phone:</span> <span className="text-white font-semibold">{result.phone}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Est. Value:</span> <span className="text-white font-semibold">{result.estimated_value}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">Equity:</span> <span className="text-amber-400 font-bold">{result.equity}</span></div>
          </div>
          <button className="w-full mt-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-semibold">
            📞 Call Owner via Kara Caller
          </button>
        </div>
      )}
    </main>
  );
}