"use client";
import { useState } from "react";
import Link from "next/link";
import WalletBar from "@/app/components/WalletBar";
import { downloadPdf } from "@/lib/pdf";
export default function KaraLaunch() {
  const [main, setMain] = useState("");
  const [extra, setExtra] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const run = async () => {
    if (!main.trim()) { setErr("Fill the main input first."); return; }
    setBusy(true); setErr(""); setOut("");
    let email = "";
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) { const j = JSON.parse(localStorage.getItem(k) || "null"); email = (j && j.user && j.user.email) || ""; if (email) break; } } } catch (e) {}
    try {
      const r = await fetch("/api/karakata", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "companion", email, brief: main, conditions: extra }) });
      const j = await r.json();
      if (j.ok) { setOut(j.answer || "No response."); try { window.dispatchEvent(new Event("wallet-refresh")); } catch (e) {} }
      else setErr(j.error || "Failed.");
    } catch (e) { setErr("Connection error."); }
    setBusy(false);
  };
  const inp = "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm";
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <Link href="/suite/marketplace" className="mb-3 inline-block text-sm font-bold text-cyan-400 hover:underline">← Marketplace Suite</Link>
      <WalletBar />
      <h1 className="text-3xl font-bold text-amber-300">🛒 Launch Desk</h1>
      <p className="mt-1 text-sm text-slate-400">Your marketplace brief in - a full build plan out: two sides, liquidity strategy, MVP scope, monetization, trust layer, 90-day roadmap. 10 credits per run.</p>
      <div className="mt-3 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-[11px] font-bold text-amber-200">KaraKata tools are strategic and operational aids, not financial or legal advice.</div>
      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-amber-200">01 · INPUT</p>
        <textarea value={main} onChange={(e) => setMain(e.target.value)} rows={5} placeholder="A marketplace connecting Lagos tailors with diaspora buyers..." className={"mt-2 " + inp} />
        <p className="mt-3 text-[11px] font-bold text-slate-300">Constraints / context</p>
        <textarea value={extra} onChange={(e) => setExtra(e.target.value)} rows={3} placeholder="Constraints / contextA marketplace connecting Lagos tailors with diaspora buyers..." className={"mt-1 " + inp} />
        <button onClick={run} disabled={busy} className="mt-4 w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50">{busy ? "KaraKata is working..." : "Build My Launch Plan (10 credits)"}</button>
        {err && <p className="mt-2 text-xs font-bold text-rose-300">{err}</p>}
      </div>
      {out && (
        <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <p className="text-sm font-bold text-amber-200">03 · RESULT</p>
          <pre className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{out}</pre>
          <button onClick={() => downloadPdf("KARAKATA - Launch Desk\n" + new Date().toLocaleString() + "\n\nINPUT:\n" + main + "\n\n" + out, "karakata-launch-plan.pdf")} className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400">Download PDF</button>
        </div>
      )}
    </main>
  );
}