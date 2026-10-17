"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
export default function SellerBI() {
  const [rep, setRep] = useState<any>(null);
  const [msg, setMsg] = useState("");
  const [cInv, setCInv] = useState(false);
  const [cFun, setCFun] = useState(false);
  const [cBi, setCBi] = useState(false);
  const emailOf = () => { let e = ""; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) { const j = JSON.parse(localStorage.getItem(k) || "null"); e = (j && j.user && j.user.email) || ""; if (e) break; } } } catch (err) {} return e; };
  const load = async () => {
    const r = await fetch("/api/karakata/aje", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "report", email: emailOf() }) });
    const j = await r.json();
    if (j.ok) { setRep(j); if (j.consent) { setCInv(!!j.consent.consent_inventory); setCFun(!!j.consent.consent_funding); setCBi(!!j.consent.consent_bi); } }
    else setMsg(j.error || "Load failed.");
  };
  useEffect(() => { if (emailOf()) load(); }, []);
  const saveConsent = async () => {
    const r = await fetch("/api/karakata/aje", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "consent", email: emailOf(), consent_inventory: cInv, consent_funding: cFun, consent_bi: cBi }) });
    const j = await r.json();
    setMsg(j.ok ? "Consent saved - optional and revocable anytime." : (j.error || "Failed."));
  };
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <Link href="/karakata" className="text-sm font-bold text-emerald-700 hover:underline">← KaraKata Market</Link>
      <h1 className="mt-3 text-3xl font-bold">📈 Aje - Your Business Intelligence Desk</h1>
      <p className="mt-1 text-sm text-slate-600">Free analytics for your storefront: velocity, stock alerts, buyer demand in your category, and your funding-eligibility tier. Data sharing is optional - you control every checkbox.</p>
      {msg && <p className="mt-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-xs font-bold text-amber-800">{msg}</p>}
      {!rep ? (
        <div className="mt-6 rounded-xl border-2 border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="font-bold">No seller profile found for this browser</p>
          <Link href="/karakata/sell" className="mt-3 inline-block rounded-lg bg-emerald-500 px-5 py-2 text-sm font-bold text-slate-950">Register your storefront first</Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold text-slate-500">LIVE LISTINGS</p><p className="mt-1 text-3xl font-bold">{rep.listings.length}</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold text-slate-500">UNITS IN STOCK</p><p className="mt-1 text-3xl font-bold">{rep.inventory.reduce((a: number, r: any) => a + (Number(r.stock_qty) || 0), 0)}</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold text-slate-500">STOCK ALERTS</p><p className={"mt-1 text-3xl font-bold " + (rep.stockouts.length ? "text-rose-600" : "text-emerald-600")}>{rep.stockouts.length}</p></div>
          <div className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs font-bold text-slate-500">FUNDING TIER</p><p className={"mt-1 text-xl font-bold " + (rep.score && rep.score.tier === "Fund-ready" ? "text-emerald-600" : rep.score && rep.score.tier === "Emerging" ? "text-amber-600" : "text-slate-600")}>{rep.score ? rep.score.tier : "Watchlist"}</p></div>
        </div>
      )}
      {rep && rep.score && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <p className="font-bold">Aje scores (0-100):</p>
          <p className="mt-1 text-slate-600">Velocity {String(rep.score.velocity_score)} · Reliability {String(rep.score.reliability_score)} · Growth {String(rep.score.growth_score)}</p>
          <p className="mt-2 text-xs text-slate-500">Fund-ready sellers receive OPTIONAL expansion-capital introductions (FounderPilot capital or vetted lending / VC / angel partners). Declining never affects your storefront.</p>
        </div>
      )}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <p className="font-bold">Your data consent (optional - tick what you allow)</p>
        <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={cInv} onChange={(e) => setCInv(e.target.checked)} /> Share inventory & sales data so Aje can compute my business intelligence</label>
        <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={cBi} onChange={(e) => setCBi(e.target.checked)} /> Send me free monthly BI reports & profit optimisation tips</label>
        <label className="mt-2 flex items-center gap-2 text-sm"><input type="checkbox" checked={cFun} onChange={(e) => setCFun(e.target.checked)} /> Consider me for OPTIONAL expansion-funding offers when I qualify</label>
        <button onClick={saveConsent} className="mt-4 rounded-lg bg-slate-900 px-5 py-2 text-sm font-bold text-white hover:bg-slate-700">Save My Consent</button>
      </div>
    </main>
  );
}
