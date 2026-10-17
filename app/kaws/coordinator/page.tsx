"use client";
import { useState } from "react";

export default function CoordinatorPage() {
  const [address, setAddress] = useState("");
  const [closingDate, setClosingDate] = useState("");
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const generateTimeline = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/karakata/kaws/coordinator", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, closing_date: closingDate })
    });
    const data = await res.json();
    if (data.ok) setTimeline(data.timeline);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <header className="max-w-4xl mx-auto mb-8">
        <div className="text-sm font-bold tracking-widest text-emerald-400 uppercase mb-2">Kara Coordinator</div>
        <h1 className="text-4xl font-bold">Transaction Management</h1>
        <p className="text-slate-400">Generate professional closing timelines and task lists instantly.</p>
      </header>

      <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
        <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6 h-fit">
          <h2 className="text-xl font-bold mb-4">New Transaction</h2>
          <form onSubmit={generateTimeline} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Property Address</label>
              <input required value={address} onChange={e => setAddress(e.target.value)} placeholder="123 Main St" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Closing Date</label>
              <input required type="date" value={closingDate} onChange={e => setClosingDate(e.target.value)} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white" />
            </div>
            <button disabled={loading} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg disabled:opacity-50">
              {loading ? "Generating..." : "Generate Timeline"}
            </button>
          </form>
        </div>

        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 min-h-[400px]">
          <h2 className="text-xl font-bold mb-4">Transaction Timeline: {address || "..."}</h2>
          {timeline.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-slate-500">Enter details to generate timeline</div>
          ) : (
            <div className="space-y-4">
              {timeline.map((t, i) => (
                <div key={i} className="flex gap-4 border-l-2 border-slate-700 pl-4 relative">
                  <div className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full ${t.status === "done" ? "bg-emerald-500" : t.status === "in_progress" ? "bg-amber-500" : "bg-slate-600"}`}></div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bold text-white">{t.title}</h3>
                      <span className="text-xs text-slate-400">{t.date}</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{t.desc}</p>
                    <span className={`text-[10px] uppercase font-bold mt-2 inline-block px-2 py-1 rounded ${t.status === "done" ? "bg-emerald-900 text-emerald-300" : t.status === "in_progress" ? "bg-amber-900 text-amber-300" : "bg-slate-800 text-slate-400"}`}>
                      {t.status.replace("_", " ")}
                    </span>
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