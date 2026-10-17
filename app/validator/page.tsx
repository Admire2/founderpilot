"use client";

import { useState } from "react";
import PaywallGate from "@/components/PaywallGate";
import { useUsage } from "@/lib/usage";
import { saveReport, HistoryEntry } from "@/lib/history";
import HistoryPanel from "@/components/HistoryPanel";

type IdeaInput = {
  idea: string;
  industry: string;
  targetCustomer: string;
  market: string;
  businessModel: string;
  budget: string;
  experienceLevel: string;
};

type ValidationReport = {
  ideaScore: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  marketDemand: string;
  competition: string;
  targetCustomerInsights: string;
  monetizationSuggestions: string[];
  validationSteps: string[];
  mvpRecommendation: string;
  finalVerdict: string;
};

const initialForm: IdeaInput = {
  idea: "",
  industry: "",
  targetCustomer: "",
  market: "",
  businessModel: "SaaS",
  budget: "",
  experienceLevel: "First-time founder",
};

const inputClass =
  "w-full max-w-full box-border rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400";

export default function ValidatorPage() {
  const [form, setForm] = useState<IdeaInput>(initialForm);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const { remaining, locked, isPro, loading: usageLoading, recordUsage } = useUsage("validator");

  function updateField(field: keyof IdeaInput, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (form.idea.trim().length < 10) {
      setError("Please enter a startup idea with at least 10 characters.");
      return;
    }

    setLoading(true);
    setError("");
    setReport(null);

    try {
      const response = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.details || "Request failed.");
      }

      setReport(data);

      saveReport("validator", form.idea.trim().slice(0, 80), data);
      if (!isPro) { await recordUsage(); }
      setRefreshKey((key) => key + 1);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function handleSelect(entry: HistoryEntry) {
    setReport(entry.report as ValidationReport);
  }

  return (
    <main className="w-full min-w-0 p-6 md:p-10">
      <div className="mx-auto max-w-4xl min-w-0">
        <header className="mb-10">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">
            FounderPilot AI
          </p>

          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Idea Validator AI
          </h1>

          <p className="mt-3 max-w-2xl text-slate-300">
            Enter your startup idea and get a practical validation report with
            market insights, risks, monetization options, and next steps.
          </p>
        </header>

        {!locked && (isPro ? <p className="mb-6 text-center text-sm font-medium text-cyan-400">Pro plan active - unlimited reports on all tools.</p> : <p className="mb-6 text-center text-sm text-slate-400">You have <strong className="text-cyan-400">{remaining}</strong> free reports left on this tool.</p>)}

        {locked ? <PaywallGate toolName="Idea Validator" /> : (<form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 md:p-8 shadow-xl overflow-hidden"
        >
          <div className="grid gap-6 min-w-0">
            <div className="min-w-0">
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Startup Idea
              </label>

              <textarea
                required
                value={form.idea}
                onChange={(event) => updateField("idea", event.target.value)}
                placeholder="Example: An AI tool that helps entrepreneurs validate startup ideas and generate business plans."
                className={`${inputClass} min-h-[8rem] resize-none`}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2 min-w-0">
              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Industry
                </label>

                <input
                  value={form.industry}
                  onChange={(event) => updateField("industry", event.target.value)}
                  placeholder="Example: SaaS, fintech, education"
                  className={inputClass}
                />
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Target Customer
                </label>

                <input
                  value={form.targetCustomer}
                  onChange={(event) =>
                    updateField("targetCustomer", event.target.value)
                  }
                  placeholder="Example: Solo founders, small agencies"
                  className={inputClass}
                />
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Target Market (optional)
                </label>

                <input
                  value={form.market}
                  onChange={(event) => updateField("market", event.target.value)}
                  placeholder="Type any city, country, region, or continent"
                  list="market-suggestions"
                  className={inputClass}
                />

                <datalist id="market-suggestions">
                  <option value="United States" />
                  <option value="New York" />
                  <option value="Los Angeles" />
                  <option value="Chicago" />
                  <option value="Houston" />
                  <option value="Miami" />
                  <option value="San Francisco" />
                  <option value="Dallas" />
                  <option value="Atlanta" />
                  <option value="Seattle" />
                  <option value="Nigeria" />
                  <option value="Lagos" />
                  <option value="West Africa" />
                  <option value="East Africa" />
                  <option value="North Africa" />
                  <option value="South Africa" />
                  <option value="Southern Africa" />
                  <option value="Africa" />
                  <option value="Europe" />
                  <option value="Asia" />
                  <option value="Global" />
                </datalist>
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Business Model
                </label>

                <select
                  value={form.businessModel}
                  onChange={(event) =>
                    updateField("businessModel", event.target.value)
                  }
                  className={inputClass}
                >
                  <option>SaaS</option>
                  <option>Agency</option>
                  <option>Ecommerce</option>
                  <option>Marketplace</option>
                  <option>Mobile App</option>
                  <option>Community</option>
                  <option>Consulting</option>
                  <option>Info Product</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Founder Budget
                </label>

                <select
                  value={form.budget}
                  onChange={(event) => updateField("budget", event.target.value)}
                  className={inputClass}
                >
                  <option value="">Select budget</option>
                  <option>$0 - $500</option>
                  <option>$500 - $2,500</option>
                  <option>$2,500 - $10,000</option>
                  <option>$10,000+</option>
                </select>
              </div>

              <div className="min-w-0">
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Founder Experience Level
                </label>

                <select
                  value={form.experienceLevel}
                  onChange={(event) =>
                    updateField("experienceLevel", event.target.value)
                  }
                  className={inputClass}
                >
                  <option>First-time founder</option>
                  <option>Side project builder</option>
                  <option>Experienced founder</option>
                  <option>Agency owner</option>
                  <option>Corporate entrepreneur</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-xl bg-cyan-500 px-6 py-4 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Validating..." : "Validate Idea & Generate Report"}
            </button>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                {error}
              </div>
            )}
          </div>
        </form>)}

        <div className="mt-8">
          <HistoryPanel
            tool="validator"
            refreshKey={refreshKey}
            onSelect={handleSelect}
          />
        </div>

        {report && (
          <section className="mt-10 space-y-6 min-w-0">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 overflow-hidden">
              <div className="flex items-start justify-between gap-6">
                <div className="min-w-0">
                  <h2 className="text-2xl font-semibold">Validation Report</h2>
                  <p className="mt-3 text-slate-300">{report.summary}</p>
                </div>

                <div className="shrink-0 rounded-2xl border border-white/10 bg-slate-900/70 px-5 py-4 text-center">
                  <div className="text-xs uppercase tracking-wide text-slate-400">
                    Idea Score
                  </div>

                  <div
                    className={`mt-1 text-3xl font-bold ${
                      report.ideaScore >= 70
                        ? "text-emerald-400"
                        : report.ideaScore >= 50
                          ? "text-amber-400"
                          : "text-red-400"
                    }`}
                  >
                    {report.ideaScore}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 min-w-0">
              <ReportCard title="Strengths" items={report.strengths} />
              <ReportCard title="Weaknesses" items={report.weaknesses} />
              <ReportCard title="Opportunities" items={report.opportunities} />
              <ReportCard title="Threats" items={report.threats} />
            </div>

            <div className="grid gap-6 md:grid-cols-2 min-w-0">
              <TextCard title="Market Demand" content={report.marketDemand} />
              <TextCard title="Competition" content={report.competition} />
            </div>

            <TextCard
              title="Target Customer Insights"
              content={report.targetCustomerInsights}
            />

            <ReportCard
              title="Monetization Suggestions"
              items={report.monetizationSuggestions}
            />

            <ReportCard title="Validation Steps" items={report.validationSteps} />

            <TextCard
              title="MVP Recommendation"
              content={report.mvpRecommendation}
            />

            <div className="rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6">
              <h3 className="text-lg font-semibold text-cyan-300">Final Verdict</h3>
              <p className="mt-3 text-slate-200">{report.finalVerdict}</p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function ReportCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 min-w-0 overflow-hidden">
      <h3 className="text-lg font-semibold">{title}</h3>

      <ul className="mt-4 space-y-3">
        {items.length ? (
          items.map((item, index) => (
            <li key={index} className="flex items-start gap-3 text-sm text-slate-300">
              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
              <span className="min-w-0">{item}</span>
            </li>
          ))
        ) : (
          <li className="text-sm text-slate-500">No data available.</li>
        )}
      </ul>
    </div>
  );
}

function TextCard({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 min-w-0 overflow-hidden">
      <h3 className="text-lg font-semibold">{title}</h3>

      <p className="mt-4 text-sm leading-7 text-slate-300">
        {content || "No data available."}
      </p>
    </div>
  );
}
