"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const CATS = ["Jewelry & Gems", "Fashion & Clothing", "Shoes & Leather", "Electronics", "Electrical & Solar", "Home & Kitchen", "Groceries & Consumables", "Beauty & Personal Care", "Health & Wellness", "Baby & Kids", "Sports & Outdoors", "Artisan Services", "Vehicles & Auto Parts"];
const OCC = ["Everyday", "Summer", "Winter", "Holiday", "School", "Wedding", "Festive"];
export default function SellerCenter() {
  const [shop, setShop] = useState(""); const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); const [wa, setWa] = useState("");
  const [city, setCity] = useState(""); const [country, setCountry] = useState("");
  const [cat, setCat] = useState(CATS[0]); const [craft, setCraft] = useState("");
  const [pMsg, setPMsg] = useState(""); const [pBusy, setPBusy] = useState(false);
  const [title, setTitle] = useState(""); const [pcat, setPcat] = useState(CATS[0]);
  const [price, setPrice] = useState(""); const [lead, setLead] = useState("7");
  const [occ, setOcc] = useState("Everyday"); const [desc, setDesc] = useState("");
  const [file, setFile] = useState<any>(null);
  const [lMsg, setLMsg] = useState(""); const [lBusy, setLBusy] = useState(false);
  const [cInv, setCInv] = useState(false);
  const [sales, setSales] = useState("1000"); const [cFun, setCFun] = useState(false); const [cBi, setCBi] = useState(false);
  const saveProfile = async () => {
    if (!shop.trim() || !email.trim()) { setPMsg("Shop name and email are required."); return; }
    setPBusy(true); setPMsg("");
    try {
      const r = await fetch("/api/karakata/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, shop_name: shop, category: cat, country, city, craft, phone, whatsapp: wa }) });
      await fetch("/api/karakata/aje", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "consent", email, consent_inventory: cInv, consent_funding: cFun, consent_bi: cBi }) });
      const j = await r.json();
      setPMsg(j.ok ? "Seller profile saved - Kara, your onboarding agent, just queued your welcome email and will nudge you until your first product is live." : (j.error || "Failed."));
    } catch (e) { setPMsg("Connection error."); }
    setPBusy(false);
  };
  const addProduct = async () => {
    if (!title.trim() || !desc.trim() || !price.trim()) { setLMsg("Title, description and price are required."); return; }
    setLBusy(true); setLMsg("");
    let url = "";
    try { if (file) { const path = "list-" + Date.now() + "-" + file.name; const up = await sb.storage.from("kara").upload(path, file, { upsert: true }); if (!up.error) url = sb.storage.from("kara").getPublicUrl(path).data.publicUrl; } } catch (e) {}
    try {
      const r = await fetch("/api/karakata/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, title, category: pcat, description: desc, price_usd: price, lead_time_days: lead, image_url: url, occasion: occ }) });
      const j = await r.json();
      setLMsg(j.ok ? "Product LIVE on KaraKata Market! Add another below or view the market." : (j.error || "Failed."));
    } catch (e) { setLMsg("Connection error."); }
    setLBusy(false);
  };
  const inp = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";
  const lbl = "text-[11px] font-bold text-slate-600";
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <Link href="/karakata" className="text-sm font-bold text-emerald-700 hover:underline">← Back to KaraKata Market</Link>
      <h1 className="mt-3 text-3xl font-bold">🧑‍💼 Seller Center</h1>
      
    <div className="mt-4 flex gap-3 flex-wrap">
      <Link href="/karakata/seller/orders" className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200">?? Orders</Link>
      <Link href="/karakata/seller/messages" className="rounded-lg bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-200">?? Messages</Link>
    </div>
      <p className="mt-1 text-sm text-slate-600">Register your contact, upload pictures, link your products and services - Amazon-style, but free to start and AI-empowered.</p>
      <p className="mt-2 inline-block rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-[11px] font-bold text-cyan-700">🤖 Kara - onboarding agent: automatic welcome email + day-2 nudge for every new seller</p>
            <div className="mt-6 rounded-xl border-2 border-amber-300 bg-amber-50 p-5">
        <p className="text-lg font-bold text-slate-900">⚔️ Fee War Calculator — what your monthly sales cost elsewhere</p>
        <p className="mt-1 text-xs text-slate-600">My monthly sales (USD): <input value={sales} onChange={(e) => setSales(e.target.value)} className="ml-1 w-24 rounded border border-slate-300 px-2 py-1 text-sm" /> </p>
        {(() => {
          const S = Number(sales) || 1000;
          const rows = [
            { n: "Amazon", lo: 0.30 * S, hi: 0.45 * S, note: "15% referral + $39.99/mo + FBA + ads (30-45% all-in)" },
            { n: "Etsy", lo: 0.12 * S, hi: 0.20 * S, note: "$0.20 listing + 6.5% + processing + offsite ads" },
            { n: "eBay", lo: 0.13 * S, hi: 0.15 * S, note: "~13.25% final value + per-order fees" },
            { n: "Shopify", lo: 39 + 0.029 * S, hi: 39 + 0.049 * S, note: "$39+ rent + 2.9% + 30c - and you bring your own traffic" },
            { n: "TikTok Shop", lo: 0.06 * S, hi: 0.08 * S, note: "6% referral; promos & affiliates can triple it" },
            { n: "KaraKata", lo: 0, hi: 0.10 * S, note: "0% first 6 months (founding), then 8-10% - BI desk included", us: true }
          ];
          const max = Math.max.apply(null, rows.map((r) => r.hi)) || 1;
          return (
            <div className="mt-3 space-y-2">
              {rows.map((r: any) => (
                <div key={r.n}>
                  <div className="flex justify-between text-xs font-bold text-slate-700"><span>{r.n}{r.us ? " 🛒" : ""}</span><span>{r.us && r.lo === 0 ? "$0 now → $" + Math.round(r.hi) + "/mo later" : "$" + Math.round(r.lo) + " - $" + Math.round(r.hi) + "/mo"}</span></div>
                  <div className="h-3 w-full rounded bg-slate-200"><div className={"h-3 rounded " + (r.us ? "bg-emerald-500" : "bg-rose-400")} style={{ width: Math.max(2, (r.hi / max) * 100) + "%" }} /></div>
                  <p className="text-[10px] text-slate-500">{r.note}</p>
                </div>
              ))}
              <p className="pt-1 text-xs font-bold text-emerald-700">On ${S}/mo you keep up to ${S - Math.round(0.10 * S)} with KaraKata vs ${S - Math.round(0.45 * S)}-${S - Math.round(0.30 * S)} on Amazon.</p>
            </div>
          );
        })()}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-lg font-bold">1 · Your seller profile & contact</p>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div><p className={lbl}>Shop / business name</p><input value={shop} onChange={(e) => setShop(e.target.value)} className={"mt-1 " + inp} placeholder="Adire & Gold Atelier" /></div>
            <div><p className={lbl}>Email</p><input value={email} onChange={(e) => setEmail(e.target.value)} className={"mt-1 " + inp} placeholder="you@shop.com" /></div>
            <div><p className={lbl}>Phone</p><input value={phone} onChange={(e) => setPhone(e.target.value)} className={"mt-1 " + inp} placeholder="+234..." /></div>
            <div><p className={lbl}>WhatsApp (private - support & payouts only)</p><input value={wa} onChange={(e) => setWa(e.target.value)} className={"mt-1 " + inp} placeholder="+234..." /></div>
            <div><p className={lbl}>City</p><input value={city} onChange={(e) => setCity(e.target.value)} className={"mt-1 " + inp} placeholder="Lagos" /></div>
            <div><p className={lbl}>Country</p><input value={country} onChange={(e) => setCountry(e.target.value)} className={"mt-1 " + inp} placeholder="Nigeria" /></div>
            <div><p className={lbl}>Main category</p><select value={cat} onChange={(e) => setCat(e.target.value)} className={"mt-1 " + inp}>{CATS.map((c) => (<option key={c}>{c}</option>))}</select></div>
          </div>
          <p className={"mt-3 " + lbl}>What you sell / your craft</p>
          <textarea value={craft} onChange={(e) => setCraft(e.target.value)} rows={2} className={"mt-1 " + inp} placeholder="Handwoven adire, beaded jewelry, event photography..." />
          <p className="mt-4 text-[11px] font-bold text-slate-600"><p className="mb-3 text-[11px] font-bold text-emerald-700">Buyer messages reach you through the KaraKata relay form on your listings - your phone and email are never shown to buyers.</p>
Optional growth program (tick only what you allow - revocable anytime)</p>
        <label className="mt-1 flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={cInv} onChange={(e) => setCInv(e.target.checked)} /> Share inventory & sales data for my free BI dashboard</label>
        <label className="mt-1 flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={cBi} onChange={(e) => setCBi(e.target.checked)} /> Email me monthly BI reports & profit tips</label>
        <label className="mt-1 flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={cFun} onChange={(e) => setCFun(e.target.checked)} /> Consider me for OPTIONAL expansion-funding offers</label>
        <button onClick={saveProfile} disabled={pBusy} className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50">{pBusy ? "Saving..." : "Save My Seller Profile (free)"}</button>
          {pMsg && <p className="mt-2 text-xs font-bold text-emerald-700">{pMsg}</p>}
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-lg font-bold">2 · Link your products & services</p>
          <p className="mt-1 text-xs text-slate-500">Upload pictures, set your price, publish live. Repeat for every item.</p>
          <p className={"mt-3 " + lbl}>Photo</p>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-500 file:px-3 file:py-2 file:text-sm file:font-bold file:text-slate-950" />
          <p className={"mt-3 " + lbl}>Title</p>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={"mt-1 " + inp} placeholder="Handmade Adire Scarf - Indigo" />
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div><p className={lbl}>Category</p><select value={pcat} onChange={(e) => setPcat(e.target.value)} className={"mt-1 " + inp}>{CATS.map((c) => (<option key={c}>{c}</option>))}</select></div>
            <div><p className={lbl}>Season / occasion</p><select value={occ} onChange={(e) => setOcc(e.target.value)} className={"mt-1 " + inp}>{OCC.map((o) => (<option key={o}>{o}</option>))}</select></div>
            <div><p className={lbl}>Price (USD)</p><input value={price} onChange={(e) => setPrice(e.target.value)} className={"mt-1 " + inp} placeholder="45" /></div>
            <div><p className={lbl}>Lead time (days)</p><input value={lead} onChange={(e) => setLead(e.target.value)} className={"mt-1 " + inp} placeholder="7" /></div>
          </div>
          <p className={"mt-3 " + lbl}>Description</p>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className={"mt-1 " + inp} placeholder="Materials, sizes, colors, what makes it special..." />
          <button onClick={addProduct} disabled={lBusy} className="mt-4 w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50">{lBusy ? "Publishing..." : "Publish This Product (free)"}</button>
          {lMsg && <p className="mt-2 text-xs font-bold text-emerald-700">{lMsg}</p>}
          <Link href="/karakata/studio" className="mt-3 block text-center text-xs font-bold text-cyan-700 hover:underline"><a href="/karakata/auto" className="mt-2 block text-center text-xs font-bold text-emerald-700 underline">🚗 Selling a vehicle or parts? Open the Auto Desk - VIN, history report & inspection badges →</a>
Prefer AI to write listings? Seller Studio (2 cr) →</Link>
        </div>
      </div>
            <div className="mt-6 rounded-xl border-2 border-emerald-300 bg-white p-5 shadow-sm">
        <p className="text-lg font-bold">💳 Stripe Connect — receive real money</p>
        <p className="mt-1 text-xs text-slate-600">Link your bank account to Stripe. Once enabled, delivered orders auto-pay into your bank. Founding sellers: 0% fee for 6 months, then 8%.</p>
        <div id="stripe_connect" className="mt-3" />
        <button onClick={async () => {
          const el = document.getElementById("stripe_connect");
          if (el) el.innerHTML = "<p class='text-xs text-slate-500'>Creating your Connect account...</p>";
          try {
            const r = await fetch("/api/karakata/connect/onboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
            const j = await r.json();
            if (j.ok && j.url) { window.location.href = j.url; }
            else if (el) el.innerHTML = "<p class='text-xs font-bold text-rose-600'>" + (j.error || "Failed") + "</p>";
          } catch (e) { if (el) el.innerHTML = "<p class='text-xs font-bold text-rose-600'>Connection error</p>"; }
        }} className="mt-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500">Connect your bank (Stripe-hosted) →</button>
        <div id="connect_status" className="mt-2 text-xs text-slate-500" />
        <script dangerouslySetInnerHTML={{ __html: `
          (async () => {
            try {
              const email = (() => { try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) { const j = JSON.parse(localStorage.getItem(k) || "null"); if (j && j.user && j.user.email) return j.user.email; } } } catch (e) {} return ""; })();
              if (!email) return;
              const r = await fetch("/api/karakata/connect/account?email=" + encodeURIComponent(email));
              const j = await r.json();
              const el = document.getElementById("connect_status");
              if (!j.ok || !j.stripe_account) { if (el) el.innerHTML = "Connect status: not connected"; return; }
              const chips = [];
              if (j.charges_enabled) chips.push("<span class='rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-bold'>Charges ✅</span>");
              if (j.payouts_enabled) chips.push("<span class='rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-bold'>Payouts ✅</span>");
              if (chips.length === 0) chips.push("<span class='rounded-full bg-amber-100 text-amber-700 px-2 py-0.5 text-[10px] font-bold'>KYC pending</span>");
              if (el) el.innerHTML = "Connect (" + j.stripe_account + "): " + chips.join(" ");
            } catch (e) {}
          })();
        `}} />
      </div>
      <p className="mt-6 text-center text-xs text-slate-500">Founding sellers: 0% commission for 6 months, then 8-10% only when you sell. No subscriptions, no listing fees.</p>
    </main>
  );
}
