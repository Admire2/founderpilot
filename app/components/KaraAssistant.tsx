"use client";
import { useState } from "react";
import Link from "next/link";
export default function KaraAssistant() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [res, setRes] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const ask = async () => {
    if (!q.trim()) return;
    setBusy(true); setMsg(""); setRes([]);
    try {
      const r = await fetch("/api/karakata/list");
      const j = await r.json();
      const shelf = j.items || [];
      const local = shelf.filter((it: any) => (String(it.title) + " " + String(it.description) + " " + String(it.category)).toLowerCase().includes(q.toLowerCase()));
      if (local.length) {
        setRes(local.slice(0, 6).map((it: any) => ({ n: it.title, p: it.price_usd, c: it.category, id: it.id })));
        setMsg("From the KaraKata shelf:");
      } else {
        setMsg("Not on the shelf yet - AI scouting now...");
        let email = "";
        try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) { const jj = JSON.parse(localStorage.getItem(k) || "null"); email = (jj && jj.user && jj.user.email) || ""; if (email) break; } } } catch (e) {}
        const r2 = await fetch("/api/karakata", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "scout", email: email || "guest@karakata.market", brief: q }) });
        const j2 = await r2.json();
        const rows = String(j2.answer || "").split("\n").filter((l: string) => l.toUpperCase().indexOf("PRODUCT:") === 0);
        setRes(rows.map((l: string) => { const g = (k: string) => { const m = l.split("|").find((s: string) => s.trim().toUpperCase().indexOf(k + ":") === 0); return m ? m.split(":").slice(1).join(":").trim() : ""; }; return { n: g("PRODUCT"), p: g("PRICE"), c: g("CATEGORY"), ai: true }; }));
        setMsg("AI-sourced matches - request one and sellers see the demand:");
      }
    } catch (e) { setMsg("Connection error."); }
    setBusy(false);
  };
  return (
    <>
      <button onClick={() => setOpen(!open)} className="fixed bottom-28 right-5 z-50 rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-amber-300 shadow-2xl hover:bg-slate-800">🤖 Ask KaraKata</button>
      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-80 rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
          <p className="text-sm font-bold text-slate-900">🤖 KaraKata Buyer Assistant</p>
          <p className="mt-1 text-[11px] text-slate-500">Tell me what you need - I find it on the shelf or source it.</p>
          <div className="mt-2 flex gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") ask(); }} className="flex-1 rounded-lg border border-slate-300 px-2 py-1.5 text-sm text-slate-900" placeholder="gift under $50 for mom..." />
            <button onClick={ask} className="rounded-lg bg-amber-400 px-3 py-1.5 text-sm font-bold text-slate-900">{busy ? "..." : "Ask"}</button>
          </div>
          {msg && <p className="mt-2 text-[11px] font-bold text-slate-600">{msg}</p>}
          <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
            {res.map((x: any, i: number) => (
              <div key={i} className="rounded-lg border border-slate-200 p-2">
                {x.id ? (<Link href={"/karakata/p/" + x.id} className="text-xs font-bold text-slate-900 hover:text-amber-700">{x.n}</Link>) : (<p className="text-xs font-bold text-slate-900">{x.n} <span className="text-cyan-600">· AI-sourced</span></p>)}
                <p className="text-[10px] text-slate-500">{x.c} · ${x.p}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
