"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const CATS = ["Jewelry & Gems", "Shoes & Leather", "Clothing & Textiles", "Luxury Consumables", "Artisan Services"];
export default function KaraRequest() {
  const [title, setTitle] = useState(""); const [cat, setCat] = useState(CATS[0]);
  const [desc, setDesc] = useState(""); const [budget, setBudget] = useState(""); const [deadline, setDeadline] = useState("");
  const [email, setEmail] = useState(""); const [file, setFile] = useState<any>(null);
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const submit = async () => {
    if (!title.trim() || !desc.trim()) { setMsg("Add a title and a description of what you want built."); return; }
    setBusy(true); setMsg("");
    let url = "";
    try {
      if (file) {
        const path = "req-" + Date.now() + "-" + file.name;
        const up = await sb.storage.from("kara").upload(path, file, { upsert: true });
        if (!up.error) url = sb.storage.from("kara").getPublicUrl(path).data.publicUrl;
      }
    } catch (e) {}
    try {
      const r = await fetch("/api/karakata/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, title, category: cat, description: desc, budget, deadline, image_url: url }) });
      const j = await r.json();
      setMsg(j.ok ? "Request is live. Matched sellers will quote - our concierge verifies the first quotes personally." : (j.error || "Failed."));
    } catch (e) { setMsg("Connection error."); }
    setBusy(false);
  };
  const inp = "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm";
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <Link href="/karakata" className="text-sm text-cyan-400 hover:underline">← KaraKata Market</Link>
      <h1 className="mt-3 text-3xl font-bold text-amber-300">📸 Build-It-For-Me</h1>
      <p className="mt-1 text-sm text-slate-400">Post a photo or description of the product you want. Verified sellers quote price and lead time. You accept - it gets built for you.</p>
      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="text-[11px] font-bold text-slate-300">What do you want built?</p>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={"mt-1 " + inp} placeholder="e.g. Gold-plated cufflinks with my family crest" />
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div><p className="text-[11px] font-bold text-slate-300">Category</p><select value={cat} onChange={(e) => setCat(e.target.value)} className={"mt-1 " + inp}>{CATS.map((c) => (<option key={c}>{c}</option>))}</select></div>
          <div><p className="text-[11px] font-bold text-slate-300">Your email</p><input value={email} onChange={(e) => setEmail(e.target.value)} className={"mt-1 " + inp} placeholder="you@email.com" /></div>
          <div><p className="text-[11px] font-bold text-slate-300">Budget (USD, optional)</p><input value={budget} onChange={(e) => setBudget(e.target.value)} className={"mt-1 " + inp} placeholder="250" /></div>
          <div><p className="text-[11px] font-bold text-slate-300">Needed by (optional)</p><input value={deadline} onChange={(e) => setDeadline(e.target.value)} className={"mt-1 " + inp} placeholder="Dec 20, 2026" /></div>
        </div>
        <p className="mt-3 text-[11px] font-bold text-slate-300">Describe it (materials, sizes, colors, references)</p>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} className={"mt-1 " + inp} placeholder="Sterling silver base, 18k gold plating, engraving on the back..." />
        <p className="mt-3 text-[11px] font-bold text-slate-300">Photo / reference image (optional)</p>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-500 file:px-3 file:py-2 file:text-sm file:font-bold file:text-slate-950" />
        <button onClick={submit} disabled={busy} className="mt-4 w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50">{busy ? "Posting..." : "Post My Custom Request"}</button>
        {msg && <p className="mt-2 text-xs font-bold text-emerald-300">{msg}</p>}
      </div>
    </main>
  );
}
