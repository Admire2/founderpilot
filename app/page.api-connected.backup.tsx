"use client";

import { useState } from "react";

type IdeaInput = {
  idea: string;
  industry: string;
  targetCustomer: string;
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
  businessModel: "SaaS",
  budget: "",
  experienceLevel: "First-time founder",
};

function generateMockReport(input: IdeaInput): ValidationReport {
  return {
    ideaScore: 74,
    summary: `Mock validation completed for: "${input.idea.slice(
      0,
      100
    )}". This idea shows potential, but the target customer and monetization model need sharper definition before building a full product.`,

    strengths: [
      "Clear problem-solving angle.",
      "Can be tested with a lightweight MVP.",
      "Potential demand from founders or small businesses.",
      "Can be expanded into a broader AI tool suite.",
    ],

    weaknesses: [
      "Target niche may be too broad.",
      "Differentiation is not fully clear yet.",
      "Willingness to pay must be validated.",
      "Distribution strategy needs planning.",
    ],

    opportunities: [
      "Build a focused landing page to capture demand.",
      "Create a paid pilot offer for early users.",
      "Bundle with other founder tools later.",
      "Use content marketing around startup validation.",
    ],

    threats: [
      "Existing AI startup tools may already serve this need.",
      "Users may expect free AI tools.",
      "Retention may be low if the tool gives only one-time value.",
      "AI output quality must be consistently useful.",
    ],

    marketDemand:
      "Demand appears plausible because entrepreneurs constantly seek faster ways to test ideas, reduce risk, and create go-to-market plans. However, demand should be validated through landing page signups, interviews, or pre-sales.",

    competition:
      "Competition includes AI startup idea generators, business plan tools, startup consultants, and general AI assistants. The best angle is to specialize in practical validation with clear next steps.",

    targetCustomerInsights:
      "The most likely early users are solo founders, first-time entrepreneurs, indie hackers, consultants, and small business owners who need fast clarity before spending time or money on product development.",

    monetizationSuggestions: [
      "Free basic validation with paid detailed report.",
      "Monthly subscription for unlimited idea testing.",
      "One-time payment for premium validation report.",
      "Team plan for startup studios and accelerators.",
      "Bundle with pitch deck and business model tools.",
    ],

    validationSteps: [
      "Create a landing page explaining the tool.",
      "Run ads or posts targeting entrepreneurs.",
      "Collect emails from interested users.",
      "Interview 10 founders about their idea validation process.",
      "Offer a manual paid validation service before building automation.",
      "Test willingness to pay with a simple pricing page.",
      "Build a waitlist and measure conversion rate.",
      "Launch a minimal version to 20 early users.",
      "Collect feedback and refine the report structure.",
    ],

    mvpRecommendation:
      "Build a simple web app where the user enters an idea and receives a structured validation report. Avoid adding accounts, payments, or advanced dashboards until the core report proves valuable.",

    finalVerdict:
      "Promising idea, but success depends on niche focus, report quality, and clear user willingness to pay. Validate demand before building advanced features.",
  };
}

export default function Home() {
  const [form, setForm] = useState<IdeaInput>(initialForm);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [error, setError] = useState("");

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

    await new Promise((resolve) => setTimeout(resolve, 700));

    const mockReport = generateMockReport(form);

    setReport(mockReport);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-12">
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

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-xl"
        >
          <div className="grid gap-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">
                Startup Idea
              </label>

              <textarea
                required
                value={form.idea}
                onChange={(event) => updateField("idea", event.target.value)}
                placeholder="Example: An AI tool that helps entrepreneurs validate startup ideas and generate business plans."
                className="min-h-[8rem] w-full rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
              />
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Industry
                </label>

                <input
                  value={form.industry}
                  onChange={(event) =>
                    updateField("industry", event.target.value)
                  }
                  placeholder="Example: SaaS, fintech, education"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Target Customer
                </label>

                <input
                  value={form.targetCustomer}
                  onChange={(event) =>
                    updateField("targetCustomer", event.target.value)
                  }
                  placeholder="Example: Solo founders, small agencies"
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Business Model
                </label>

                <select
                  value={form.businessModel}
                  onChange={(event) =>
                    updateField("businessModel", event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-white outline-none focus:border-cyan-400"
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

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Founder Budget
                </label>

                <select
                  value={form.budget}
                  onChange={(event) => updateField("budget", event.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-white outline-none focus:border-cyan-400"
                >
                  <option value="">Select budget</option>
                  <option>$0 - $500</option>
                  <option>$500 - $2,500</option>
                  <option>$2,500 - $10,000</option>
                  <option>$10,000+</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-200">
                  Founder Experience Level
                </label>

                <select
                  value={form.experienceLevel}
                  onChange={(event) =>
                    updateField("experienceLevel", event.target.value)
                  }
                  className="w-full rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-white outline-none focus:border-cyan-400"
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
              {loading ? "Validating..." : "Validate Idea"}
            </button>

            {error && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
                {error}
              </div>
            )}
          </div>
        </form>

        {report && (
          <section className="mt-10 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-start justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-semibold">
                    Validation Report
                  </h2>

                  <p className="mt-3 text-slate-300">{report.summary}</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-5 py-4 text-center">
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

            <div className="grid gap-6 md:grid-cols-2">
              <ReportCard title="Strengths" items={report.strengths} />
              <ReportCard title="Weaknesses" items={report.weaknesses} />
              <ReportCard title="Opportunities" items={report.opportunities} />
              <ReportCard title="Threats" items={report.threats} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
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
              <h3 className="text-lg font-semibold text-cyan-300">
                Final Verdict
              </h3>

              <p className="mt-3 text-slate-200">{report.finalVerdict}</p>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function ReportCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h3 className="text-lg font-semibold">{title}</h3>

      <ul className="mt-4 space-y-3">
        {items.length ? (
          items.map((item, index) => (
            <li
              key={index}
              className="flex items-start gap-3 text-sm text-slate-300"
            >
              <span className="mt-1 h-2 w-2 rounded-full bg-cyan-400" />
              {item}
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
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <h3 className="text-lg font-semibold">{title}</h3>

      <p className="mt-4 text-sm leading-7 text-slate-300">
        {content || "No data available."}
      </p>
    </div>
  );
}
