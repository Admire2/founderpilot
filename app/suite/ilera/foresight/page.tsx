"use client";
import { useState } from "react";
import Link from "next/link";
import WalletBar from "@/components/WalletBar";
import { downloadPdf } from "@/lib/pdf";

export default function Foresight() {
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Prefer not to say");
  const [race, setRace] = useState("Prefer not to say");
  const [hUnit, setHUnit] = useState("cm");
  const [height, setHeight] = useState("");
  const [wUnit, setWUnit] = useState("kg");
  const [weight, setWeight] = useState("");
  const [smoke, setSmoke] = useState("Never");
  const [drink, setDrink] = useState("Light");
  const [active, setActive] = useState("Light");
  const [bp, setBp] = useState("");
  const [conditions, setConditions] = useState("");
  const [meds, setMeds] = useState("");
  const [family, setFamily] = useState("");
  const [labs, setLabs] = useState("");
  const [research, setResearch] = useState("");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const bmi = () => {
    const h = parseFloat(height); const w = parseFloat(weight);
    if (!h || !w) return "";
    const cm = hUnit === "cm" ? h : h * 2.54;
    const kg = wUnit === "kg" ? w : w / 2.2046;
    const m = cm / 100;
    return (kg / (m * m)).toFixed(1);
  };

  const run = async () => {
    setBusy(true); setErr(""); setOut("");
    let email = "";
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) { const j = JSON.parse(localStorage.getItem(k) || "null"); email = (j && j.user && j.user.email) || ""; if (email) break; } } } catch (e) {}
    try {
      const r = await fetch("/api/ilera", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "foresight", email, age, gender, race, height: height + " " + hUnit, weight: weight + " " + wUnit, bmi: bmi(), bp, conditions, meds, family, labs, brief: "Lifestyle: smoking " + smoke + ", alcohol " + drink + ", activity " + active + ". Research-grade data (optional): " + (research || "none") }) });
      const j = await r.json();
      if (j.ok) { setOut(j.answer || "No response."); try { window.dispatchEvent(new Event("wallet-refresh")); } catch (e) {} }
      else setErr(j.error || "Failed.");
    } catch (e) { setErr("Connection error."); }
    setBusy(false);
  };

  const inp = "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm";
  const lbl = "text-[11px] font-bold text-slate-300";

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <Link href="/suite/healthcare" className="mb-3 inline-block text-sm font-bold text-cyan-400 hover:underline">? Healthcare Suite</Link>
      <WalletBar />
      <h1 className="text-3xl font-bold text-rose-300">?? iLera Foresight � 20-Year Trajectory Map</h1>
      <p className="mt-1 text-sm text-slate-400">Where your current numbers are leaning over the next two decades - and the three changes that bend the curves. 20 credits.</p>
      <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-[11px] font-bold text-rose-200">?? Statistical tendencies from YOUR data - not a diagnosis. Cannot predict sudden events or rare genetic conditions. Your clinician confirms everything.</div>

      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-rose-200">01 � YOUR BASELINE</p>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div><p className={lbl}>Age</p><input value={age} onChange={(e) => setAge(e.target.value)} className={"mt-1 " + inp} placeholder="42" /></div>
          <div><p className={lbl}>Gender</p><select value={gender} onChange={(e) => setGender(e.target.value)} className={"mt-1 " + inp}><option>Male</option><option>Female</option><option>Intersex</option><option>Prefer not to say</option></select></div>
          <div><p className={lbl}>Race / ethnicity</p><select value={race} onChange={(e) => setRace(e.target.value)} className={"mt-1 " + inp}><option>Prefer not to say</option><option>Black / African</option><option>White / European</option><option>Asian</option><option>Hispanic / Latino</option><option>Middle Eastern</option><option>Other</option></select></div>
          <div><p className={lbl}>BP (if known)</p><input value={bp} onChange={(e) => setBp(e.target.value)} className={"mt-1 " + inp} placeholder="138/88" /></div>
          <div><p className={lbl}>Height ({hUnit})</p><div className="mt-1 flex gap-1"><input value={height} onChange={(e) => setHeight(e.target.value)} className={inp} /><button onClick={() => setHUnit(hUnit === "cm" ? "in" : "cm")} className="rounded-lg bg-slate-800 px-2 text-[10px] font-bold">{hUnit === "cm" ? "cm?in" : "in?cm"}</button></div></div>
          <div><p className={lbl}>Weight ({wUnit})</p><div className="mt-1 flex gap-1"><input value={weight} onChange={(e) => setWeight(e.target.value)} className={inp} /><button onClick={() => setWUnit(wUnit === "kg" ? "lb" : "kg")} className="rounded-lg bg-slate-800 px-2 text-[10px] font-bold">{wUnit === "kg" ? "kg?lb" : "lb?kg"}</button></div></div>
          <div><p className={lbl}>BMI (auto)</p><p className="mt-2 rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-bold text-cyan-300">{bmi() || "--"}</p></div>
          <div><p className={lbl}>Smoking</p><select value={smoke} onChange={(e) => setSmoke(e.target.value)} className={"mt-1 " + inp}><option>Never</option><option>Former</option><option>Current</option></select></div>
          <div><p className={lbl}>Alcohol</p><select value={drink} onChange={(e) => setDrink(e.target.value)} className={"mt-1 " + inp}><option>None</option><option>Light</option><option>Moderate</option><option>Heavy</option></select></div>
          <div><p className={lbl}>Activity</p><select value={active} onChange={(e) => setActive(e.target.value)} className={"mt-1 " + inp}><option>Sedentary</option><option>Light</option><option>Moderate</option><option>High</option></select></div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div><p className={lbl}>Conditions</p><input value={conditions} onChange={(e) => setConditions(e.target.value)} className={"mt-1 " + inp} placeholder="Hypertension, hypothyroid..." /></div>
          <div><p className={lbl}>Meds & supplements</p><input value={meds} onChange={(e) => setMeds(e.target.value)} className={"mt-1 " + inp} placeholder="Lisinopril, vitamin D..." /></div>
          <div><p className={lbl}>Family history</p><input value={family} onChange={(e) => setFamily(e.target.value)} className={"mt-1 " + inp} placeholder="Father: heart attack 55..." /></div>
          <div><p className={lbl}>Known labs</p><input value={labs} onChange={(e) => setLabs(e.target.value)} className={"mt-1 " + inp} placeholder="LDL 141, HbA1c 5.9..." /></div>
          <div className="md:col-span-2"><p className={lbl}>Research-grade data (OPTIONAL - proteomic panel / polygenic scores if you have them)</p><input value={research} onChange={(e) => setResearch(e.target.value)} className={"mt-1 " + inp} placeholder="e.g. Lp(a) 180 nmol/L, PRS coronary 92nd percentile..." /></div>
        </div>
        <button onClick={run} disabled={busy} className="mt-4 w-full rounded-lg bg-rose-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-rose-400 disabled:opacity-50">{busy ? "Projecting your 20-year map..." : "Build My 20-Year Trajectory Map (20 credits)"}</button>
        {err && <p className="mt-2 text-xs font-bold text-amber-300">{err}</p>}
      </div>

      {out && (
        <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/5 p-5">
          <p className="text-sm font-bold text-rose-200">03 � YOUR 20-YEAR TRAJECTORY MAP</p>
          <pre className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{out}</pre>
          <button onClick={() => downloadPdf("iLERA FORESIGHT - 20-YEAR TRAJECTORY MAP\n" + new Date().toLocaleString() + "\nAge: " + age + " | Gender: " + gender + " | BMI: " + bmi() + " | BP: " + bp + "\nSmoking: " + smoke + " | Alcohol: " + drink + " | Activity: " + active + "\nFamily: " + family + "\nLabs: " + labs + "\nResearch-grade: " + research + "\n\n" + out, "iLera-foresight-20yr.pdf")} className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400">Download PDF</button>
        </div>
      )}
    </main>
  );
}

