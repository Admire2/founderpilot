"use client";
import WalletBar from "@/app/components/WalletBar";
import { useState } from "react";
import Link from "next/link";

export default function PasswordGeneratorPage() {
  const [len, setLen] = useState(16);
  const [upper, setUpper] = useState(true);
  const [nums, setNums] = useState(true);
  const [syms, setSyms] = useState(true);
  const [pass, setPass] = useState("");

  const generate = () => {
    let chars = "abcdefghijklmnopqrstuvwxyz";
    if (upper) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (nums) chars += "0123456789";
    if (syms) chars += "!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let p = "";
    for (let i = 0; i < len; i++) p += chars.charAt(Math.floor(Math.random() * chars.length));
    setPass(p);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <WalletBar />

      <div className="max-w-2xl mx-auto">
        <Link href="/suite" className="text-cyan-400 hover:underline mb-6 inline-block">&larr; Back to Suite</Link>
        <h1 className="text-3xl font-bold mb-2">Secure Password Generator</h1>
        <p className="text-slate-400 mb-8">Generate complex, unhackable passwords locally. Nothing is sent to any server.</p>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium">Length: <span className="text-cyan-300 font-bold">{len}</span></label>
            <input type="range" min={8} max={64} value={len} onChange={(e) => setLen(Number(e.target.value))} className="w-full accent-cyan-500" />
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={upper} onChange={(e) => setUpper(e.target.checked)} className="accent-cyan-500" /> Uppercase</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={nums} onChange={(e) => setNums(e.target.checked)} className="accent-cyan-500" /> Numbers</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={syms} onChange={(e) => setSyms(e.target.checked)} className="accent-cyan-500" /> Symbols</label>
          </div>
          <button onClick={generate} className="w-full rounded-xl bg-cyan-500 px-6 py-4 font-semibold text-slate-950 hover:bg-cyan-400">Generate Password</button>
        </div>

        {pass && (
          <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
            <p className="text-2xl font-mono font-bold text-emerald-300 break-all mb-4">{pass}</p>
            <button onClick={() => navigator.clipboard.writeText(pass)} className="rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-400">Copy to Clipboard</button>
          </div>
        )}
      </div>
    </main>
  );
}