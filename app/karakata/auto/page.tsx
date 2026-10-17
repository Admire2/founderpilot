"use client";
import { useState } from "react";
import Link from "next/link";
export default function AutoDesk() {
  const [f, setF] = useState<any>({ confirmed: false });
  const [rep, setRep] = useState("");
  const [ai, setAi] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: string, v: any) => setF({ ...f, [k]: v });
  const emailOf = () => { let e = ""; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) { const j = JSON.parse(localStorage.getItem(k) || "null"); e = (j && j.user && j.user.email) || ""; if (e) break; } } } catch (err) {} return e; };
  const analyze = async () => {
    if (!rep.trim()) { setMsg("Paste the history or inspection report text first."); return; }
    setBusy(true); setMsg("");
    const r = await fetch("/api/karakata", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "autoreport", email: emailOf(), brief: rep }) });
    const j = await r.json();
    if (j.ok) setAi(j.answer || ""); else setMsg(j.error || "Analysis failed.");
    setBusy(false);
  };
  const publish = async () => {
    setBusy(true); setMsg("");
    const r = await fetch("/api/karakata/auto", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, email: emailOf() }) });
    const j = await r.json();
    if (j.ok) setMsg("Listed! Listing #" + j.id + " is live under Vehicles & Auto Parts.");
    else setMsg(j.error || "Publish failed.");
    setBusy(false);
  };
  const inp = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <Link href="/karakata/sell" className="text-sm font-bold text-emerald-700 underline">← Seller Center</Link>
      <h1 className="mt-3 text-3xl font-bold">🚗 Auto Desk — vehicles & parts with proof</h1>
      <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs">
        <p className="font-bold text-emerald-800">The KaraKata trust stack for high-ticket sales:</p>
        <p className="mt-1">1️⃣ <b>Escrow</b> - buyer's money is held until delivery is confirmed. 2️⃣ <b>History</b> - VIN report link visible to every buyer. 3️⃣ <b>Inspection</b> - a declared grade: self-declared, mechanic-inspected, or history-checked.</p>
        <p className="mt-1 font-bold text-emerald-800">Privacy: the full VIN is masked at publish and never stored on our servers.</p>
        <div className="mt-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs">
          <p className="font-bold text-amber-900">🔧 Certified mechanic or inspector? Claim your city's Auto Desk franchise.</p>
          <p className="mt-1 text-amber-800">KaraKata routes every inspection and history request in your city to you. You keep 80%; the desk keeps 20% for escrow, demand flow and dispute cover. <a className="font-bold underline" href="/partners/join">Apply as an Auto Desk partner →</a></p>
        </div>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-bold">Vehicle or part details</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <input className={inp} placeholder="Year (2016)" value={f.year || ""} onChange={(e) => set("year", e.target.value)} />
            <input className={inp} placeholder="Make (Toyota)" value={f.make || ""} onChange={(e) => set("make", e.target.value)} />
            <input className={inp} placeholder="Model (Camry)" value={f.model || ""} onChange={(e) => set("model", e.target.value)} />
            <input className={inp} placeholder="Mileage (84000)" value={f.mileage || ""} onChange={(e) => set("mileage", e.target.value)} />
            <select className={inp} value={f.condition || "Used"} onChange={(e) => set("condition", e.target.value)}><option>New</option><option>Used</option><option>Certified</option></select>
            <select className={inp} value={f.grade || "Self-declared"} onChange={(e) => set("grade", e.target.value)}><option>Self-declared</option><option>Mechanic-inspected</option><option>History-checked</option></select>
          </div>
          <input className={inp + " mt-2"} placeholder="VIN (masked at publish)" value={f.vin || ""} onChange={(e) => set("vin", e.target.value)} />
          <input className={inp + " mt-2"} placeholder="Listing title" value={f.title || ""} onChange={(e) => set("title", e.target.value)} />
          <div className="mt-2 grid grid-cols-2 gap-2">
            <input className={inp} placeholder="Price (USD)" value={f.price || ""} onChange={(e) => set("price", e.target.value)} />
            <input className={inp} placeholder="Image URL (optional)" value={f.image_url || ""} onChange={(e) => set("image_url", e.target.value)} />
          </div>
          <input className={inp + " mt-2"} placeholder="History report URL (Carfax / AutoCheck / NMVTIS)" value={f.history_url || ""} onChange={(e) => set("history_url", e.target.value)} />
          <input className={inp + " mt-2"} placeholder="Pre-purchase inspection report URL (optional)" value={f.inspection_url || ""} onChange={(e) => set("inspection_url", e.target.value)} />
          <textarea className={inp + " mt-2"} rows={3} placeholder="Notes: service history, tyres, warranty..." value={f.notes || ""} onChange={(e) => set("notes", e.target.value)} />
          <label className="mt-3 flex items-start gap-2 text-xs font-bold"><input type="checkbox" checked={!!f.confirmed} onChange={(e) => set("confirmed", e.target.checked)} /> I confirm the VIN and mileage are accurate and the history link is genuine.</label>
          <button onClick={publish} disabled={busy} className="mt-3 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50">Publish vehicle listing (free)</button>
          {msg && (<p className="mt-2 text-xs font-bold text-emerald-700">{msg}</p>)}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-bold">🔎 AI report analyst (10 cr)</p>
          <p className="mt-1 text-xs text-slate-600">Paste a Carfax / AutoCheck / mechanic report. The analyst returns a plain-language verdict: CLEAN, CAUTION or RED - attach it to your listing so buyers see you have nothing to hide.</p>
          <textarea className={inp + " mt-2"} rows={8} placeholder="Paste report text here..." value={rep} onChange={(e) => setRep(e.target.value)} />
          <button onClick={analyze} disabled={busy} className="mt-2 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-slate-900 hover:bg-amber-400 disabled:opacity-50">Analyze report (10 cr)</button>
          {ai && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <pre className="whitespace-pre-wrap text-xs">{ai}</pre>
              <button onClick={() => set("notes", (f.notes || "") + "\nAI SUMMARY:\n" + ai)} className="mt-2 rounded bg-emerald-600 px-3 py-1.5 text-[10px] font-bold text-white">Attach summary to listing</button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
