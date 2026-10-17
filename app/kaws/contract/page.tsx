"use client";
import { useState } from "react";

export default function ContractPage() {
  const [text, setText] = useState("");
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const analyzeContract = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/karakata/kaws/contract", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    const data = await res.json();
    if (data.ok) setRisks(data.risks);
    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <header className="max-w-4xl mx-auto mb-8">
        <div className="text-sm font-bold tracking-widest text-emerald-400 uppercase mb-2">Kara Contract Review</div>
        <h1 className="text-4xl font-bold">Legal Risk Analyzer</h1>
        <p className="text-slate-400">Paste contract text to instantly flag missing clauses and risky terms.</p>
      </header>

      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Paste Contract Text</h2>
          <form onSubmit={analyzeContract} className="space-y-4">
            <textarea required value={text} onChange={e => setText(e.target.value)} placeholder="Paste the full text of the purchase agreement here..." rows={15} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white font-mono text-xs" />
            <button disabled={loading} className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg disabled:opacity-50">
              {loading ? "Analyzing..." : "Analyze for Risks"}
            </button>
          </form>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-4">Risk Report</h2>
          {risks.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-slate-500">Results will appear here</div>
          ) : (
            <div className="space-y-3">
              {risks.map((r, i) => (
                <div key={i} className={`p-4 rounded-lg border ${r.severity === "high" ? "bg-red-900/20 border-red-700" : r.severity === "medium" ? "bg-amber-900/20 border-amber-700" : "bg-emerald-900/20 border-emerald-700"}`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${r.severity === "high" ? "bg-red-900 text-red-300" : r.severity === "medium" ? "bg-amber-900 text-amber-300" : "bg-emerald-900 text-emerald-300"}`}>
                      {r.severity} Risk
                    </span>
                  </div>
                  <h3 className="font-bold text-white mb-1">{r.issue}</h3>
                  <p className="text-sm text-slate-300">{r.advice}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}