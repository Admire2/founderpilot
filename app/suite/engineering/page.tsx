"use client";
import Link from "next/link";
import KaraKataAuthBar from "@/components/KaraKataAuthBar";
import WalletBar from "@/components/WalletBar";

const SUITES = [
  { name: "maxi", title: "Maxi", role: "AI Electronics & Hardware Engineer", desc: "Maxi-styled copilot for PCB, components, power, RF and firmware.", tags: ["PCB", "Parts", "Power"] },
  { name: "volt", title: "Volt", role: "AI Electrical Power Engineer", desc: "Load calculations, cable sizing, panels, solar, earthing, code compliance.", tags: ["Loads", "Wiring", "Panels"] },
  { name: "rivet", title: "Rivet", role: "AI Mechanical Engineer", desc: "Mechanisms, tolerances, materials, CAD sanity checks, enclosures.", tags: ["CAD", "Materials", "Tolerances"] },
  { name: "terra", title: "Terra", role: "AI Civil & Structural Engineer", desc: "Beam sizing, footing estimates, concrete and steel takeoffs.", tags: ["Structures", "Takeoffs", "Foundations"] },
];

export default function EngineeringSuite() {
  return (
    <>
      <div className="flex justify-end p-4 bg-slate-900 border-b border-slate-800"><KaraKataAuthBar /></div>
      <main className="min-h-screen bg-slate-950 text-white p-8">
      <WalletBar />
      <div className="max-w-5xl mx-auto">
        <Link href="/suite" className="text-cyan-400 hover:underline text-sm">&larr; Back to Suite</Link>
        <h1 className="mt-4 text-3xl font-bold">🛠️ Engineering Suite</h1>
        <p className="mt-2 text-sm text-slate-400">Your AI engineering department. Four specialist engineers collaborating as equals.</p>
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {SUITES.map((s) => (
            <div key={s.name} className="rounded-2xl border-2 border-amber-400/60 bg-amber-500/5 p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">{s.title} - {s.role}</h2>
                <span className="rounded-full bg-amber-400 px-3 py-1 text-[10px] font-bold text-slate-950">LIVE</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{s.desc}</p>
              <div className="mt-3 flex gap-2">
                {s.tags.map((t) => <span key={t} className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] text-slate-300">{t}</span>)}
              </div>
              <Link href={"/suite/" + s.name} className="mt-4 block rounded-xl bg-amber-500 px-4 py-3 text-center font-bold text-slate-950 hover:bg-amber-400">Open Engineer</Link>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-slate-500">More engineering disciplines join as they are hired. Your waitlist votes decide the hiring order.</p>
      </div>
    </main>
    </>
  );
}