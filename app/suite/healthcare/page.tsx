import Link from "next/link";
import KaraKataAuthBar from "@/components/KaraKataAuthBar";
const SERVICES = [
  { name: "Procedure Explainer", href: "/suite/ilera/procedures", cr: "10 cr", desc: "Paste any procedure name — get cost ranges, insurance rules, risks, prep steps and 5 questions for your doctor. Know what you are walking into.", tags: ["MRI", "CT", "Colonoscopy", "Capsule Endoscopy"] },
  { name: "iLera - AI Healthcare Companion", href: "/suite/ilera", cr: "10 cr", desc: "Symptom story + vitals + prior care: safety check, patterns, bloodwork to request, Prevention Radar, doctor questions.", tags: ["Symptoms", "Vitals", "Pre-Visit Read"] },
  { name: "Lab Reader", href: "/suite/ilera/labs", cr: "10 cr", desc: "Paste any bloodwork - plain-English flags, ranges used, and what is missing from the 7-Panel.", tags: ["7-Panel", "Ranges", "Flags"] },
  { name: "Shadow Annual Physical", href: "/suite/ilera/physical", cr: "10 cr", desc: "Free reference table + photo/text deep-read of your lab report. Maps values to Too Low → Too High bands.", tags: ["Photo Read", "Bands", "Lead Magnet"] },
  { name: "Health Risk Radar", href: "/suite/ilera/risk", cr: "15 cr", desc: "Age, family history, lifestyle - your risk map and personal screening calendar.", tags: ["Risk Map", "Screening Calendar"] },
  { name: "Meds & Supplement Checker", href: "/suite/ilera/meds", cr: "5 cr", desc: "Interaction severity, kidney/liver load, timing notes - discuss-with-clinician framing.", tags: ["Interactions", "Safety"] },
  { name: "Referral Pack Compiler", href: "/suite/ilera/pack", cr: "10 cr", desc: "One-page clinician-ready summary of everything - print or send ahead of the visit.", tags: ["Print-Ready", "Clinician Summary"] },
  { name: "7-Panel Deep Read (Men & Women)", href: "/suite/ilera/panels", cr: "10 cr", desc: "Gender-specific blood panel that catches disease now and predicts it later - free tables + personalized ranking + doctor request script.", tags: ["Mens 7", "Womens 7", "Request Script"] },  { name: "iLera Foresight (20-Year Trajectories)", href: "/suite/ilera/foresight", cr: "20 cr", desc: "Delphi-style 20-year chronic-disease trajectory map from your story - curve benders, missing signals, screening tie-in.", tags: ["20-Year Map", "Curve Benders", "Prevention"] },  { name: "Ounje - AI Nutrition Companion", href: "/suite/ounje", cr: "10 cr", desc: "Condition-linked food tables, day plans, recipes, and grocery lists. Budget-aware and culturally flexible.", tags: ["Meal Plans", "Recipes", "Interactions"] }
];
export default function HealthcareSuite() {
  return (
    <div className="flex justify-end p-4 bg-slate-900 border-b border-slate-800"><KaraKataAuthBar /></div>
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <Link href="/suite" className="text-cyan-400 hover:underline text-sm">← Back to Suite</Link>
      <h1 className="mt-3 text-4xl font-bold">🩺 Healthcare Suite</h1>
      <p className="mt-1 text-sm text-slate-400">Your AI healthcare department. Ten specialist services collaborating as equals - educational screening that prepares you for the doctor, never replaces one.</p>
      <div className="mt-4 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-[11px] font-bold text-rose-200">⚕️ iLera & Ounje provide educational screening and nutrition guidance, not medical treatment. 18+ only. Emergency symptoms? Call 911.</div>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SERVICES.map((s) => (
          <div key={s.name} className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-5">
            <div className="flex items-center justify-between">
              <p className="font-bold text-rose-200">{s.name}</p>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">{s.cr}</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">{s.desc}</p>
            <div className="mt-3 flex flex-wrap gap-2">{s.tags.map((t) => (<span key={t} className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">{t}</span>))}</div>
            <Link href={s.href} className="mt-4 block rounded-lg bg-rose-500 px-4 py-2.5 text-center text-xs font-bold text-slate-950 hover:bg-rose-400">Open Service</Link>
          </div>
        ))}
      </div>
      <div className="mt-8 text-center"><Link href="/why-ilera" className="inline-block rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-6 py-3 text-sm font-bold text-cyan-200 hover:bg-cyan-500/20">📖 Why iLera — Complete Value Map →</Link></div><div className="mt-8">
        <p className="text-lg font-bold text-cyan-300">Why iLera wins</p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-bold text-slate-300">Function Health</p><p className="mt-1 text-sm font-bold text-rose-300">$365/yr</p><p className="text-[11px] text-slate-400">Sells you the labs. iLera reads the labs you already own.</p></div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-bold text-slate-300">Marek Health</p><p className="mt-1 text-sm font-bold text-rose-300">$450+ panels</p><p className="text-[11px] text-slate-400">Blind panels. iLera names the 7 tests worth requesting first.</p></div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xs font-bold text-slate-300">K Health / Doctronic</p><p className="mt-1 text-sm font-bold text-rose-300">$19-49/visit</p><p className="text-[11px] text-slate-400">Replace the doctor. iLera makes your 15 min with them worth 60.</p></div>
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4"><p className="text-xs font-bold text-rose-200">iLera + Ounje</p><p className="mt-1 text-sm font-bold text-emerald-300">~$0.67/insight</p><p className="text-[11px] text-slate-300">We don't sell tests. We sell clarity, plus the meal plan to fix it.</p></div>
        </div>
      </div>
    </main>
  );
}
