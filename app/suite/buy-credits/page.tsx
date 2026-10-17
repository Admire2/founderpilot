"use client";
import WalletBar from "@/components/WalletBar";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const SUBS = [
  { name: "Enterprise (Monthly)", price: "$99/mo", allowance: "800 credits/mo + priority Pia", url: (process.env.NEXT_PUBLIC_LINK_ENTERPRISE_MONTHLY || "https://buy.stripe.com/test_8x2eVc69G9qv2y0eIUdEs07"), hot: true },
  { name: "Enterprise (Annual)", price: "$999/yr", allowance: "800 credits/mo + priority Pia", url: (process.env.NEXT_PUBLIC_LINK_ENTERPRISE_ANNUAL || "https://buy.stripe.com/test_14A00i2Xu9qv3C49oAdEs08"), hot: false },
  { name: "Enterprise", price: "$99/mo", allowance: "800 credits/mo + priority Pia", url: (process.env.NEXT_PUBLIC_LINK_ENTERPRISE_MONTHLY || ""), hot: true },
  { name: "Pro (Monthly)", price: "$9/mo", allowance: "20 credits/mo", url: (process.env.NEXT_PUBLIC_LINK_PRO_MONTHLY || "https://buy.stripe.com/test_bJe9AS41yeKP7SkeIUdEs00") },
  { name: "Team (Monthly)", price: "$29/mo", allowance: "100 credits/mo", url: (process.env.NEXT_PUBLIC_LINK_TEAM_MONTHLY || "https://buy.stripe.com/test_4gMbJ069G7in1tW8kwdEs01") },
  { name: "Pro (Annual)", price: "$99/yr", allowance: "20 credits/mo", url: (process.env.NEXT_PUBLIC_LINK_PRO_ANNUAL || "https://buy.stripe.com/test_9B6eVc7dK9qv3C41W8dEs02") },
  { name: "Team (Annual)", price: "$299/yr", allowance: "100 credits/mo", url: (process.env.NEXT_PUBLIC_LINK_TEAM_ANNUAL || "https://buy.stripe.com/test_7sY6oG9lS8mr6OggR2dEs03") },
];

const PACKS = [
  { name: "Starter Pack", price: "$9", credits: 50, per: "$1.80/envelope", url: (process.env.NEXT_PUBLIC_LINK_PACK_STARTER || "https://buy.stripe.com/test_bJebJ069G1Y31tWcAMdEs04"), hot: false },
  { name: "Growth Pack", price: "$25", credits: 150, per: "$1.67/envelope", url: (process.env.NEXT_PUBLIC_LINK_PACK_GROWTH || "https://buy.stripe.com/test_8x228q41yfOT0pS7gsdEs05"), hot: true },
  { name: "Pro Pack", price: "$45", credits: 300, per: "$1.50/envelope", url: (process.env.NEXT_PUBLIC_LINK_PACK_PRO || "https://buy.stripe.com/test_00wbJ0bu0auza0sgR2dEs06"), hot: false },
];

export default function BuyCreditsPage() {
  const [email, setEmail] = useState("");
  const [locked, setLocked] = useState(false);
  useEffect(() => { (async () => { let em = ""; try { const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!); const { data } = await sb.auth.getSession(); em = (data.session && data.session.user && data.session.user.email) || ""; } catch (e) {} if (em) { setEmail(em); setLocked(true); } else { try { setEmail(localStorage.getItem("fp_wallet_email") || localStorage.getItem("fp_lead_email") || ""); } catch (e) {} } })(); }, []);

  const buy = (url: string) => {
    if (!email.includes("@")) { alert("Enter your wallet email first - credits are added to it automatically."); return; }
    try { localStorage.setItem("fp_wallet_email", email); } catch (e) {} window.open(url + "?client_reference_id=" + encodeURIComponent(email), "_blank");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <WalletBar />
      <div className="max-w-5xl mx-auto">
        <Link href="/suite" className="text-cyan-400 hover:underline mb-6 inline-block">&larr; Back to Suite</Link>
        <h1 className="text-3xl font-bold mb-2">PilotSign Credits & Subscriptions</h1>
        <p className="text-slate-400 mb-6">1 action = 10 credits: send envelope, generate QR, merge PDF, JPG to PDF. Subscriptions refresh monthly (use-it-or-lose-it). Packs never expire. Switching plans resets your monthly allowance - purchased credits are never lost. DocuSign charges $3–$7.80/envelope — you pay from $1.50.</p>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-8">
          <label className="mb-2 block text-sm font-medium">Your wallet email (credits are added here automatically after payment)</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} readOnly={locked} placeholder="you@company.com" className={"w-full rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm outline-none focus:border-cyan-400 " + (locked ? "cursor-not-allowed opacity-70" : "")} />
          {locked && <p className="mt-2 text-xs text-emerald-300">🔒 Locked to your login email - purchases always credit THIS address (your proof of purchase).</p>}
        </div>

        <h2 className="text-xl font-bold mb-4">Monthly Subscriptions (with credit allowances)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {SUBS.map((s) => (
            <div key={s.name} className="rounded-2xl border border-purple-500/30 bg-purple-500/5 p-6 space-y-3">
              <h3 className="text-lg font-bold">{s.name}</h3>
              <p className="text-2xl font-bold text-purple-300">{s.price}</p>
              <p className="text-sm text-slate-300">{s.allowance} refreshed monthly</p>
              <button onClick={() => buy(s.url)} className="w-full rounded-xl bg-purple-500 px-4 py-3 font-bold text-white hover:bg-purple-400">Subscribe</button>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-bold mb-4">One-Time Credit Packs (top-ups)</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PACKS.map((p) => (
            <div key={p.name} className={"rounded-2xl border p-6 space-y-3 " + (p.hot ? "border-cyan-400 bg-cyan-500/10" : "border-white/10 bg-white/5")}>
              {p.hot && <span className="text-[10px] font-bold bg-cyan-500 text-slate-950 px-2 py-1 rounded-full">MOST POPULAR</span>}
              <h3 className="text-lg font-bold">{p.name}</h3>
              <p className="text-2xl font-bold text-cyan-300">{p.price}</p>
              <p className="text-sm text-slate-300">{p.credits} credits</p>
              <p className="text-xs text-slate-500">{p.per}</p>
              <button onClick={() => buy(p.url)} className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-bold text-slate-950 hover:bg-cyan-400">Buy {p.name}</button>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-slate-500">Payments are processed securely by Stripe. Credits appear in your wallet automatically within seconds — Pia emails you a receipt.</p>
      </div>
    </main>
  );
}