"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function AgentRunnerPage() {
  const params = useParams();
  const tool = String(params.tool || "");
  const [agent, setAgent] = useState<any>(null);
  const [track, setTrack] = useState<"investor" | "agent">("investor");
  const [input, setInput] = useState("");
  const [place, setPlace] = useState("");
  const [fields, setFields] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState<any>(null);
  const [meta, setMeta] = useState<any>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("kaws_track") : null;
    if (saved === "agent" || saved === "investor") setTrack(saved);
    fetch("/api/karakata/kaws/agents").then(r => r.json()).then(j => {
      if (j.ok) setAgent(j.agents.find((a: any) => a.id === tool) || null);
    });
  }, [tool]);

  const pickTrack = (t: "investor" | "agent") => {
    setTrack(t);
    localStorage.setItem("kaws_track", t);
  };

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(""); setOutput(null); setMeta(null);
    const res = await fetch("/api/karakata/kaws/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agent: tool, input, fields, track, place })
    });
    const j = await res.json();
    if (j.ok) { setOutput(j.output); setMeta({ track: j.track, dataSource: j.dataSource }); }
    else setError(j.error || "Failed");
    setLoading(false);
  };

  if (!agent) {
    return (
      <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">🚧</div>
        <h1 className="text-3xl font-bold">Coming Soon</h1>
        <Link href="/kaws/real-estate" className="mt-6 px-6 py-3 bg-indigo-600 rounded-lg font-semibold">← Back to Suite</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <header className="max-w-3xl mx-auto mb-6">
        <div className="text-sm font-bold tracking-widest text-emerald-400 uppercase mb-2">KAWS Live Agent</div>
        <h1 className="text-4xl font-bold">{agent.icon} {agent.name}</h1>
        <p className="text-slate-400 mt-2">{agent.blurb}</p>
      </header>

      <div className="max-w-3xl mx-auto mb-6 flex gap-3">
        <button onClick={() => pickTrack("investor")} className={"flex-1 py-3 rounded-xl font-bold border transition " + (track === "investor" ? "bg-amber-600 border-amber-500 text-white" : "bg-slate-900 border-slate-800 text-slate-400")}>
          💼 Investor Track (Public Records)
        </button>
        <button onClick={() => pickTrack("agent")} className={"flex-1 py-3 rounded-xl font-bold border transition " + (track === "agent" ? "bg-emerald-600 border-emerald-500 text-white" : "bg-slate-900 border-slate-800 text-slate-400")}>
          🪪 Licensed Agent Track (MLS)
        </button>
      </div>
      {track === "agent" && (
        <p className="max-w-3xl mx-auto -mt-3 mb-6 text-xs text-emerald-300 bg-emerald-900/20 border border-emerald-800 rounded-lg p-3">
          MLS live data unlocks after your broker approves IDX/RESO access. Until then, agent-track runs use the RESO sandbox + public records.
        </p>
      )}

      <div className="max-w-3xl mx-auto grid md:grid-cols-2 gap-6">
        <form onSubmit={run} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 h-fit">
          <div>
            <label className="block text-xs text-slate-400 mb-1">Market (City, State) — for live record pull</label>
            <input value={place} onChange={e => setPlace(e.target.value)} placeholder="Atlanta, GA" className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white" />
          </div>
          {agent.fields ? (
            agent.fields.map((fd: any) => (
              <div key={fd.key}>
                <label className="block text-xs text-slate-400 mb-1">{fd.label}</label>
                <input type="number" value={fields[fd.key] || ""} onChange={e => setFields({ ...fields, [fd.key]: e.target.value })} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white" />
              </div>
            ))
          ) : (
            <div>
              <label className="block text-xs text-slate-400 mb-1">{agent.inputLabel}</label>
              <textarea rows={5} value={input} onChange={e => setInput(e.target.value)} placeholder={agent.placeholder} className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm" />
            </div>
          )}
          <button disabled={loading} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg font-bold disabled:opacity-50">
            {loading ? "Kara is working..." : "Run " + agent.name}
          </button>
          {error && <p className="text-red-400 text-sm">{error}</p>}
        </form>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 min-h-[300px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Result</h2>
            {meta && <span className={"text-[10px] px-2 py-1 rounded font-bold " + (String(meta.dataSource).startsWith("LIVE") ? "bg-emerald-900 text-emerald-300" : "bg-amber-900 text-amber-300")}>{meta.dataSource}</span>}
          </div>
          {!output && <p className="text-slate-500 text-sm">Output appears here.</p>}
          {output && (
            <div className="space-y-3 text-sm">
              {Object.entries(output).map(([k, v]: any) => (
                <div key={k} className="bg-slate-800/60 rounded-lg p-3">
                  <div className="text-xs font-bold text-indigo-300 uppercase mb-1">{k.replace(/_/g, " ")}</div>
                  <pre className="whitespace-pre-wrap text-slate-200 text-xs font-sans">{typeof v === "string" ? v : JSON.stringify(v, null, 2)}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}