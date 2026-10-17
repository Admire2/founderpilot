"use client";
import Link from "next/link";
import { useState } from "react";

const SERVICES = [
  { 
    name: "Doc Vault", 
    href: "/suite/office/vault", 
    cr: "FREE + 10 cr AI filing", 
    desc: "Your private business cloud: contracts, receipts, docs - filed, tagged, signed-link shared. own-your-cloud job, zero hardware.", 
    tags: ["Storage", "AI Filing"],
    pitch: "I am Doc Vault. I am your private, encrypted business cloud. I store your contracts, receipts, and files, tag them, and summarize them with AI. No monthly rent, no renting someone else's server."
  },
  { 
    name: "Mockup & Scene Studio", 
    href: "/suite/office/mockup", 
    cr: "10 cr", 
    desc: "Product hero scenes rendered by AI plus an open-3D-suite-ready brief: models, materials, lights, cameras.", 
    tags: ["Mockups", "3D Brief"],
    pitch: "I am Mockup & Scene Studio. I render your product into professional AI scenes and hand you a open-3D-suite-ready brief. I can also publish your render straight to your KaraKata storefront."
  },
  { 
    name: "Broadcast Kit", 
    href: "/suite/office/broadcast", 
    cr: "10 cr", 
    desc: "Stream runbooks for YouTube/Twitch/Facebook: stream-engine scenes, countdown checklist, titles, hashtags, repurpose plan.", 
    tags: ["Streaming", "Runbook"],
    pitch: "I am Broadcast Kit. Your free stream engine is the engine; I am the flight plan. I write your stream runbook, generate your countdown checklist, and export your stream-engine scene collection so you can go live in one click."
  },
  { 
    name: "Key Vault Advisor", 
    href: "/suite/office/vaultkeys", 
    cr: "10 cr", 
    desc: "Company password policy, generator, audit checklist. Zero-knowledge: we never see or store your passwords.", 
    tags: ["Policy", "Audit"],
    pitch: "I am Key Vault Advisor. I write your company's password policy, generate strong local passwords, and check them against known breaches. I never see or store your secrets. The vault is yours; I just help you secure it."
  },
  { 
    name: "Ops Board", 
    href: "/suite/office/tasks", 
    cr: "FREE + 10 cr AI breakdown", 
    desc: "Tasks with estimates, Kanban and Eisenhower views - plus AI that breaks any goal into a work queue.", 
    tags: ["Kanban", "Eisenhower"],
    pitch: "I am Ops Board. I capture your tasks, prioritize them by Eisenhower quadrant, and use AI to break big goals into work queues. I also listen to your voice and run a pomodoro timer."
  }
];

export default function Office() {
  const [selected, setSelected] = useState<any>(null);

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <Link href="/suite/office" className="text-cyan-400 hover:underline text-sm">← Back to Suite</Link>
      <h1 className="mt-3 text-4xl font-bold">🗂️ Office Suite</h1>
      <p className="mt-1 text-sm text-slate-400">Five legendary open-source jobs - cloud files, 3D visuals, streaming, password security, task mastery - delivered FounderPilot style: in-browser, AI-empowered, credit-priced. Where free open-source originals win outright, we honour them in spirit and price only the intelligence.</p>
      
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SERVICES.map((s) => (
          <div key={s.name} className="flex flex-col rounded-xl border border-cyan-500/40 bg-cyan-500/5 p-5">
            <div className="flex items-center justify-between">
              <p className="font-bold text-cyan-200">{s.name}</p>
              <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300">{s.cr}</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">{s.desc}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {s.tags.map((t) => (
                <span key={t} className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">{t}</span>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <button 
                onClick={() => setSelected(s)} 
                className="flex-1 rounded-lg border border-cyan-500/50 bg-slate-900 px-3 py-2 text-center text-xs font-bold text-cyan-300 hover:bg-slate-800"
              >
                What does this do?
              </button>
              <Link 
                href={s.href} 
                className="flex-1 rounded-lg bg-cyan-500 px-3 py-2 text-center text-xs font-bold text-slate-950 hover:bg-cyan-400"
              >
                Open Service
              </Link>
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setSelected(null)}>
          <div className="w-full max-w-md rounded-2xl border border-cyan-500/30 bg-slate-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="text-xl font-bold text-cyan-300">{selected.name}</h3>
              <button onClick={() => setSelected(null)} className="rounded-full bg-slate-800 p-1.5 text-slate-400 hover:bg-slate-700 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            <div className="mt-4 rounded-xl border border-cyan-500/20 bg-slate-950 p-4">
              <p className="text-sm italic leading-relaxed text-slate-200">"{selected.pitch}"</p>
            </div>
            <div className="mt-6 flex flex-col gap-3">
              <Link href={selected.href} onClick={() => setSelected(null)} className="block w-full rounded-lg bg-cyan-500 px-4 py-3 text-center text-sm font-bold text-slate-950 hover:bg-cyan-400">
                Start using me →
              </Link>
              <button onClick={() => setSelected(null)} className="text-xs font-bold text-slate-500 hover:text-slate-300">
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
