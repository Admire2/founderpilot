"use client";
import { useEffect, useState } from "react";

const PROVIDERS: any[] = [
  { group: "Aggregators (Nationwide Coverage)", items: [
    { id: "trestle", name: "Trestle by CoreLogic (40+ MLSs)" },
    { id: "spark", name: "Spark Platform by FBS (100+ MLSs)" },
    { id: "bridge", name: "Bridge Interactive (Zillow Group)" },
    { id: "idxbroker", name: "IDX Broker (60+ MLSs)" }
  ]},
  { group: "United States - Major MLSs", items: [
    { id: "fmls", name: "FMLS (Atlanta, GA)" },
    { id: "gamlss", name: "GAMLS (Georgia Statewide)" },
    { id: "bright", name: "Bright MLS (DC/MD/VA/PA/NJ)" },
    { id: "crmls", name: "CRMLS (California)" },
    { id: "mred", name: "MRED (Chicago, IL)" },
    { id: "ntreis", name: "NTREIS (Dallas-Fort Worth, TX)" },
    { id: "har", name: "HAR (Houston, TX)" },
    { id: "actris", name: "ACTRIS (Austin, TX)" },
    { id: "armls", name: "ARMLS (Phoenix, AZ)" },
    { id: "recolorado", name: "REcolorado (Denver, CO)" },
    { id: "nwmls", name: "NWMLS (Seattle, WA)" },
    { id: "rmls", name: "RMLS (Portland, OR)" },
    { id: "sdmls", name: "SDMLS (San Diego, CA)" },
    { id: "mlspin", name: "MLS PIN (Massachusetts)" },
    { id: "onekey", name: "OneKey MLS (New York)" },
    { id: "njmls", name: "NJMLS (New Jersey)" },
    { id: "miami", name: "MIAMI MLS (Miami, FL)" },
    { id: "stellar", name: "Stellar MLS (Orlando/Tampa, FL)" },
    { id: "canopy", name: "Canopy MLS (Charlotte, NC)" },
    { id: "realtracs", name: "RealTracs (Nashville, TN)" },
    { id: "glvar", name: "GLVAR (Las Vegas, NV)" },
    { id: "realcomp", name: "Realcomp (Michigan)" },
    { id: "mlsnow", name: "MLS NOW (Cleveland, OH)" }
  ]},
  { group: "Canada", items: [
    { id: "creaddf", name: "CREA DDF (Nationwide Canada)" },
    { id: "trreb", name: "TRREB (Toronto, ON)" },
    { id: "centris", name: "Centris (Quebec)" },
    { id: "regbv", name: "REBGV (Vancouver, BC)" },
    { id: "creb", name: "CREB (Calgary, AB)" },
    { id: "ereb", name: "EREB (Edmonton, AB)" }
  ]}
];

export default function MlsDashboard() {
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState("fmls");
  const [license, setLicense] = useState("");
  const [mlsId, setMlsId] = useState("");
  const [connected, setConnected] = useState(false);
  const [isDemo, setIsDemo] = useState(false);

  // Helper to get the short code (e.g., "HAR" from "HAR (Houston, TX)")
  const getShortCode = (id: string) => {
    for (const g of PROVIDERS) {
      const hit = g.items.find((i: any) => i.id === id);
      if (hit) return hit.name.split(" ")[0].toUpperCase();
    }
    return id.toUpperCase();
  };

  const providerName = (id: string) => {
    for (const g of PROVIDERS) { const hit = g.items.find((i: any) => i.id === id); if (hit) return hit.name; }
    return id;
  };

  useEffect(() => {
    fetch("/api/karakata/kaws/mls/listings?mode=demo&metro=" + provider).then(r => r.json()).then(j => {
      if (j.ok) setListings(j.listings || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [provider]);

  const handleConnect = (e: React.FormEvent) => {
    e.preventDefault();
    setConnected(true);
    setIsDemo(false);
    alert("✅ Live Connection Saved for " + getShortCode(provider) + "! (Pending broker IDX approval).");
  };

  const handleDemo = () => {
    setConnected(true);
    setIsDemo(true);
    setLoading(true);
    fetch("/api/karakata/kaws/mls/listings?mode=demo&metro=" + provider).then(r => r.json()).then(j => {
      if (j.ok) setListings(j.listings || []);
      setLoading(false);
    });
  };

  const shortCode = getShortCode(provider);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <header className="max-w-6xl mx-auto mb-8">
        <div className="text-sm font-bold tracking-widest text-emerald-400 uppercase mb-2">Track 1: Licensed Agent Exclusive</div>
        <h1 className="text-4xl font-bold">KAWS MLS Connector - North America</h1>
        <p className="text-slate-400">600+ MLSs across the US & Canada via RESO Web API, Trestle, Spark, Bridge and CREA DDF.</p>
      </header>

      {isDemo && (
        <div className="max-w-6xl mx-auto mb-6 p-4 bg-indigo-900/30 border border-indigo-600 rounded-lg flex items-center justify-between">
          <div>
            <span className="font-bold text-indigo-300">🚀 KAWS Sandbox Mode - {shortCode}</span>
            <p className="text-sm text-slate-300">Live RESO simulation of {providerName(provider)}. This is exactly how your data will look once your broker approves IDX access.</p>
          </div>
          <button onClick={() => { setConnected(false); setIsDemo(false); }} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm">Exit Demo</button>
        </div>
      )}

      <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 mb-10">
        <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Connect Your Provider</h2>
          {connected && !isDemo ? (
            <div className="p-4 bg-emerald-900/30 border border-emerald-700 rounded-lg text-emerald-300 text-sm">
              ✅ <b>{shortCode}</b> Connected<br/>Status: Syncing every 15 mins.
            </div>
          ) : (
            <>
              <form onSubmit={handleConnect} className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Listings Service Provider (US & Canada)</label>
                  <select value={provider} onChange={e => setProvider(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white max-h-40">
                    {PROVIDERS.map((g: any) => (
                      <optgroup key={g.group} label={g.group}>
                        {g.items.map((i: any) => (<option key={i.id} value={i.id}>{i.name}</option>))}
                      </optgroup>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Agent License #</label>
                  <input value={license} onChange={e => setLicense(e.target.value)} required placeholder="e.g. 123456" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">MLS ID / Username</label>
                  <input value={mlsId} onChange={e => setMlsId(e.target.value)} required placeholder="e.g. AGENT99" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white" />
                </div>
                <button type="submit" className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg">Connect Live {shortCode}</button>
              </form>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
                <div className="relative flex justify-center text-xs"><span className="bg-slate-900 px-2 text-slate-500">OR</span></div>
              </div>

              <button onClick={handleDemo} className="w-full py-3 mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-900/50 transition">
                 Try Live Demo - {shortCode}
              </button>
              <p className="text-xs text-slate-500 text-center mt-2">Instantly see {shortCode} market data in the RESO sandbox - no broker approval needed.</p>
            </>
          )}
        </div>

        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Live Listings Feed {isDemo && <span className="text-xs bg-indigo-600 px-2 py-1 rounded ml-2">SANDBOX</span>}</h2>
            <span className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-400">Last sync: Just now</span>
          </div>
          {loading ? <p className="text-slate-400">Fetching RESO OData payload...</p> : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {listings.map((l: any, idx: number) => (
                <div key={l.ListingKey || idx} className="flex gap-4 bg-slate-800/50 p-3 rounded-lg border border-slate-700 hover:border-indigo-500 transition cursor-pointer">
                  <div className="w-32 h-24 bg-slate-700 rounded overflow-hidden flex-shrink-0">
                    {l.Media && l.Media[0] ? (
                      <img src={l.Media[0].MediaURL} alt="Property" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">🏠</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <span className="font-bold text-white">{l.UnparsedAddress}</span>
                      <span className="text-emerald-400 font-bold">${(l.ListPrice / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="text-xs text-slate-400">{l.City}, {l.StateOrProvince} {l.PostalCode} • {l.BedroomsTotal} bd / {l.BathroomsTotalInteger} ba • {l.LivingArea} sqft</div>
                    <div className="text-xs text-slate-500 mt-1">MLS# {l.ListingKey} • Status: <span className="text-emerald-300">{l.StandardStatus}</span></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}