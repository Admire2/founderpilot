"use client";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Orchestrator() {
  const pathname = usePathname();
  const [dismissed, setDismissed] = useState(false);
  const [expert, setExpert] = useState(false);
  const [warn, setWarn] = useState("");
  const [snap, setSnap] = useState<any>(null);

  useEffect(() => {
    setDismissed(false); setWarn("");
    try { setExpert(localStorage.getItem("fp_expert_mode") === "true"); } catch (e) {}
    let alive = true;
    const load = async () => {
      const suite = pathname.indexOf("/rivet") >= 0 ? "rivet" : pathname.indexOf("/maxi") >= 0 ? "maxi" : pathname.indexOf("/volt") >= 0 ? "volt" : pathname.indexOf("/terra") >= 0 ? "terra" : "";
      if (!suite) { if (alive) setSnap(null); return; }
      let s: any = null;
      try { const raw = localStorage.getItem("fp_snap_" + suite); if (raw) s = JSON.parse(raw); } catch (e) {}
      if (!s || (!s.q && !s.build)) {
        try {
          let em = "";
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i) || "";
            if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) {
              const j = JSON.parse(localStorage.getItem(k) || "null");
              em = (j && j.user && j.user.email) || "";
              if (em) break;
            }
          }
          if (em) {
            const r = await fetch("/api/snapshot?email=" + encodeURIComponent(em));
            const jj = await r.json();
            const rows = (jj.rows || []).filter((x: any) => x.suite === suite);
            const row = rows[0];
            if (row) {
              s = { q: row.brief || "", answer: row.design_text || "", build: !!row.build_done, ts: row.updated_at_et, code: row.project_code };
              try { localStorage.setItem("fp_snap_" + suite, JSON.stringify(s)); } catch (e) {}
            }
          }
        } catch (e) {}
      }
      if (alive) setSnap(s);
    };
    load();
    const onUpd = () => { load(); };
    window.addEventListener("fp-snap-updated", onUpd);
    return () => { alive = false; window.removeEventListener("fp-snap-updated", onUpd); };
  }, [pathname]);

  if (dismissed || expert) return null;

  const suite = pathname.indexOf("/rivet") >= 0 ? "rivet" : pathname.indexOf("/maxi") >= 0 ? "maxi" : pathname.indexOf("/volt") >= 0 ? "volt" : pathname.indexOf("/terra") >= 0 ? "terra" : "";
  const onSuite = suite !== "";
  const stage = !onSuite ? 0 : (snap && (snap.q || snap.build)) ? (snap.build ? 3 : 2) : 1;

  let suggestion: any = null;
  if (pathname.indexOf("/ideavalidator") >= 0) suggestion = { icon: "📊", text: "Idea validated? Next: map the Business Model", href: "/business", act: "nav" };
  else if (pathname.indexOf("/suite/marketplace") >= 0) suggestion = { icon: "🛒", text: "KaraKata: describe your goods or service roughly - get a listing, a price band, and a quote ready to send.", act: "scroll" };
  else if (pathname.indexOf("/suite/ilera") >= 0) suggestion = { icon: "🩺", text: "Type your symptom brief + vitals below - iLera builds your pre-visit read before the doctor.", act: "scroll" };
  else if (pathname.indexOf("/business") >= 0) suggestion = { icon: "🛠️", text: "Model ready? Next: engineer the product", href: "/suite/engineering", act: "nav" };
  else if (onSuite && stage === 1) suggestion = { icon: "📝", text: "Step 01 first: write your project brief below (or upload a photo). Sourcing unlocks only AFTER 05 BUILD.", act: "brief" };
  else if (onSuite && stage === 2) suggestion = { icon: "📦", text: "Design in progress. Next: download any 05 BUILD pack - it unlocks sourcing instantly.", act: "build" };
  else if (onSuite && stage === 3) suggestion = { icon: "🚀", text: "Build pack saved - sourcing UNLOCKED. Source parts, suppliers, assemblers, finished products & manufacturing.", href: "/suite/maxi/sourcing?obj=" + encodeURIComponent((snap && snap.q) || ""), act: "nav" };
  if (!suggestion) return null;

  const go = () => {
    if (suggestion.act === "nav") { window.location.href = suggestion.href; return; }
    if (suggestion.act === "scroll") { const g = (document.querySelector("main textarea") || document.querySelector("main .grid")) as any; if (g) { g.scrollIntoView({ behavior: "smooth", block: "center" }); if (g.focus) g.focus(); } return; }
    if (suggestion.act === "brief") {
      setWarn("Finish Step 01: write the brief below, then run a design. Order: 01 Brief, 03 Design, 04 Sheet, 05 BUILD, then sourcing.");
      const ta = document.querySelector("textarea");
      if (ta) { ta.scrollIntoView({ behavior: "smooth", block: "center" }); (ta as HTMLTextAreaElement).focus(); }
      return;
    }
    if (suggestion.act === "build") {
      setWarn("Scroll to 05 BUILD and download ANY pack. The moment you download, this card flips to 🚀 and sourcing opens.");
      const hs = Array.from(document.querySelectorAll("h3"));
      const h = hs.find((x: any) => (x.textContent || "").indexOf("05") >= 0);
      if (h) h.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
  };

  const hrs = snap && snap.ts ? Math.max(1, Math.round((Date.now() - new Date(snap.ts).getTime()) / 3600000)) : 0;

  return (
    <div className="fixed bottom-24 right-4 z-50 w-80">
      <div className="rounded-xl border border-cyan-500/40 bg-slate-900/95 p-4 shadow-2xl backdrop-blur">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{suggestion.icon}</span>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">Orchestrator</p>
              <p className="text-sm font-bold text-white">{suggestion.text}</p>
            </div>
          </div>
          <button onClick={() => setDismissed(true)} className="text-lg leading-none text-slate-500 hover:text-white">×</button>
        </div>
        {snap && snap.code && <p className="mt-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 p-2 text-[10px] font-bold text-cyan-200">🎫 Project {snap.code} recognized{snap.build ? " (build complete)" : ""} - saved to your cloud history{hrs >= 1 ? " " + hrs + "h ago" : ""}. Restore it on ANY device for word-for-word continuity.</p>}
        {warn && <p className="mt-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-2 text-[11px] font-bold text-amber-300">{warn}</p>}
        <div className="mt-3 flex gap-2">
          <button onClick={go} className="flex-1 rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-900 hover:bg-cyan-400">{stage === 3 ? "Go To Sourcing →" : "Go There →"}</button>
          <button onClick={() => { try { localStorage.setItem("fp_expert_mode", "true"); } catch (e) {} setExpert(true); }} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white">Expert Mode</button>
        </div>
      </div>
    </div>
  );
}