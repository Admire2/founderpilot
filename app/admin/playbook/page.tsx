import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

const STEPS = [
  { n: 1, t: "Demand Map", d: "What clients design & order (Maxi analytics). Factory lines follow demand, never guesses." },
  { n: 2, t: "Vendor Shortlist", d: "FP-SCF vendors per category with certs, turnaround, MOQ — pre-vetted." },
  { n: 3, t: "Eligible Workforce", d: "Designers & techs with eligibility scores = first hire/contract pool." },
  { n: 4, t: "SOP Library", d: "Maxi sheets & PDFs = standard work for every product family." },
  { n: 5, t: "Compliance Pack", d: "Certification partners (CE/FCC/ISO/IPC) pre-negotiated." },
  { n: 6, t: "Site & Capital", d: "Location, lines, machines — sized by steps 1-5 data." },
];

export default async function Page() {
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  const { data } = await sb.from("maxi_partners").select("category, role, eligibility, status");
  const rows = data || [];
  const vendors = rows.filter((r: any) => (r.role || "vendor") === "vendor").length;
  const workforce = rows.filter((r: any) => r.role === "designer" || r.role === "tech").length;
  const clients = rows.filter((r: any) => r.role === "client").length;
  const cats: any = {};
  rows.forEach((r: any) => { cats[r.category] = (cats[r.category] || 0) + 1; });
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold">🏗️ Factory-in-a-Box Playbook</h1>
        <p className="mt-2 text-sm text-slate-400">The FounderPilot modus operandi: every factory (drones, power, medical...) spins up by executing these 6 steps with live FP-SCF data.</p>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <div className="text-2xl font-bold text-emerald-300">{vendors}</div>
            <div className="text-[11px] text-slate-400">Vendors / Manufacturers</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <div className="text-2xl font-bold text-cyan-300">{workforce}</div>
            <div className="text-[11px] text-slate-400">Eligible Designers & Techs</div>
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-center">
            <div className="text-2xl font-bold text-amber-300">{clients}</div>
            <div className="text-[11px] text-slate-400">Client-Buyers (production slots)</div>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {STEPS.map((s) => (
            <div key={s.n} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl font-bold text-purple-400">{s.n}</div>
                <div className="font-bold">{s.t}</div>
              </div>
              <p className="mt-1 text-sm text-slate-400">{s.d}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border-2 border-emerald-400/40 bg-emerald-500/5 p-6">
          <h2 className="text-lg font-bold text-emerald-300">🚁 Example: opening the Drone Factory</h2>
          <ol className="mt-3 list-decimal pl-5 text-sm text-slate-300 space-y-1">
            <li>Demand Map shows drone designs = top category → line = SMT + flex + assembly.</li>
            <li>Pull FP-SCF vendors: PCB fab (flex), enclosures (carbon), battery packs.</li>
            <li>Hire/contract top-eligibility drone designers & RF techs from the pool.</li>
            <li>Load SOP Library: Maxi drone sheets = standard work.</li>
            <li>Activate Compliance Pack: CE/FCC + aviation regs partner.</li>
            <li>Site & capital sized by real order data → open in months, not years.</li>
          </ol>
          <p className="mt-3 text-xs text-slate-500">Repeat verbatim for Factory #2, #3, #N. That is the moat: the framework IS the company.</p>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="font-bold">Category coverage</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.keys(cats).length === 0 && <span className="text-xs text-slate-500">No members yet — enrollment open on Maxi Partners page.</span>}
            {Object.keys(cats).map((c) => (
              <span key={c} className="rounded-full border border-cyan-500/40 bg-cyan-500/20 px-3 py-1 text-xs font-bold text-cyan-200">{c} · {cats[c]}</span>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}