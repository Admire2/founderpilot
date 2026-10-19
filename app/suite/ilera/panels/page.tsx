"use client";
import Link from "next/link";
import { useState } from "react";
import WalletBar from "@/components/WalletBar";
import { downloadPdf } from "@/lib/pdf";

const MEN = [
  { t: "Full Lipid Panel (LDL, HDL, Triglycerides)", now: "Plaque risk, metabolic syndrome", future: "10-20yr heart attack / stroke trajectory", band: "LDL <100 optimal, >160 too high", cons: "Sustained high LDL accelerates artery plaque" },
  { t: "Full Testosterone Panel (total, free, SHBG, estradiol, LH)", now: "Hormonal status: libido, energy, mood, motivation", future: "Late-onset hypogonadism, bone density loss", band: "Total T ~300-900 ng/dL", cons: "Low T drives fatigue, poor sleep, body-composition decline" },
  { t: "HbA1c", now: "Average blood sugar over 2-3 months", future: "Type-2 diabetes trajectory 5-10yr out", band: "<5.7 normal, 5.7-6.4 prediabetes, 6.5+ diabetes", cons: "Long high glucose damages nerves, eyes, kidneys" },
  { t: "Lipoprotein(a)", now: "Inherited cardiovascular risk factor", future: "Lifetime premature heart-disease risk", band: "<30 mg/dL desirable", cons: "High Lp(a) is genetic - statins barely move it" },
  { t: "CBC (Complete Blood Count)", now: "Anemia, infection, inflammation", future: "Hidden iron deficiency, marrow disorders", band: "Hemoglobin 13.5-17.5 g/dL", cons: "Missed anemia = years of unexplained fatigue" },
  { t: "Kidney Function (eGFR + UACR)", now: "Filtration rate + protein leak", future: "CKD progression, medication safety", band: "eGFR >90 optimal, UACR <30", cons: "Silent decline until late stages" },
  { t: "PSA (age 45+)", now: "Prostate screening baseline", future: "Prostate cancer early-detection window", band: "<4 ng/mL typical; baseline at 45 matters most", cons: "Prostate cancer is near-invisible early without testing" }
];
const WOMEN = [
  { t: "Full Lipid Panel (+ Lp(a) once in lifetime)", now: "Cardiovascular risk - women's #1 killer", future: "Post-menopause risk jump prediction", band: "LDL <100 optimal", cons: "Heart disease in women is chronically under-diagnosed" },
  { t: "HbA1c", now: "Average blood sugar", future: "Diabetes + PCOS metabolic trajectory", band: "<5.7 normal", cons: "Gestational diabetes history multiplies later risk" },
  { t: "CBC + Ferritin / Iron Studies", now: "Anemia, heavy-cycle iron loss", future: "Chronic fatigue, hair loss, restless legs", band: "Ferritin >30 ng/mL (50+ optimal)", cons: "Iron deficiency is the most-missed female deficiency" },
  { t: "Thyroid Panel (TSH, free T4, TPO antibodies if indicated)", now: "Hypo/hyperthyroid status", future: "Autoimmune thyroid trajectory, fertility impact", band: "TSH 0.4-4.0", cons: "Women are 5-8x more likely to develop autoimmune thyroid disease" },
  { t: "Female Hormone Panel (estradiol, FSH, LH, prolactin)", now: "Cycle irregularity, perimenopause stage", future: "Menopause timing, bone & fertility planning", band: "Cycle-phase dependent", cons: "Untreated imbalance drives sleep, mood and bone loss" },
  { t: "Vitamin D + B12", now: "Deficiency status", future: "Bone density, mood, nerve health", band: "D 30-50 ng/mL, B12 >400 pg/mL optimal", cons: "Deficiency mimics depression and chronic fatigue" },
  { t: "Kidney Function (eGFR + UACR)", now: "Filtration rate + protein leak", future: "CKD, pregnancy & BP-medication safety", band: "eGFR >90, UACR <30", cons: "Silent decline; NSAID load accelerates it" }
];

export default function Panels() {
  const [sex, setSex] = useState<"men" | "women">("men");
  const [age, setAge] = useState("");
  const [race, setRace] = useState("Prefer not to say");
  const [family, setFamily] = useState("");
  const [done, setDone] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const LIST = sex === "men" ? MEN : WOMEN;

  const run = async () => {
    setBusy(true); setErr(""); setOut("");
    let email = "";
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) { const j = JSON.parse(localStorage.getItem(k) || "null"); email = (j && j.user && j.user.email) || ""; if (email) break; } } } catch (e) {}
    try {
      const r = await fetch("/api/ilera", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "panels", email, gender: sex === "men" ? "Male" : "Female", age, race, family, labs: done, brief: "Personalize the " + (sex === "men" ? "Men's" : "Women's") + " 7-Panel for this person." }) });
      const j = await r.json();
      if (j.ok) { setOut(j.answer || "No response."); try { window.dispatchEvent(new Event("wallet-refresh")); } catch (e) {} }
      else setErr(j.error || "Failed.");
    } catch (e) { setErr("Connection error."); }
    setBusy(false);
  };

  const inp = "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm";

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <Link href="/suite/healthcare" className="mb-3 inline-block text-sm font-bold text-cyan-400 hover:underline">← Healthcare Suite</Link>
      <WalletBar />
      <h1 className="text-3xl font-bold text-rose-300">🩸 7-Panel Deep Read — Men & Women</h1>
      <p className="mt-1 text-sm text-slate-400">The blood tests that catch disease NOW and predict it LATER. Free tables below; personalized ranking + doctor request script = 10 credits.</p>
      <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-[11px] font-bold text-rose-200">⚕️ Educational screening guide, not a diagnosis. Your clinician confirms and orders.</div>

      <div className="mt-4 flex gap-2">
        <button onClick={() => setSex("men")} className={"rounded-lg px-4 py-2 text-xs font-bold " + (sex === "men" ? "bg-rose-500 text-slate-950" : "bg-slate-800 text-slate-300")}>MEN'S 7</button>
        <button onClick={() => setSex("women")} className={"rounded-lg px-4 py-2 text-xs font-bold " + (sex === "women" ? "bg-rose-500 text-slate-950" : "bg-slate-800 text-slate-300")}>WOMEN'S 7</button>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-white/10 bg-white/5">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-800 text-slate-300"><tr><th className="p-2">Test</th><th className="p-2">Detects NOW</th><th className="p-2">Predicts LATER</th><th className="p-2">Typical band</th><th className="p-2">If it drifts</th></tr></thead>
          <tbody>
            {LIST.map((m) => (
              <tr key={m.t} className="border-b border-slate-800 align-top">
                <td className="p-2 font-bold text-white">{m.t}</td>
                <td className="p-2 text-cyan-200">{m.now}</td>
                <td className="p-2 text-amber-200">{m.future}</td>
                <td className="p-2 text-emerald-200">{m.band}</td>
                <td className="p-2 text-rose-200">{m.cons}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-rose-200">PERSONALIZE MY PANEL (10 credits)</p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div><p className="text-[11px] font-bold text-slate-300">Age</p><input value={age} onChange={(e) => setAge(e.target.value)} className={"mt-1 " + inp} placeholder="42" /></div>
          <div><p className="text-[11px] font-bold text-slate-300">Race / ethnicity</p><select value={race} onChange={(e) => setRace(e.target.value)} className={"mt-1 " + inp}><option>Prefer not to say</option><option>Black / African</option><option>White / European</option><option>Asian</option><option>Hispanic / Latino</option><option>Middle Eastern</option><option>Other</option></select></div>
          <div><p className="text-[11px] font-bold text-slate-300">Family history</p><input value={family} onChange={(e) => setFamily(e.target.value)} className={"mt-1 " + inp} placeholder="Father: heart attack 55..." /></div>
        </div>
        <p className="mt-3 text-[11px] font-bold text-slate-300">Labs I already have (so iLera skips them)</p>
        <textarea value={done} onChange={(e) => setDone(e.target.value)} rows={2} className={"mt-1 " + inp} placeholder="LDL 141 (2025), HbA1c 5.9 (2025)..." />
        <button onClick={run} disabled={busy} className="mt-4 w-full rounded-lg bg-rose-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-rose-400 disabled:opacity-50">{busy ? "Ranking your panel..." : "Build My Personalized Panel (10 credits)"}</button>
        {err && <p className="mt-2 text-xs font-bold text-amber-300">{err}</p>}
      </div>

      {out && (
        <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/5 p-5">
          <p className="text-sm font-bold text-rose-200">YOUR PERSONALIZED PANEL</p>
          <pre className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{out}</pre>
          <button onClick={() => downloadPdf("iLERA 7-PANEL DEEP READ (" + (sex === "men" ? "MEN" : "WOMEN") + ")\n" + new Date().toLocaleString() + "\nAge: " + age + " | Race: " + race + "\nFamily: " + family + "\nAlready done: " + done + "\n\n" + out, "iLera-7-panel-" + sex + ".pdf")} className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400">Download PDF</button>
        </div>
      )}
    </main>
  );
}

