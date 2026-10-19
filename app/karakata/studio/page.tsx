"use client";
import { useState } from "react";
import Link from "next/link";
import WalletBar from "@/components/WalletBar";
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const CATS = ["Jewelry & Gems", "Fashion & Clothing", "Shoes & Leather", "Electronics", "Electrical & Solar", "Home & Kitchen", "Groceries & Consumables", "Beauty & Personal Care", "Health & Wellness", "Baby & Kids", "Sports & Outdoors", "Artisan Services"];
export default function Studio() {
  const [words, setWords] = useState("");
  const [cat, setCat] = useState(CATS[0]);
  const [cost, setCost] = useState("");
  const [occ, setOcc] = useState("Everyday");
  const [file, setFile] = useState<any>(null);
  const [img, setImg] = useState("");
  const [draft, setDraft] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const emailOf = () => { let e = ""; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) { const j = JSON.parse(localStorage.getItem(k) || "null"); e = (j && j.user && j.user.email) || ""; if (e) break; } } } catch (err) {} return e; };
  const parse = (t: string) => {
    const g = (p: string) => { const m = t.split("\n").find((l) => l.toUpperCase().indexOf(p + ":") === 0); return m ? m.slice(p.length + 1).trim() : ""; };
    return { title: g("TITLE"), price: g("PRICE_USD"), compare: g("COMPARE_AT"), tags: g("TAGS"), category: g("CATEGORY") || cat, desc: g("DESCRIPTION"), lead: g("LEAD_DAYS") || "7" };
  };
  const build = async () => {
    if (!words.trim()) { setMsg("Describe your product roughly first - one photo and rough words is all it takes."); return; }
    setBusy(true); setMsg(""); setDraft(null);
    let url = "";
    try { if (file) { const path = "list-" + Date.now() + "-" + file.name; const up = await sb.storage.from("kara").upload(path, file, { upsert: true }); if (!up.error) url = sb.storage.from("kara").getPublicUrl(path).data.publicUrl; } } catch (e) {}
    setImg(url);
    try {
      const r = await fetch("/api/karakata/studio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailOf(), words: words, category: cat, cost: cost, image: url }) });
      const j = await r.json();
      if (j.ok) { setDraft(parse(j.answer)); try { window.dispatchEvent(new Event("wallet-refresh")); } catch (e) {} } else setMsg(j.error || "Build failed.");
    } catch (e) { setMsg("Connection error."); }
    setBusy(false);
  };
  const publish = async () => {
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/karakata/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailOf(), title: draft.title, category: draft.category, description: draft.desc, price_usd: draft.price, lead_time_days: draft.lead, image_url: img, tags: draft.tags, occasion: occ }) });
      const j = await r.json();
      setMsg(j.ok ? "LIVE on KaraKata Market! Buyers can see it right now." : (j.error || "Publish failed."));
    } catch (e) { setMsg("Connection error."); }
    setBusy(false);
  };
  const inp = "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm";
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <Link href="/suite/marketplace" className="mb-3 inline-block text-sm font-bold text-cyan-400 hover:underline">← Marketplace Suite</Link>
      <WalletBar />
      <h1 className="text-3xl font-bold text-amber-300">🧑‍🍳 Seller Studio (AI Listing Generator)</h1>
      <p className="mt-1 text-sm text-slate-400">AI writes your listing for you: title, description, tags, benchmarked price. 2 credits. Prefer to write it yourself for free? Use manual listing instead. New to KaraKata? Build your WHOLE storefront free with AI: <a href="/karakata/build" style={{ color: "#fbbf24", fontWeight: 700 }}>Build my store free →</a></p>
      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-amber-200">01 · YOUR PRODUCT, ROUGHLY</p>
        <p className="mt-3 text-[11px] font-bold text-slate-300">Photo (recommended)</p>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-500 file:px-3 file:py-2 file:text-sm file:font-bold file:text-slate-950" />
        <p className="mt-3 text-[11px] font-bold text-slate-300">Rough words</p>
        <textarea value={words} onChange={(e) => setWords(e.target.value)} rows={3} className={"mt-1 " + inp} placeholder="handmade adire scarf, indigo cotton, about 2 metres, gift box..." />
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div><p className="text-[11px] font-bold text-slate-300">Category</p><select value={cat} onChange={(e) => setCat(e.target.value)} className={"mt-1 " + inp}>{CATS.map((c) => (<option key={c}>{c}</option>))}</select></div>
          <div><p className="text-[11px] font-bold text-slate-300">Your cost per unit (USD, optional - sets price floor)</p><input value={cost} onChange={(e) => setCost(e.target.value)} className={"mt-1 " + inp} placeholder="18" /></div>
        </div>
        <p className="mt-3 text-[11px] font-bold text-slate-300">Season / occasion</p>
        <select value={occ} onChange={(e) => setOcc(e.target.value)} className={"mt-1 " + inp}>{["Everyday", "Summer", "Winter", "Holiday", "School", "Wedding", "Festive"].map((o) => (<option key={o}>{o}</option>))}</select>
        <button onClick={build} disabled={busy} className="mt-4 w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50">{busy ? "AI is writing your listing..." : "Build My Listing (2 credits)"}</button>
        {msg && <p className="mt-2 text-xs font-bold text-emerald-300">{msg}</p>}
      </div>
      {draft && (
        <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <p className="text-sm font-bold text-amber-200">02 · LISTING PREVIEW</p>
          {img && <img src={img} alt="product" className="mt-3 h-48 w-full rounded-lg object-cover" />}
          <p className="mt-3 text-lg font-bold text-white">{draft.title}</p>
          <p className="text-sm text-emerald-300">${draft.price} {draft.compare && <span className="text-slate-500 line-through">${draft.compare}</span>} · {draft.category} · {draft.lead}-day lead</p>
          <p className="mt-2 text-sm text-slate-300">{draft.desc}</p>
          <p className="mt-2 text-[11px] text-slate-500">Tags: {draft.tags}</p>
          <button onClick={publish} disabled={busy} className="mt-4 w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50">Publish to KaraKata Market (free)</button>
          <Link href="/karakata" className="mt-2 block text-center text-xs text-cyan-400 hover:underline">View it live on the market →</Link>
          <Link href="/karakata/list" className="mt-2 block text-center text-xs text-cyan-400 hover:underline">← Or write listings yourself for free</Link>
        </div>
      )}
    </main>
  );
}

