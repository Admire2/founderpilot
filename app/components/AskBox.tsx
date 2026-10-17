"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
type E = { n: string; t: string; c?: string; h?: string; w?: boolean };
const SERVICES: Record<string, E> = {
  "/suite/name-creator": { n: "Name Creator", t: "I invent brand names and live-check that the domain is still yours to take." },
  "/suite/image-resizer": { n: "Smart Image Resizer", t: "I fit your photos to any platform's exact pixels - scale or exact W x H, PDF or JPG out." },
  "/suite/compress": { n: "Smart Compress & Enlarge", t: "I shrink file sizes for web or upscale for print - quality slider, batch zip." },
  "/suite/qr-generator": { n: "QR Code Generator", t: "I turn any link into a scannable code with a business page and printable sheets." },
  "/suite/merge-pdfs": { n: "Merge PDFs & Images", t: "I stitch your documents and pictures into one master file, in the order you choose." },
  "/suite/password-generator": { n: "Password Generator", t: "I forge strong keys locally and never see them." },
  "/suite/text-checker": { n: "Text Checker", t: "I proof your writing - spelling, grammar, tone - before the world sees it." },
  "/suite/text-to-audio": { n: "Text-to-Audio", t: "I give your words a voice so people can listen instead of read." },
  "/suite/audio-to-text": { n: "Audio-to-Text", t: "I turn your voice notes and meetings into clean, searchable transcripts." },
  "/suite/letter-writer": { n: "Letter Writer", t: "I draft formal letters - complaints, applications, notices - that get read and answered." },
  "/suite/pilot-sign": { n: "Pilot Sign", t: "I route documents for signature and track who signed, when." },
  "/suite/pilot-sign-solo": { n: "Solo Sign", t: "I let you sign your own documents instantly, no counterparty needed." },
  "/suite/advisor": { n: "Advisor", t: "I answer any business question with a reasoned, credit-priced brief." },
  "/business-model": { n: "Business Model", t: "I turn your idea into a canvas: value, customers, revenue, costs." },
  "/persona": { n: "Customer Persona", t: "I build the person who actually buys - pains, gains, triggers." },
  "/landing-page": { n: "Landing Page Copy", t: "I write the page that converts: headline, proof, call to action." },
  "/pricing": { n: "Pricing", t: "I price your offer against the market so you keep margin and still win." },
  "/suite/watermark": { n: "Watermark & Protect", t: "I add logos or password-protection to your PDFs. I sit on the waitlist deck - join from the Business Suite lobby and I build in public order.", w: true },
  "/suite/maxi": { n: "Maxi", t: "I am your electronics engineer: circuits, PCBs, component choice and embedded logic - designed, checked and ready to build." },
  "/suite/maxi/partners": { n: "Maxi Partners", t: "I match you with vetted partners and split the work fairly." },
  "/suite/maxi/sourcing": { n: "Maxi Sourcing", t: "I find suppliers and compare them so you buy smart." },
  "/suite/rivet": { n: "Rivet", t: "I am your mechanical engineer: mechanisms, frames, fits and materials - sized, stressed and proven so nothing bends, binds or breaks." },
  "/suite/volt": { n: "Volt", t: "I size your power and solar systems so the lights stay on." },
  "/suite/terra": { n: "Terra", t: "I plan your land, builds, and site works with discipline." },
  "/suite/ilera": { n: "iLera", t: "I am your health suite: panels, risks, meds, and foresight in one place." },
  "/suite/ilera/panels": { n: "Panels", t: "I recommend which check-up panels fit your age and history." },
  "/suite/ilera/risk": { n: "Risk", t: "I score your lifestyle and family history into one clear picture." },
  "/suite/ilera/meds": { n: "Meds", t: "I track your medications and flag interactions." },
  "/suite/ilera/labs": { n: "Labs", t: "I explain your lab results in plain language." },
  "/suite/ilera/foresight": { n: "Foresight", t: "I read your trends and flag health risks before they arrive." },
  "/suite/ilera/pack": { n: "Pack", t: "I build your first-aid and medicine kit for home or travel." },
  "/karakata": { n: "KaraKata Market", t: "The open marketplace: list free, buy safe, and my AI scout finds anything we don't stock." },
  "/karakata/sell": { n: "Seller Center", t: "I onboard you, connect your bank, and put your craft on the shelf." },
  "/karakata/studio": { n: "Seller Studio", t: "I write your listings from one photo and a sentence." },
  "/karakata/bi": { n: "BI Desk", t: "I turn your sales data into a dashboard and a weekly truth." },
  "/suite/karakata/fees": { n: "Fee Calculator", t: "I show exactly what KaraKata costs: nothing to list, a fair cut only when you sell." },
  "/suite/karakata/launch": { n: "Launch", t: "I walk your product from idea to live listing step by step." },
  "/suite/karakata/trust": { n: "Trust Blueprint", t: "I build the badges and policies that make strangers buy from you." },
  "/suite/office/vault": { n: "Doc Vault", t: "I keep your contracts and receipts encrypted, tagged, and one click away." },
  "/suite/office/mockup": { n: "Mockup & Scene Studio", t: "I render your product into hero scenes and hand you an open-3D-suite-ready brief." },
  "/suite/office/broadcast": { n: "Broadcast Kit", t: "I write your stream runbook and export your stream-engine scene collection." },
  "/suite/office/vaultkeys": { n: "Key Vault Advisor", t: "I write your password policy and breach-check your keys without ever seeing them." },
  "/suite/office/tasks": { n: "Ops Board", t: "I turn goals into queues, your voice into tasks, and your day into pomodoros." }
};
const HUBLIST: E[] = [
  { n: "Business Suite", t: "Idea-to-plan AI tools plus the visual & branding bench - names, pixels, codes, merges, signatures.", h: "/suite/business" },
  { n: "Office Suite", t: "Five legendary open-source jobs, FounderPilot style.", h: "/suite/office" },
  { n: "Engineering Suite", t: "Maxi, Rivet, Volt, Terra - the build desk.", h: "/suite/engineering" },
  { n: "Healthcare Suite", t: "iLera: panels, risks, meds, foresight.", h: "/suite/healthcare" },
  { n: "Marketplace Suite", t: "KaraKata commerce and advisory desks.", h: "/suite/marketplace" }
];
const G = (keys: string[], extra?: E[]): E[] => [...keys.map<E>((k) => ({ ...SERVICES[k], h: k, c: SERVICES[k].w ? undefined : (SERVICES[k].c || "10 cr") })), ...(extra || [])];
const GROUPS: Record<string, E[]> = {
  business: G(["/suite/name-creator", "/suite/image-resizer", "/suite/compress", "/suite/qr-generator", "/suite/merge-pdfs", "/suite/password-generator", "/suite/text-checker", "/suite/text-to-audio", "/suite/audio-to-text", "/suite/letter-writer", "/suite/pilot-sign", "/suite/pilot-sign-solo", "/suite/advisor", "/business-model", "/persona", "/landing-page", "/pricing"], [{ ...SERVICES["/suite/watermark"], w: true }]),
  engineering: G(["/suite/maxi", "/suite/maxi/partners", "/suite/maxi/sourcing", "/suite/rivet", "/suite/volt", "/suite/terra"]),
  healthcare: G(["/suite/ilera", "/suite/ilera/panels", "/suite/ilera/risk", "/suite/ilera/meds", "/suite/ilera/labs", "/suite/ilera/foresight", "/suite/ilera/pack"]),
  marketplace: G(["/karakata", "/karakata/sell", "/karakata/studio", "/karakata/bi", "/suite/karakata/fees", "/suite/karakata/launch", "/suite/karakata/trust"]),
  office: G(["/suite/office/vault", "/suite/office/mockup", "/suite/office/broadcast", "/suite/office/vaultkeys", "/suite/office/tasks"])
};
const HUBGROUP: Record<string, string> = { "/suite/engineering": "engineering", "/suite/healthcare": "healthcare", "/suite/marketplace": "marketplace", "/suite/office": "office" };
const CHIPS = ["ecosystem", "business", "engineering", "healthcare", "marketplace", "office"];
export default function AskBox() {
  const path = usePathname() || "";
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState("ecosystem");
  const detect = () => {
    if (HUBGROUP[path]) { setGroup(HUBGROUP[path]); return; }
    if (path !== "/suite") { setGroup("ecosystem"); return; }
    const mid = (typeof window !== "undefined" ? window.innerHeight : 800) / 2;
    for (const id of ["business", "engineering", "healthcare", "marketplace"]) {
      const el = typeof document !== "undefined" ? document.getElementById(id) : null;
      if (el) { const r = el.getBoundingClientRect(); if (r.top <= mid && r.bottom >= 0) { setGroup(id); return; } }
    }
    setGroup("ecosystem");
  };
  const openIt = () => { setOpen(true); detect(); };
  const single = SERVICES[path];
  let list: E[] | null = null;
  let title = "What lives here";
  if (path === "/suite") { list = group === "ecosystem" ? HUBLIST : GROUPS[group]; title = group === "ecosystem" ? "The FounderPilot Ecosystem" : group.charAt(0).toUpperCase() + group.slice(1) + " Suite - every service"; }
  else if (HUBGROUP[path]) { list = GROUPS[HUBGROUP[path]]; title = "Every service in this suite"; }
  return (
    <>
      <button onClick={openIt} className="fixed bottom-4 left-4 z-50 rounded-full border border-cyan-500/40 bg-slate-900/95 px-4 py-2 text-xs font-bold text-cyan-300 shadow-lg hover:bg-slate-800 md:left-72">❓ Ask what this does</button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-cyan-500/30 bg-slate-900 p-6 text-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-bold text-cyan-300">{list ? title : (single ? single.n : "FounderPilot")}</h3>
              <button onClick={() => setOpen(false)} className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Free to ask · credits only apply when a service runs</p>
            {path === "/suite" && (
              <div className="mt-3 flex flex-wrap gap-1">
                {CHIPS.map((c) => (<button key={c} onClick={() => setGroup(c)} className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + (group === c ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-300")}>{c}</button>))}
              </div>
            )}
            {list ? (
              <div className="mt-4 space-y-3">
                {list.map((k, i) => (
                  <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-cyan-200">{k.n}</p>
                      {k.w ? (<span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[9px] font-bold text-amber-300">WAITLIST</span>) : k.c ? (<span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[9px] font-bold text-cyan-300">{k.c}</span>) : null}
                    </div>
                    <p className="mt-1 text-xs italic text-slate-300">"{k.t}"</p>
                    {k.w ? (<p className="mt-2 text-[10px] font-bold text-amber-300">Not live yet - join the waitlist from the Business Suite lobby; we build in public order.</p>) : k.h ? (<Link href={k.h} onClick={() => setOpen(false)} className="mt-2 inline-block rounded-lg bg-cyan-500 px-3 py-1.5 text-[10px] font-bold text-slate-950 hover:bg-cyan-400">Open service →</Link>) : null}
                  </div>
                ))}
              </div>
            ) : single ? (
              <div className="mt-4 rounded-xl border border-cyan-500/20 bg-slate-950 p-4">
                <p className="text-sm italic leading-relaxed text-slate-200">"{single.t}"</p>
                {single.c && (<p className="mt-2 text-[10px] font-bold text-cyan-300">Cost: {single.c}</p>)}
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-cyan-500/20 bg-slate-950 p-4">
                <p className="text-sm italic leading-relaxed text-slate-200">"I am FounderPilot. I turn ideas into operating businesses with AI agents across five suites. Ask me on any service page and I explain exactly what that service does before you spend a credit."</p>
              </div>
            )}
            <button onClick={() => setOpen(false)} className="mt-4 w-full rounded-lg bg-slate-800 px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700">Got it</button>
          </div>
        </div>
      )}
    </>
  );
}
