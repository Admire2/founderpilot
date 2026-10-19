"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import WalletBar from "@/components/WalletBar";
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
export default function Vault() {
  const [file, setFile] = useState<any>(null);
  const [note, setNote] = useState("");
  const [folder, setFolder] = useState("");
  const [items, setItems] = useState<any[]>([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState("");
  const emailOf = () => { let e = ""; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) { const j = JSON.parse(localStorage.getItem(k) || "null"); e = (j && j.user && j.user.email) || ""; if (e) break; } } } catch (err) {} return e; };
  const load = async () => { const e = emailOf() || "anon"; const { data } = await sb.storage.from("fp-vault").list(folder ? e + "/" + folder : e, { limit: 500 }); setItems(data || []); };
  useEffect(() => { load(); }, []);
  const upload = async () => { if (!file) { setMsg("Choose a file first."); return; } setBusy(true); setMsg(""); const e = emailOf() || "anon"; const path = e + "/" + (folder ? folder + "/" : "") + Date.now() + "-" + file.name; const { error } = await sb.storage.from("fp-vault").upload(path, file, { upsert: true }); setMsg(error ? String(error.message) : "Filed to your vault: " + file.name); if (!error) load(); setBusy(false); };
  const dl = async (name: string) => { const e = emailOf() || "anon"; const { data } = await sb.storage.from("fp-vault").createSignedUrl(e + "/" + (folder ? folder + "/" : "") + name, 300); if (data) window.open(data.signedUrl, "_blank"); };
  const fileIt = async (name: string) => { setBusy(true); setOut(""); const r = await fetch("/api/karakata", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "vaultsum", email: emailOf(), brief: "FILENAME: " + name + "\nNOTE: " + note }) }); const j = await r.json(); if (j.ok) { setOut(j.answer || ""); try { window.dispatchEvent(new Event("wallet-refresh")); } catch (e) {} } else setMsg(j.error || "Failed."); setBusy(false); };
  const inp = "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm";
  const bytes = items.reduce((a: number, x: any) => a + Number((x.metadata && x.metadata.size) || 0), 0);
  const mb = bytes / 1048576;
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <Link href="/suite/office" className="mb-3 inline-block text-sm font-bold text-cyan-400 hover:underline">← Office Suite</Link>
      <WalletBar />
      <h1 className="text-3xl font-bold text-cyan-300">🗄️ Doc Vault</h1>
      <p className="mt-1 text-sm text-slate-400">Your private business cloud - encrypted at rest, signed links only, AI filing clerk on call. The own-your-cloud job without the hardware.</p>
      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-5">
        <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-500 file:px-3 file:py-2 file:text-sm file:font-bold file:text-slate-950" />
        <button onClick={upload} disabled={busy} className="mt-3 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50">{busy ? "Filing..." : "File It (free)"}</button>
        {msg && <p className="mt-2 text-xs font-bold text-amber-300">{msg}</p>}
      </div>
      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-cyan-200">Your vault ({items.length} docs)</p>
        <div className="mt-2"><div className="h-2 w-full rounded bg-slate-800"><div className="h-2 rounded bg-cyan-500" style={{ width: Math.min(100, mb) + "%" }} /></div><p className="mt-1 text-[10px] text-slate-500">{mb.toFixed(1)} MB of 100 MB free tier</p></div>
        <input value={folder} onChange={(e) => setFolder(e.target.value)} onBlur={() => load()} className={"mt-2 " + inp} placeholder="Folder (optional): contracts, receipts... press Tab to enter" />
        {items.length === 0 && <p className="mt-2 text-xs text-slate-500">Empty - file your first contract or receipt above.</p>}
        <div className="mt-3 space-y-2">
          {items.map((it: any) => (
            <div key={it.name} className="flex items-center justify-between rounded-lg bg-slate-900 px-3 py-2">
              <p className="text-xs text-slate-300">{it.name}</p>
              <div className="flex gap-2">
                <button onClick={() => fileIt(it.name)} className="rounded bg-amber-500 px-2 py-1 text-[10px] font-bold text-slate-950">AI File It (10 cr)</button>
                <button onClick={() => dl(it.name)} className="rounded bg-cyan-500 px-2 py-1 text-[10px] font-bold text-slate-950">Download</button>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] font-bold text-slate-300">Context note for the AI clerk (optional)</p>
        <input value={note} onChange={(e) => setNote(e.target.value)} className={"mt-1 " + inp} placeholder="e.g. supplier contract signed Sep 2026..." />
      </div>
      {out && (<div className="mt-5 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-5"><pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{out}</pre></div>)}
    </main>
  );
}

