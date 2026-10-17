"use client";

import { useState } from "react";
import PaywallGate from "@/components/PaywallGate";
import { useUsage } from "@/lib/usage";
import { saveReport, HistoryEntry } from "@/lib/history";
import HistoryPanel from "@/components/HistoryPanel";

type PersonaReport = {
  personaName: string;
  summary: string;
  demographics: string;
  psychographics: string;
  painPoints: string[];
  goals: string[];
  buyingTriggers: string[];
  objections: string[];
  marketingChannels: string[];
};

export default function PersonaPage() {
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [market, setMarket] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<PersonaReport | null>(null);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const { remaining, locked, isPro, loading: usageLoading, recordUsage } = useUsage("persona");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (productName.trim().length < 2 || description.trim().length < 10) {
      setError("Please provide a product name and description.");
      return;
    }
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const res = await fetch("/api/persona", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, description, market }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setReport(data);
      if (!isPro) { await recordUsage(); }
      saveReport("persona", productName.trim().slice(0, 80), data);
      setRefreshKey((k) => k + 1);
      recordUsage();
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(entry: HistoryEntry) {
    setReport(entry.report as PersonaReport);
  }

  const inputClass = "w-full max-w-full box-border rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400";

  return (
    <main className="w-full min-w-0 p-6 md:p-10">
      <div className="mx-auto max-w-4xl min-w-0">
        <header className="mb-10">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">FounderPilot AI</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Customer Persona</h1>
          <p className="mt-3 max-w-2xl text-slate-300">Discover exactly who will buy your product, what frustrates them, and how to reach them.</p>
        </header>

        {!locked && (isPro ? <p className="mb-6 text-center text-sm font-medium text-cyan-400">Pro plan active - unlimited reports on all tools.</p> : <p className="mb-6 text-center text-sm text-slate-400">You have <strong className="text-cyan-400">{remaining}</strong> free reports left on this tool.</p>)}

        {locked ? <PaywallGate toolName="Customer Persona" /> : (<form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 shadow-xl overflow-hidden">
          <div className="grid gap-6 min-w-0">
            <div className="grid gap-6 md:grid-cols-2 min-w-0">
              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-slate-200">Product Name</label>
                <input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="Example: TractorNow"
                  className={inputClass}
                />
              </div>
              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-slate-200">Target Market (optional)</label>
                <input
                  value={market}
                  onChange={(e) => setMarket(e.target.value)}
                  placeholder="Type any city, country, or region"
                  list="persona-market-suggestions"
                  className={inputClass}
                />
                <datalist id="persona-market-suggestions">
                  <option value="United States" />
                  <option value="New York" />
                  <option value="Los Angeles" />
                  <option value="Nigeria" />
                  <option value="Africa" />
                  <option value="Global" />
                </datalist>
              </div>
            </div>
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium text-slate-200">What Does It Do?</label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Example: A platform where farmers request tractor services..."
                className={`${inputClass} min-h-[6rem] resize-none`}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-xl bg-cyan-500 px-6 py-4 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Generating..." : "Generate Persona"}
            </button>
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>
            )}
          </div>
        </form>)}

        <div className="mt-8">
          <HistoryPanel tool="persona" refreshKey={refreshKey} onSelect={handleSelect} />
        </div>

        {report && (
          <section className="mt-10 space-y-6 min-w-0">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 overflow-hidden">
              <h2 className="text-2xl font-semibold mb-3">Meet {report.personaName}</h2>
              <p className="text-slate-300">{report.summary}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 min-w-0">
              <TextCard title="Demographics" content={report.demographics} />
              <TextCard title="Psychographics" content={report.psychographics} />
            </div>

            <div className="grid gap-6 md:grid-cols-2 min-w-0">
              <ListCard title="Pain Points" items={report.painPoints} />
              <ListCard title="Goals & Desires" items={report.goals} />
              <ListCard title="Buying Triggers" items={report.buyingTriggers} />
              <ListCard title="Objections (Why they won't buy)" items={report.objections} />
            </div>

            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6">
              <h3 className="text-lg font-semibold text-cyan-300">Best Marketing Channels</h3>
              <ul className="mt-4 space-y-2">
                {report.marketingChannels.map((channel, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-slate-200">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                    {channel}
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function TextCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 min-w-0 overflow-hidden">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <p className="text-sm leading-7 text-slate-300">{content || "No data available."}</p>
    </div>
  );
}

function ListCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 min-w-0 overflow-hidden">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
