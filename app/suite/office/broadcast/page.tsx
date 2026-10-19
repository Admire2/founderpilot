"use client";
import { useState } from "react";
import Link from "next/link";
import WalletBar from "@/components/WalletBar";
import { downloadPdf } from "@/lib/pdf";
const CHECKS = ["Camera framed + lit", "Mic peaking -6dB", "Overlay/branding loaded", "Stream key verified", "First-60-sec hook rehearsed"];
export default function Broadcast() {
  const [goal, setGoal] = useState("");
  const [plats, setPlats] = useState("YouTube + Facebook");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [mins, setMins] = useState(60);
  const [left, setLeft] = useState(0);
  const [checks, setChecks] = useState<boolean[]>([false, false, false, false, false]);
  const emailOf = () => { let e = ""; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) { const j = JSON.parse(localStorage.getItem(k) || "null"); e = (j && j.user && j.user.email) || ""; if (e) break; } } } catch (err) {} return e; };
  const run = async () => { if (!goal.trim()) return; setBusy(true); setOut(""); const r = await fetch("/api/karakata", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "broadcast", email: emailOf(), brief: "EVENT: " + goal + "\nPLATFORMS: " + plats }) }); const j = await r.json(); if (j.ok) { setOut(j.answer || ""); try { window.dispatchEvent(new Event("wallet-refresh")); } catch (e) {} } setBusy(false); };
  const startCd = () => { setLeft(mins * 60); const iv = setInterval(() => setLeft((l) => { if (l <= 1) { clearInterval(iv); return 0; } return l - 1; }), 1000); };
  const obsJson = () => { const names = ["Starting Soon", "Host Camera", "Screen Share", "Guest Interview", "BRB / Outro"]; const coll = { current_scene: names[0], scenes: names.map((n) => ({ name: n, sources: [{ name: "Camera", id: "dshow_input", settings: {} }, { name: "Mic", id: "wasapi_input", settings: {} }, { name: "Brand Overlay", id: "image", settings: {} }] })) }; const blob = new Blob([JSON.stringify(coll, null, 2)], { type: "application/json" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "karakata-scenes.json"; a.click(); };
  const inp = "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm";
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <Link href="/suite/office" className="mb-3 inline-block text-sm font-bold text-cyan-400 hover:underline">← Office Suite</Link>
      <WalletBar />
      <h1 className="text-3xl font-bold text-cyan-300">📡 Broadcast Kit</h1>
      <p className="mt-1 text-sm text-slate-400">Your free stream engine is the engine; this is the flight plan. Scenes, countdown, titles, hashtags, repurpose - one runbook.</p>
      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="text-[11px] font-bold text-slate-300">What are you broadcasting?</p>
        <textarea value={goal} onChange={(e) => setGoal(e.target.value)} rows={3} className={"mt-1 " + inp} placeholder="Product launch: new Ankara collection, 45 min, host + camera + screen share..." />
        <p className="mt-3 text-[11px] font-bold text-slate-300">Platforms</p>
        <select value={plats} onChange={(e) => setPlats(e.target.value)} className={"mt-1 " + inp}><option>YouTube + Facebook</option><option>YouTube only</option><option>Twitch only</option><option>Facebook + Instagram Live</option><option>All major platforms</option></select>
        <button onClick={run} disabled={busy} className="mt-4 w-full rounded-lg bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50">{busy ? "Writing runbook..." : "Build My Stream Runbook (10 credits)"}</button>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="rounded-lg bg-slate-900 p-3">
            <p className="text-xs font-bold text-cyan-200">Producer View - T-minus countdown</p>
            <div className="mt-2 flex items-center gap-2">
              <input type="number" value={mins} onChange={(e) => setMins(Number(e.target.value) || 60)} className="w-16 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs" />
              <button onClick={startCd} className="rounded bg-cyan-500 px-2 py-1 text-[10px] font-bold text-slate-950">Start</button>
              <span className="font-mono text-lg text-amber-300">{Math.floor(left / 60)}:{String(left % 60).padStart(2, "0")}</span>
            </div>
            <div className="mt-2 space-y-1">{CHECKS.map((c, i) => (<label key={c} className="flex items-center gap-2 text-[11px] text-slate-300"><input type="checkbox" checked={checks[i]} onChange={(e) => { const nx = checks.slice(); nx[i] = e.target.checked; setChecks(nx); }} /> {c}</label>))}</div>
          </div>
          <div className="rounded-lg bg-slate-900 p-3">
            <p className="text-xs font-bold text-cyan-200">Open-source stream engine import</p>
            <p className="mt-1 text-[11px] text-slate-400">Scene collection file: your stream engine - Scene Collection - Import.</p>
            <button onClick={obsJson} className="mt-2 rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950">Download karakata-scenes.json</button>
          </div>
        </div>
      </div>
      {out && (<div className="mt-5 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-5">
        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{out}</pre>
        <button onClick={() => downloadPdf("BROADCAST KIT RUNBOOK\n" + goal + "\nPlatforms: " + plats + "\n\n" + out, "broadcast-runbook.pdf")} className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950">Download PDF</button>
      </div>)}
    </main>
  );
}

