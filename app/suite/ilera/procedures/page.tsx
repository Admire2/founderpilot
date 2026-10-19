"use client";
import { useState } from "react";
import Link from "next/link";
import WalletBar from "@/components/WalletBar";
import { downloadPdf } from "@/lib/pdf";

const QUICK = [
  "Capsule Endoscopy", "Colonoscopy", "MRI", "CT Scan",
  "Blood Panel (Basic Metabolic)", "Blood Panel (Comprehensive)", "Lipid Panel",
  "Mammogram", "Echocardiogram", "EKG / ECG", "Ultrasound", "Upper Endoscopy (EGD)"
];

export default function Procedures() {
  const [proc, setProc] = useState("");
  const [age, setAge] = useState("");
  const [ins, setIns] = useState("Private insurance");
  const [why, setWhy] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const emailOf = () => { let e = ""; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) { const j = JSON.parse(localStorage.getItem(k) || "null"); e = (j && j.user && j.user.email) || ""; if (e) break; } } } catch (err) {} return e; };
  const run = async () => {
    if (!proc.trim()) { setErr("Enter the procedure name first."); return; }
    setBusy(true); setErr(""); setOut("");
    const brief = "PROCEDURE: " + proc + "\nINSURANCE: " + ins + "\nREASON DOCTOR ORDERED: " + why;
    try {
      const r = await fetch("/api/ilera", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "procedures", email: emailOf(), brief, age, goal: "Understand my upcoming procedure" }) });
      const j = await r.json();
      if (j.ok) { setOut(j.answer || "No response."); try { window.dispatchEvent(new Event("wallet-refresh")); } catch (e) {} }
      else setErr(j.error || "Failed.");
    } catch (e) { setErr("Connection error."); }
    setBusy(false);
  };
  const inp = "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm";
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <Link href="/suite/healthcare" className="mb-3 inline-block text-sm font-bold text-cyan-400 hover:underline">? Healthcare Suite</Link>
      <WalletBar />
      <h1 className="text-3xl font-bold text-rose-300">?? Procedure Explainer</h1>
      <p className="mt-1 text-sm text-slate-400">Paste any procedure your doctor ordered — iLera returns cost ranges, insurance rules, risks, prep steps and 5 questions to ask. Walk in informed. 10 credits per procedure.</p>
      <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-[11px] font-bold text-rose-200">?? Educational preparation only — never a recommendation or discouragement. Your clinician confirms necessity, timing and suitability.</div>

      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-rose-200">01 · YOUR PROCEDURE</p>
        <p className="mt-2 text-[11px] font-bold text-slate-300">Procedure name</p>
        <input value={proc} onChange={(e) => setProc(e.target.value)} className={"mt-1 " + inp} placeholder="e.g. capsule endoscopy, colonoscopy, MRI..." />
        <p className="mt-3 text-[11px] font-bold text-slate-300">Quick pick</p>
        <div className="mt-1 flex flex-wrap gap-1.5">{QUICK.map((q) => (<button key={q} onClick={() => setProc(q)} className="rounded-full bg-slate-800 px-2.5 py-1 text-[10px] font-bold text-slate-300 hover:bg-rose-500/20 hover:text-rose-200">{q}</button>))}</div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div><p className="text-[11px] font-bold text-slate-300">Age</p><input value={age} onChange={(e) => setAge(e.target.value)} className={"mt-1 " + inp} placeholder="42" /></div>
          <div><p className="text-[11px] font-bold text-slate-300">Insurance</p><select value={ins} onChange={(e) => setIns(e.target.value)} className={"mt-1 " + inp}><option>Private insurance</option><option>Medicare</option><option>Medicaid</option><option>Tricare / VA</option><option>No insurance / Self-pay</option></select></div>
        </div>
        <p className="mt-3 text-[11px] font-bold text-slate-300">Why your doctor ordered it (optional - makes the output sharper)</p>
        <textarea value={why} onChange={(e) => setWhy(e.target.value)} rows={2} className={"mt-1 " + inp} placeholder="e.g. unexplained GI bleeding for 3 months, iron-deficiency anemia, previous colonoscopy was normal..." />
        <button onClick={run} disabled={busy} className="mt-4 w-full rounded-lg bg-rose-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-rose-400 disabled:opacity-50">{busy ? "iLera is preparing your procedure brief..." : "Explain My Procedure (10 credits)"}</button>
        {err && <p className="mt-2 text-xs font-bold text-amber-300">{err}</p>}
      </div>

      {out && (
        <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/5 p-5">
          <p className="text-sm font-bold text-rose-200">YOUR PROCEDURE BRIEF</p>
          <pre className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{out}</pre>
          <button onClick={() => downloadPdf("iLERA PROCEDURE EXPLAINER\n" + new Date().toLocaleString() + "\n\nProcedure: " + proc + "\nAge: " + age + "\nInsurance: " + ins + "\nReason: " + why + "\n\n" + out + "\n\n---\nEducational preparation only - iLera never recommends or discourages a procedure.", "iLera-" + proc.replace(/\s+/g, "-") + ".pdf")} className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400">Download PDF</button>
        </div>
      )}
    </main>
  );
}

