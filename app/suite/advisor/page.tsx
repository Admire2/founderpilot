"use client";
import WalletBar from "@/components/WalletBar";
import { useEffect, useState } from "react";
import Link from "next/link";

const tagColor: any = { COST: "text-emerald-300 border-emerald-500/30 bg-emerald-500/10", REVENUE: "text-cyan-300 border-cyan-500/30 bg-cyan-500/10", GROWTH: "text-purple-300 border-purple-500/30 bg-purple-500/10", QUALITY: "text-yellow-300 border-yellow-500/30 bg-yellow-500/10" };

export default function AdvisorPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => { fetch("/api/advisor").then((r) => r.json()).then(setData); }, []);

  if (!data) return <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
      <WalletBar />
<p>Cleo is reading your company data...</p></main>;

  const m = data.metrics;
  const stats = [
    ["Leads captured", m.leads], ["Wallets activated", m.wallets], ["Documents sent", m.docs],
    ["Contracts executed", m.signed], ["Waitlist demand", m.waitlist], ["Vault files", m.storage],
  ];

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/suite" className="text-cyan-400 hover:underline mb-6 inline-block">&larr; Back to Suite</Link>
        <h1 className="text-3xl font-bold mb-2">🧠 Cleo — AI COO Advisor</h1>
        <p className="text-slate-400 mb-8">Automatic weekly-style review of every product: how to serve cheaper, better, and earn more. Each visit logs a review to your history.</p>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {stats.map(([label, val]) => (
            <div key={label as string} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-2xl font-bold text-cyan-300">{val as number}</p>
              <p className="text-xs text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        <h2 className="text-xl font-bold mb-4">This week's recommendations</h2>
        <div className="space-y-4 mb-8">
          {data.recs.map((r: any, i: number) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className={"text-[10px] font-bold px-2 py-1 rounded-full border " + (tagColor[r.tag] || "")}>{r.tag}</span>
                <h3 className="font-bold">{r.title}</h3>
              </div>
              <p className="text-sm text-slate-300">{r.detail}</p>
            </div>
          ))}
        </div>

        {data.note && (
          <>
            <h2 className="text-xl font-bold mb-4">Cleo's memo (external AI)</h2>
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/5 p-6 whitespace-pre-wrap text-sm text-slate-200">{data.note}</div>
          </>
        )}
      </div>
    </main>
  );
}
