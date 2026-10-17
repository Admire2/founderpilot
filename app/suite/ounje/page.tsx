"use client";
import Link from "next/link";
import { jsPDF } from "jspdf";
import WalletBar from "@/app/components/WalletBar";
import { useState, useEffect } from "react";
export default function Ounje() {
  const [cond, setCond] = useState("");
  const [allergies, setAllergies] = useState("");
  const [prefs, setPrefs] = useState("");
  const [budget, setBudget] = useState("Moderate");
  const [plan, setPlan] = useState("1-day");
  const [meds, setMeds] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const ctx = localStorage.getItem("ounje_context");
    if (ctx) { setCond(ctx); localStorage.removeItem("ounje_context"); }
  }, []);

  const run = async () => {
    if (!cond.trim()) { setErr("Describe your health conditions or goals first (e.g. 'lower A1c', 'build muscle')."); return; }
    setBusy(true); setErr(""); setOut("");
    let email = "";
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) { const j = JSON.parse(localStorage.getItem(k) || "null"); email = (j && j.user && j.user.email) || ""; if (email) break; } } } catch (e) {}
    try {
      const r = await fetch("/api/ounje", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, conditions: cond, allergies, prefs, budget, plan, meds }) });
      const j = await r.json();
      if (j.ok) { setOut(j.answer || "No response."); try { window.dispatchEvent(new Event("wallet-refresh")); } catch (e) {} } else setErr(j.error || "Failed.");
    } catch (e) { setErr("Connection error."); }
    setBusy(false);
  };

  const download = () => {
    const a = document.createElement("a");
    const doc = new jsPDF(); doc.setFontSize(10); const _lns = doc.splitTextToSize("OUNJE MEAL PLAN\n" + new Date().toLocaleString() + "\n\n" + out + "\n\n---\nOunje is educational nutrition guidance, not medical treatment.", 180); let _y = 20; for (const _l of _lns) { if (_y > 280) { doc.addPage(); _y = 20; } doc.text(_l, 15, _y); _y += 6; } doc.save("ounje-plan.pdf");
  };

  const inp = "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm";

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <Link href="/suite/healthcare" className="mb-3 inline-block text-sm font-bold text-cyan-400 hover:underline">← Healthcare Suite</Link>
      <WalletBar />

      <h1 className="text-3xl font-bold text-emerald-300">🍲 Ounje — AI Nutrition Companion</h1>
      <p className="mt-1 text-sm text-slate-400">Condition-linked food tables, day plans, recipes, and grocery lists. Budget-aware and culturally flexible. 10 credits per plan.</p>
      <div className="mt-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-[11px] font-bold text-emerald-200">🥗 Ounje is educational nutrition guidance. It flags medication conflicts (e.g. warfarin/vitamin K, statins/grapefruit) but never prescribes diets - confirm with your clinician or pharmacist.</div>

      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-emerald-200">01 · YOUR NUTRITION BRIEF</p>
        <textarea value={cond} onChange={(e) => setCond(e.target.value)} rows={3} placeholder="Conditions/Goals: e.g. Pre-diabetic (HbA1c 5.9), want to lose 15lbs, high blood pressure..." className={"mt-2 " + inp} />
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div><p className="text-[11px] font-bold text-slate-300">Allergies & Dislikes</p><input value={allergies} onChange={(e) => setAllergies(e.target.value)} className={"mt-1 " + inp} placeholder="Peanuts, dairy, seafood..." /></div>
          <div><p className="text-[11px] font-bold text-slate-300">Cuisine / Preferences</p><input value={prefs} onChange={(e) => setPrefs(e.target.value)} className={"mt-1 " + inp} placeholder="West African, Mediterranean, Vegan..." /></div>
          <div><p className="text-[11px] font-bold text-slate-300">Budget</p><select value={budget} onChange={(e) => setBudget(e.target.value)} className={"mt-1 " + inp}><option>Strict / Low Cost</option><option>Moderate</option><option>Flexible / Premium</option></select></div>
          <div><p className="text-[11px] font-bold text-slate-300">Plan Length</p><select value={plan} onChange={(e) => setPlan(e.target.value)} className={"mt-1 " + inp}><option>1-Day</option><option>3-Day</option><option>7-Day</option></select></div>
        </div>
        <p className="mt-3 text-[11px] font-bold text-slate-300">Current Meds (for interaction checks)</p>
        <input value={meds} onChange={(e) => setMeds(e.target.value)} className={"mt-1 " + inp} placeholder="Lisinopril, metformin, warfarin..." />
        <button onClick={run} disabled={busy} className="mt-4 w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50">{busy ? "Ounje is building your plan..." : "Build My Meal Plan (10 credits)"}</button>
        {err && <p className="mt-2 text-xs font-bold text-amber-300">{err}</p>}
      </div>

      {out && (
        <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-5">
          <p className="text-sm font-bold text-emerald-200">03 · YOUR OUNJE PLAN</p>
          <pre className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{out}</pre>
          <button onClick={download} className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400">Download Plan & Grocery List</button>
        </div>
      )}
    </main>
  );
}
