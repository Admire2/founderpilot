"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const CATS = ["Jewelry & Gems", "Fashion & Clothing", "Shoes & Leather", "Electronics", "Electrical & Solar", "Home & Kitchen", "Groceries & Consumables", "Beauty & Personal Care", "Health & Wellness", "Baby & Kids", "Sports & Outdoors", "Artisan Services"];
export default function ManualList() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [cat, setCat] = useState(CATS[0]);
  const [desc, setDesc] = useState("");
  const [price, setPrice] = useState("");
  const [lead, setLead] = useState("7");
  const [occ, setOcc] = useState("Everyday");
  const [file, setFile] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const emailOf = () => { let e = ""; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) { const j = JSON.parse(localStorage.getItem(k) || "null"); e = (j && j.user && j.user.email) || ""; if (e) break; } } } catch (err) {} return e; };
  const publish = async () => {
    if (!title.trim() || !desc.trim() || !price.trim()) { setMsg("Title, description, and price are required."); return; }
    setBusy(true); setMsg("");
    let url = "";
    try { if (file) { const path = "list-" + Date.now() + "-" + file.name; const up = await sb.storage.from("kara").upload(path, file, { upsert: true }); if (!up.error) url = sb.storage.from("kara").getPublicUrl(path).data.publicUrl; } } catch (e) {}
    try {
      const r = await fetch("/api/karakata/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailOf(), title, category: cat, description: desc, price_usd: price, lead_time_days: lead, image_url: url, occasion: occ }) });
      const j = await r.json();
      setMsg(j.ok ? "LIVE on KaraKata Market! Your product is now visible to buyers." : (j.error || "Publish failed."));
    } catch (e) { setMsg("Connection error."); }
    setBusy(false);
  };
  const inp = "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm";
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <button 
        onClick={() => window.history.length > 1 ? router.back() : router.push('/karakata/build')} 
        className="mb-3 inline-block text-sm font-bold text-cyan-400 hover:text-cyan-300 transition"
      >
        ← Back
      </button>
      <h1 className="text-3xl font-bold text-amber-300">📝 List Your Product (Free)</h1>
      <p className="mt-1 text-sm text-slate-400">Upload a photo, write your own title/description, set your price. Publish live instantly. Zero cost, zero credits. Want AI to write it for you? Use Seller Studio (2 cr).</p>
      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-amber-200">YOUR PRODUCT DETAILS</p>
        <p className="mt-3 text-[11px] font-bold text-slate-300">Photo (recommended)</p>
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-500 file:px-3 file:py-2 file:text-sm file:font-bold file:text-slate-950" />
        <p className="mt-3 text-[11px] font-bold text-slate-300">Product title</p>
        <input value={title} onChange={(e) => setTitle(e.target.value)} className={"mt-1 " + inp} placeholder="Handmade Adire Scarf - Indigo Cotton" />
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div><p className="text-[11px] font-bold text-slate-300">Category</p><select value={cat} onChange={(e) => setCat(e.target.value)} className={"mt-1 " + inp}>{CATS.map((c) => (<option key={c}>{c}</option>))}</select></div>
          <div><p className="text-[11px] font-bold text-slate-300">Price (USD)</p><input value={price} onChange={(e) => setPrice(e.target.value)} className={"mt-1 " + inp} placeholder="45" /></div>
          <div><p className="text-[11px] font-bold text-slate-300">Lead time (days)</p><input value={lead} onChange={(e) => setLead(e.target.value)} className={"mt-1 " + inp} placeholder="7" /></div>
        </div>
        <p className="mt-3 text-[11px] font-bold text-slate-300">Season / occasion</p>
        <select value={occ} onChange={(e) => setOcc(e.target.value)} className={"mt-1 " + inp}>{["Everyday", "Summer", "Winter", "Holiday", "School", "Wedding", "Festive"].map((o) => (<option key={o}>{o}</option>))}</select>
        <p className="mt-3 text-[11px] font-bold text-slate-300">Description</p>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} className={"mt-1 " + inp} placeholder="Handwoven indigo cotton scarf, 2 meters long, perfect for gifts or personal wear..." />
        <button onClick={publish} disabled={busy} className="mt-4 w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50">{busy ? "Publishing..." : "Publish My Listing (Free)"}</button>
        {msg && <p className="mt-2 text-xs font-bold text-emerald-300">{msg}</p>}
        <Link href="/karakata/studio" className="mt-3 block text-center text-xs text-cyan-400 hover:underline">Prefer AI to write it? Open Seller Studio (2 cr) →</Link>
      </div>
    </main>
  );
}
