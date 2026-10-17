"use client";
import Link from "next/link";
import { jsPDF } from "jspdf";
import WalletBar from "@/app/components/WalletBar";
import { useState } from "react";
export default function ILeraRisk() {
  const [main, setMain] = useState("");
  const [extra, setExtra] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Prefer not to say");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const run = async () => {
    if (!main.trim()) { setErr("Fill the main input first."); return; }
    setBusy(true); setErr(""); setOut("");
    let email = "";
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) { const j = JSON.parse(localStorage.getItem(k) || "null"); email = (j && j.user && j.user.email) || ""; if (email) break; } } } catch (e) {}
    try {
      const r = await fetch("/api/ilera", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "risk", email, labs: main, meds: main, brief: main, prior: extra, family: extra, age, gender }) });
      const j = await r.json();
      if (j.ok) { setOut(j.answer || "No response."); try { window.dispatchEvent(new Event("wallet-refresh")); } catch (e) {} } else setErr(j.error || "Failed.");
    } catch (e) { setErr("Connection error."); }
    setBusy(false);
  };
  const download = () => {
    const a = document.createElement("a");
    const doc = new jsPDF(); doc.setFontSize(10); const _lns = doc.splitTextToSize("Health Risk Radar\n" + new Date().toLocaleString() + "\n\nINPUT:\n" + main + "\n\n" + out + "\n\n---\nEducational screening only - iLera never replaces your clinician.", 180); let _y = 20; for (const _l of _lns) { if (_y > 280) { doc.addPage(); _y = 20; } doc.text(_l, 15, _y); _y += 6; } doc.save("iLera-risk-radar.pdf");
  };
  const inp = "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm";
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <Link href="/suite/healthcare" className="mb-3 inline-block text-sm font-bold text-cyan-400 hover:underline">← Healthcare Suite</Link>
      <WalletBar />

      <h1 className="text-3xl font-bold text-rose-300">🎯 Health Risk Radar</h1>
      <p className="mt-1 text-sm text-slate-400">SUBHealth Risk Radar 15 credits per run.</p>
      <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-[11px] font-bold text-rose-200">Educational planning only - confirm cadence with your clinician.</div>
      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-rose-200">01 · INPUT</p>
        <textarea value={main} onChange={(e) => setMain(e.target.value)} rows={6} placeholder="Lifestyle: former smoker (quit 2020), 2 drinks/week, walks 3x/week, BP last read 138/88..." className={"mt-2 " + inp} />
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div><p className="text-[11px] font-bold text-slate-300">Age</p><input value={age} onChange={(e) => setAge(e.target.value)} className={"mt-1 " + inp} /></div>
          <div><p className="text-[11px] font-bold text-slate-300">Gender</p><select value={gender} onChange={(e) => setGender(e.target.value)} className={"mt-1 " + inp}><option>Male</option><option>Female</option><option>Intersex</option><option>Prefer not to say</option></select></div>
        </div>
        <p className="mt-3 text-[11px] font-bold text-slate-300">Family history</p>
        <textarea value={extra} onChange={(e) => setExtra(e.target.value)} rows={3} placeholder="Father: heart attack at 55. Mother: type 2 diabetes..." className={"mt-1 " + inp} />
        <button onClick={run} disabled={busy} className="mt-4 w-full rounded-lg bg-rose-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-rose-400 disabled:opacity-50">{busy ? "Working..." : "Build My Risk Map (15 credits)"}</button>
        {err && <p className="mt-2 text-xs font-bold text-amber-300">{err}</p>}
      </div>
      {out && (<div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/5 p-5"><p className="text-sm font-bold text-rose-200">03 · RESULT</p><pre className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{out}</pre><button onClick={download} className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400">Download</button></div>)}
    </main>
  );
}