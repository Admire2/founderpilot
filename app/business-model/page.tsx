"use client";

import { useState } from "react";
import PaywallGate from "@/components/PaywallGate";
import { useUsage } from "@/lib/usage";
import { saveReport, HistoryEntry } from "@/lib/history";
import HistoryPanel from "@/components/HistoryPanel";

type BusinessModelReport = {
  summary: string;
  customerSegments: string;
  valueProposition: string;
  channels: string;
  customerRelationships: string;
  revenueStreams: string;
  keyResources: string;
  keyActivities: string;
  keyPartnerships: string;
  costStructure: string;
  pricingStrategy: string;
  unfairAdvantage: string;
};

export default function BusinessModelPage() {
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<BusinessModelReport | null>(null);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const { remaining, locked, isPro, loading: usageLoading, recordUsage } = useUsage("business");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (idea.trim().length < 5) {
      setError("Please describe your idea.");
      return;
    }
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const res = await fetch("/api/business-model", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setReport(data);
      if (!isPro) { await recordUsage(); }
      saveReport("business", idea.trim().slice(0, 80), data);
      setRefreshKey((k) => k + 1);
      recordUsage();
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(entry: HistoryEntry) {
    setReport(entry.report as BusinessModelReport);
  }

  const inputClass = "w-full max-w-full box-border rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400";

  return (
    <main className="w-full min-w-0 p-6 md:p-10">
      <div className="mx-auto max-w-4xl min-w-0">
        <header className="mb-10">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">FounderPilot AI</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Business Model Generator</h1>
          <p className="mt-3 max-w-2xl text-slate-300">Turn your idea into a structured Business Model Canvas with pricing, channels, and unfair advantages.</p>
        </header>

        {!locked && (isPro ? <p className="mb-6 text-center text-sm font-medium text-cyan-400">Pro plan active - unlimited reports on all tools.</p> : <p className="mb-6 text-center text-sm text-slate-400">You have <strong className="text-cyan-400">{remaining}</strong> free reports left on this tool.</p>)}

        {locked ? <PaywallGate toolName="Business Model Generator" /> : (<form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 shadow-xl overflow-hidden">
          <div className="grid gap-6 min-w-0">
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium text-slate-200">Your Idea</label>
              <textarea
                required
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="Example: AI homework helper for K-12 students"
                className={`${inputClass} min-h-[6rem] resize-none`}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-xl bg-cyan-500 px-6 py-4 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Generating..." : "Generate Business Model"}
            </button>
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>
            )}
          </div>
        </form>)}

        <div className="mt-8">
          <HistoryPanel tool="business" refreshKey={refreshKey} onSelect={handleSelect} />
        </div>

        {report && (
          <section className="mt-10 space-y-6 min-w-0">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 overflow-hidden">
              <h2 className="text-2xl font-semibold mb-3">Business Model Canvas</h2>
              <p className="text-slate-300">{report.summary}</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 min-w-0">
              <TextCard title="Customer Segments" content={report.customerSegments} />
              <TextCard title="Value Proposition" content={report.valueProposition} />
              <TextCard title="Channels" content={report.channels} />
              <TextCard title="Customer Relationships" content={report.customerRelationships} />
              <TextCard title="Revenue Streams" content={report.revenueStreams} />
              <TextCard title="Pricing Strategy" content={report.pricingStrategy} />
              <TextCard title="Key Resources" content={report.keyResources} />
              <TextCard title="Key Activities" content={report.keyActivities} />
              <TextCard title="Key Partnerships" content={report.keyPartnerships} />
              <TextCard title="Cost Structure" content={report.costStructure} />
            </div>

            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6">
              <h3 className="text-lg font-semibold text-cyan-300">Unfair Advantage</h3>
              <p className="mt-3 text-slate-200">{report.unfairAdvantage}</p>
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
