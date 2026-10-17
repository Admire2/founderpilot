"use client";
import { useState } from "react";
import Link from "next/link";

export default function SellCar() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<any>(null);

  const submit = async (e: any) => {
    e.preventDefault();
    setBusy(true);
    setResult(null);
    const fd = new FormData(e.currentTarget);
    const body = {
      year: fd.get("year"),
      make: fd.get("make"),
      model: fd.get("model"),
      vin: fd.get("vin"),
      price_usd: fd.get("price_usd"),
      condition: fd.get("condition")
    };
    try {
      const r = await fetch("/api/karakata/autos/manual-entry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      setResult(j);
    } catch (err) {
      setResult({ ok: false, error: String(err) });
    }
    setBusy(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-2xl">
        <Link href="/karakata" className="text-sm text-emerald-400 hover:underline">← Back to market</Link>
        <h1 className="mt-4 text-3xl font-bold text-emerald-400">🚗 Sell Your Car (CarMax-style)</h1>
        <p className="mt-2 text-slate-400">Enter the details from your insurance card or registration. We generate a professional photo and your listing goes live instantly — escrow-protected.</p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input name="year" type="number" required placeholder="Year (e.g. 2018)" className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none focus:border-emerald-500" />
            <input name="make" type="text" required placeholder="Make (e.g. Toyota)" className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none focus:border-emerald-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input name="model" type="text" required placeholder="Model (e.g. Camry)" className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none focus:border-emerald-500" />
            <select name="condition" className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none focus:border-emerald-500">
              <option value="fairly_used">Fairly used</option>
              <option value="new">Brand new</option>
            </select>
          </div>
          <input name="vin" type="text" required maxLength={17} placeholder="VIN - 17 characters from your insurance card" className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 font-mono text-white outline-none focus:border-emerald-500" />
          <input name="price_usd" type="number" required placeholder="Asking price (USD)" className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-white outline-none focus:border-emerald-500" />
          <button type="submit" disabled={busy} className="w-full rounded-lg bg-emerald-600 py-4 font-bold hover:bg-emerald-500 disabled:bg-slate-700">
            {busy ? "🔄 Creating your listing..." : "🚗 List My Car Now"}
          </button>
        </form>

        {result && result.ok && (
          <div className="mt-6 rounded-lg border border-emerald-500 bg-emerald-900/30 p-4">
            <p className="font-bold text-emerald-400">✅ {result.message}</p>
            <p className="mt-2 text-sm text-slate-400">
              Listing ID: {result.listing?.id} ·{" "}
              <Link href={"/karakata/p/" + result.listing?.id} className="text-emerald-400 underline">View your car on the market →</Link>
            </p>
          </div>
        )}
        {result && !result.ok && (
          <div className="mt-6 rounded-lg border border-red-500 bg-red-900/30 p-4">
            <p className="font-bold text-red-400">❌ {result.error}</p>
          </div>
        )}
      </div>
    </main>
  );
}