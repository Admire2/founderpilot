"use client";
import { useState } from "react";
import Link from "next/link";
import WalletBar from "@/app/components/WalletBar";
import { downloadPdf } from "@/lib/pdf";
const WORDS = ["anchor","basil","cactus","dune","ember","falcon","glacier","harbor","iris","juniper","kite","lantern","mango","nebula","orchid","pine","quartz","river","saffron","tundra","umbra","velvet","willow","xenon","yarrow","zephyr","amber","bramble","cinder","drift"];
export default function VaultKeys() {
  const [len, setLen] = useState(16);
  const [sym, setSym] = useState(true);
  const [num, setNum] = useState(true);
  const [pw, setPw] = useState("");
  const [hibp, setHibp] = useState("");
  const [size, setSize] = useState("1-10 employees");
  const [ind, setInd] = useState("Retail / e-commerce");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const emailOf = () => { let e = ""; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) { const j = JSON.parse(localStorage.getItem(k) || "null"); e = (j && j.user && j.user.email) || ""; if (e) break; } } } catch (err) {} return e; };
  const gen = () => { const A = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"; const S = "!@#$%^&*()-_=+[]{}"; const N = "0123456789"; let pool = A + (num ? N : "") + (sym ? S : ""); let s = ""; const c = crypto as any; for (let i = 0; i < len; i++) { s += pool[c.getRandomValues(new Uint32Array(1))[0] % pool.length]; } setPw(s); setHibp(""); };
  const passphrase = () => { const s: string[] = []; const c = crypto as any; for (let i = 0; i < 6; i++) { s.push(WORDS[c.getRandomValues(new Uint32Array(1))[0] % WORDS.length]); } setPw(s.join("-") + "-" + (c.getRandomValues(new Uint32Array(1))[0] % 90 + 10)); setHibp(""); };
  const entropy = () => { if (!pw) return 0; if (pw.indexOf("-") > 0) return Math.round(pw.split("-").length * Math.log2(WORDS.length)); let pool = 26; if (/[A-Z]/.test(pw)) pool += 26; if (/[0-9]/.test(pw)) pool += 10; if (/[^a-zA-Z0-9]/.test(pw)) pool += 20; return Math.round(pw.length * Math.log2(pool)); };
  const crackTime = () => { const secs = Math.pow(2, entropy()) / 1e10; if (secs < 60) return "seconds"; if (secs < 2592000) return "under a month"; if (secs < 3153600000) return "years to centuries"; return "centuries+ (strong)"; };
  const breachCheck = async () => { setHibp("checking..."); const buf = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(pw)); const hex = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase(); const r = await fetch("https://api.pwnedpasswords.com/range/" + hex.slice(0, 5)); const t = await r.text(); const hit = t.split("\n").find((l: string) => l.split(":")[0] === hex.slice(5)); setHibp(hit ? "EXPOSED " + Number(hit.split(":")[1]).toLocaleString() + " times in known breaches - rotate now" : "Never seen in known breaches (k-anonymity: only a 5-char hash prefix left your browser)"); };
  const run = async () => { setBusy(true); setOut(""); const r = await fetch("/api/karakata", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "keypolicy", email: emailOf(), brief: "COMPANY SIZE: " + size + "\nINDUSTRY: " + ind }) }); const j = await r.json(); if (j.ok) { setOut(j.answer || ""); try { window.dispatchEvent(new Event("wallet-refresh")); } catch (e) {} } setBusy(false); };
  const inp = "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm";
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <Link href="/suite/office" className="mb-3 inline-block text-sm font-bold text-cyan-400 hover:underline">← Office Suite</Link>
      <WalletBar />
      <h1 className="text-3xl font-bold text-cyan-300">🔐 Key Vault Advisor</h1>
      <div className="mt-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-[11px] font-bold text-emerald-200">Zero-knowledge: passwords generate in YOUR browser and are never sent to us. For the vault itself we recommend a free open-source self-hostable password vault - the free legends.</div>
      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-cyan-200">Generator (local, free)</p>
        <div className="mt-2 flex flex-wrap items-center gap-4 text-xs">
          <label>Length <input type="number" value={len} onChange={(e) => setLen(Number(e.target.value) || 16)} className="ml-1 w-16 rounded border border-slate-700 bg-slate-900 px-2 py-1" /></label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={sym} onChange={(e) => setSym(e.target.checked)} /> symbols</label>
          <label className="flex items-center gap-1"><input type="checkbox" checked={num} onChange={(e) => setNum(e.target.checked)} /> numbers</label>
          <button onClick={gen} className="rounded-lg bg-cyan-500 px-3 py-1.5 font-bold text-slate-950">Random</button>
          <button onClick={passphrase} className="rounded-lg bg-emerald-500 px-3 py-1.5 font-bold text-slate-950">Passphrase</button>
        </div>
        {pw && (<p className="mt-3 break-all rounded-lg bg-slate-900 px-3 py-2 font-mono text-sm text-emerald-300">{pw}</p>)}
        {pw && (<p className="mt-2 text-[11px] text-slate-400">Entropy ~ {entropy()} bits · offline crack @10B guesses/sec: {crackTime()} · <button onClick={breachCheck} className="text-cyan-300 underline">breach-check</button></p>)}
        {hibp && (<p className={"mt-1 text-xs font-bold " + (hibp.indexOf("EXPOSED") === 0 ? "text-rose-400" : "text-emerald-300")}>{hibp}</p>)}
      </div>
      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-cyan-200">Company password policy (AI, 10 credits)</p>
        <div className="mt-2 grid grid-cols-1 gap-3 md:grid-cols-2">
          <select value={size} onChange={(e) => setSize(e.target.value)} className={inp}><option>1-10 employees</option><option>11-50 employees</option><option>51-200 employees</option><option>200+ employees</option></select>
          <select value={ind} onChange={(e) => setInd(e.target.value)} className={inp}><option>Retail / e-commerce</option><option>Healthcare</option><option>Finance</option><option>Manufacturing</option><option>Services</option></select>
        </div>
        <button onClick={run} disabled={busy} className="mt-4 w-full rounded-lg bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50">{busy ? "Writing policy..." : "Write My Password Policy (10 credits)"}</button>
      </div>
      {out && (<div className="mt-5 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-5">
        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{out}</pre>
        <button onClick={() => downloadPdf("KEY VAULT POLICY\n" + size + " / " + ind + "\n\n" + out, "password-policy.pdf")} className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950">Download PDF</button>
      </div>)}
    </main>
  );
}
