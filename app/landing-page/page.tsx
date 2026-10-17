"use client";

import { useState } from "react";
import PaywallGate from "@/components/PaywallGate";
import { useUsage } from "@/lib/usage";
import { saveReport, HistoryEntry } from "@/lib/history";
import HistoryPanel from "@/components/HistoryPanel";

type LandingReport = {
  headline: string;
  subheadline: string;
  heroCta: string;
  valueProposition: string;
  benefits: string[];
  howItWorks: string[];
  socialProof: string;
  faqs: string[];
  finalCta: string;
  seoTitle: string;
  seoDescription: string;
};

export default function LandingPageTool() {
  const [productName, setProductName] = useState("");
  const [description, setDescription] = useState("");
  const [targetCustomer, setTargetCustomer] = useState("");
  const [tone, setTone] = useState("Professional");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState<LandingReport | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { remaining, locked, isPro, loading: usageLoading, recordUsage } = useUsage("landing");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (productName.trim().length < 2 || description.trim().length < 10) {
      setError("Please add a product name and description.");
      return;
    }
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const response = await fetch("/api/landing-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productName, description, targetCustomer, tone }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed.");
      setReport(data);
      if (!isPro) { await recordUsage(); }
      saveReport("landing", productName.trim().slice(0, 80), data);
      setRefreshKey((k) => k + 1);
      recordUsage();
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(entry: HistoryEntry) {
    setReport(entry.report as LandingReport);
  }

  const inputClass = "w-full max-w-full box-border rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400";

  return (
    <main className="w-full min-w-0 p-6 md:p-10">
      <div className="mx-auto max-w-4xl min-w-0">
        <header className="mb-10">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">FounderPilot AI</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Landing Page Copy</h1>
          <p className="mt-3 max-w-2xl text-slate-300">Generate high-converting headlines, benefits, FAQs, and SEO metadata.</p>
        </header>

        {!locked && (isPro ? <p className="mb-6 text-center text-sm font-medium text-cyan-400">Pro plan active - unlimited reports on all tools.</p> : <p className="mb-6 text-center text-sm text-slate-400">You have <strong className="text-cyan-400">{remaining}</strong> free reports left on this tool.</p>)}

        {locked ? <PaywallGate toolName="Landing Page Copy Generator" /> : (<form onSubmit={handleSubmit} className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 shadow-xl overflow-hidden">
          <div className="grid gap-6 min-w-0">
            <div className="grid gap-6 md:grid-cols-2 min-w-0">
              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-slate-200">Product Name</label>
                <input
                  value={productName}
                  onChange={(event) => setProductName(event.target.value)}
                  placeholder="Example: TractorNow"
                  className={inputClass}
                />
              </div>
              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-slate-200">Target Customer</label>
                <input
                  value={targetCustomer}
                  onChange={(event) => setTargetCustomer(event.target.value)}
                  placeholder="Example: small-scale farmers"
                  className={inputClass}
                />
              </div>
            </div>
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium text-slate-200">What Does It Do?</label>
              <textarea
                required
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Example: A platform where farmers request tractor services..."
                className={`${inputClass} min-h-[6rem] resize-none`}
              />
            </div>
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium text-slate-200">Tone</label>
              <select
                value={tone}
                onChange={(event) => setTone(event.target.value)}
                className={inputClass}
              >
                <option>Professional</option>
                <option>Friendly</option>
                <option>Bold</option>
                <option>Playful</option>
              </select>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-xl bg-cyan-500 px-6 py-4 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Writing copy..." : "Generate Landing Page Copy"}
            </button>
            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div>
            )}
          </div>
        </form>)}

        <div className="mt-8">
          <HistoryPanel tool="landing" refreshKey={refreshKey} onSelect={handleSelect} />
        </div>

        {report && (
          <section className="mt-10 space-y-6 min-w-0">
            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-8 text-center">
              <h2 className="text-3xl font-bold">{report.headline}</h2>
              <p className="mt-4 text-slate-200">{report.subheadline}</p>
              <div className="mt-6 inline-block rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950">
                {report.heroCta}
              </div>
            </div>

            <TextCard title="Value Proposition" content={report.valueProposition} />

            <div className="grid gap-6 md:grid-cols-2 min-w-0">
              <ListCard title="Benefits" items={report.benefits} />
              <ListCard title="How It Works" items={report.howItWorks} />
            </div>

            <TextCard title="Social Proof" content={report.socialProof} />
            <ListCard title="FAQs" items={report.faqs} />

            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6 text-center">
              <p className="text-lg font-semibold text-cyan-200">{report.finalCta}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-lg font-semibold">SEO Metadata</h3>
              <p className="mt-3 text-sm font-medium text-cyan-300">{report.seoTitle}</p>
              <p className="mt-2 text-sm text-slate-300">{report.seoDescription}</p>
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
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3 text-sm text-slate-300">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-400" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
