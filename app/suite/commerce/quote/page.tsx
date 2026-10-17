"use client";
import { useState } from "react";
import Link from "next/link";
import WalletBar from "@/app/components/WalletBar";
import { downloadPdf } from "@/lib/pdf";
export default function KaraKataQuote() {
  const [brief, setBrief] = useState("");
  const [category, setCategory] = useState("Service / freelance");
  const [audience, setAudience] = useState("");
  const [numbers, setNumbers] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const run = async () => {
    if (!brief.trim()) { setErr("Describe what you sell first - rough notes are fine."); return; }
    setBusy(true); setErr(""); setOut("");
    let email = "";
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) { const j = JSON.parse(localStorage.getItem(k) || "null"); email = (j && j.user && j.user.email) || ""; if (email) break; } } } catch (e) {}
    try {
      const r = await fetch("/api/oja", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "quote", email, brief, category, audience, numbers }) });
      const j = await r.json();
      if (j.ok) { setOut(j.answer || "No response."); try { window.dispatchEvent(new Event("wallet-refresh")); } catch (e) {} }
      else setErr(j.error || "Failed.");
    } catch (e) { setErr("Connection error."); }
    setBusy(false);
  };
  const download = () => {
    downloadPdf("OJA " + "KaraKata Quote & Invoice Builder_TAG" + "\n" + new Date().toLocaleString() + "\n\nBRIEF:\n" + brief + "\nCategory: " + category + "\nAudience: " + audience + "\nNumbers: " + numbers + "\n\n" + out + "\n\n---\nKaraKata - FounderPilot Marketplace Suite. Educational estimates; confirm with your accountant.", "oja-quote.pdf");
  };
  const inp = "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm";
  const lbl = "text-[11px] font-bold text-slate-300";
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <Link href="/suite/marketplace" className="mb-3 inline-block text-sm font-bold text-cyan-400 hover:underline">← Marketplace Suite</Link>
      <WalletBar />
      <h1 className="text-3xl font-bold text-amber-300">🧾 KaraKata Quote & Invoice Builder</h1>
      <p className="mt-1 text-sm text-slate-400">SUBKaraKata Quote & Invoice Builder 10 credits per run.</p>
      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-amber-200">01 · YOUR BRIEF</p>
        <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={5} placeholder="Line items one per line: description | qty | rate  e.g. Logo design | 1 | 450" className={"mt-2 " + inp} />
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div><p className={lbl}>Category</p><select value={category} onChange={(e) => setCategory(e.target.value)} className={"mt-1 " + inp}><option selected>Service / freelance</option><option>Physical product</option><option>Trade / installation</option><option>Event / catering</option></select></div>
          <div><p className={lbl}>Audience</p><input value={audience} onChange={(e) => setAudience(e.target.value)} className={"mt-1 " + inp} placeholder="Client name / business" /></div>
          <div><p className={lbl}>Tax %, discount %, deposit %</p><input value={numbers} onChange={(e) => setNumbers(e.target.value)} className={"mt-1 " + inp} placeholder="tax 7.5, discount 0, deposit 50, validity 14 days" /></div>
        </div>
        <button onClick={run} disabled={busy} className="mt-4 w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50">{busy ? "KaraKata is working..." : "Build My Quote (10 credits)"}</button>
        {err && <p className="mt-2 text-xs font-bold text-amber-300">{err}</p>}
      </div>
      {out && (
        <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <p className="text-sm font-bold text-amber-200">03 · RESULT</p>
          <pre className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{out}</pre>
          <button onClick={download} className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400">Download PDF</button>
        </div>
      )}
    </main>
  );
}