"use client";
import Link from "next/link";
import { jsPDF } from "jspdf";
import WalletBar from "@/components/WalletBar";
import { useState } from "react";

export default function ILera() {
  const [brief, setBrief] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("Prefer not to say");
  const [race, setRace] = useState("Prefer not to say");
  const [hUnit, setHUnit] = useState("cm");
  const [height, setHeight] = useState("");
  const [wUnit, setWUnit] = useState("kg");
  const [weight, setWeight] = useState("");
  const [conditions, setConditions] = useState("");
  const [meds, setMeds] = useState("");
  const [family, setFamily] = useState("");
  const [prior, setPrior] = useState("");
  const [labs, setLabs] = useState("");
  const [goal, setGoal] = useState("Understand my symptoms");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const bmi = () => {
    const h = parseFloat(height); const w = parseFloat(weight);
    if (!h || !w) return "";
    const cm = hUnit === "cm" ? h : h * 2.54;
    const kg = wUnit === "kg" ? w : w / 2.2046;
    const m = cm / 100;
    const b = kg / (m * m);
    return b.toFixed(1);
  };

  const autoDetect = () => {
    const t = brief; const tl = t.toLowerCase(); const found: string[] = [];
    const am = t.match(/\b(\d{1,2})\s*(?:years?|yrs?|yo|year-old)\b/i) || t.match(/\bage[d]?\s*:?\s*(\d{1,2})\b/i);
    if (am) { setAge(am[1]); found.push("age " + am[1]); }
    if (/\b(male|man)\b/i.test(tl) && !/\bfemale|woman\b/i.test(tl)) { setGender("Male"); found.push("male"); }
    else if (/\b(female|woman)\b/i.test(tl)) { setGender("Female"); found.push("female"); }
    const hm = t.match(/(\d{2,3})\s*(?:cm|centimet)/i) || t.match(/(\d{2,3})\s*(?:in|inches)\b/i);
    if (hm) { setHeight(hm[1]); setHUnit(/in/i.test(hm[0]) ? "in" : "cm"); found.push("height " + hm[0].trim()); }
    const wm = t.match(/(\d{2,3})\s*(?:kg|kilo)/i) || t.match(/(\d{2,3})\s*(?:lbs?|pounds?)\b/i);
    if (wm) { setWeight(wm[1]); setWUnit(/lb|pound/i.test(wm[0]) ? "lb" : "kg"); found.push("weight " + wm[0].trim()); }
    const CONDS = ["hypertension","high blood pressure","diabetes","pre-diabetic","prediabetic","hypothyroid","hyperthyroid","asthma","copd","kidney disease","anemia","high cholesterol","pcos","sleep apnea","gerd","arthritis","fatty liver"];
    const fc = CONDS.filter((c) => tl.includes(c));
    if (fc.length) { setConditions(fc.join(", ")); found.push("conditions: " + fc.join(", ")); }
    const MEDS = ["lisinopril","metformin","atorvastatin","rosuvastatin","amlodipine","levothyroxine","omeprazole","sertraline","ibuprofen","aspirin","warfarin","insulin","creatine","vitamin d","multivitamin","losartan","bisoprolol"];
    const fm = MEDS.filter((md) => tl.includes(md));
    if (fm.length) { setMeds(fm.join(", ")); found.push("meds: " + fm.join(", ")); }
    const famSent = t.split(/[.!?\n]+/).filter((s) => /father|mother|dad|mum|mom|brother|sister|family/i.test(s)).map((s) => s.trim()).join(". ");
    if (famSent) { setFamily(famSent); found.push("family history"); }
    setErr(found.length ? "Auto-detected: " + found.join(" | ") + " - adjust anything wrong, then run." : "No structured details detected - iLera will still read your full story as-is.");
  };
  const run = async () => {
    if (!brief.trim()) { setErr("Describe your symptoms or goal first - that is your health brief."); return; }
    setBusy(true); setErr(""); setOut("");
    let email = "";
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) { const j = JSON.parse(localStorage.getItem(k) || "null"); email = (j && j.user && j.user.email) || ""; if (email) break; } } } catch (e) {}
    try {
      const r = await fetch("/api/ilera", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, brief, age, gender, race, height: height + " " + hUnit, weight: weight + " " + wUnit, bmi: bmi(), conditions, meds, family, prior, labs, goal }) });
      const j = await r.json();
      if (j.ok) { setOut(j.answer || "No response."); try { window.dispatchEvent(new Event("wallet-refresh")); } catch (e) {} }
      else setErr(j.error || "Analysis failed.");
    } catch (e) { setErr("Connection error - try again."); }
    setBusy(false);
  };

  const download = () => {
    const txt = "iLERA PRE-VISIT READ\nGenerated: " + new Date().toLocaleString() + "\n\nBRIEF:\n" + brief + "\nAge: " + age + " | Gender: " + gender + " | BMI: " + bmi() + "\nConditions: " + conditions + "\nMeds: " + meds + "\nFamily history: " + family + "\nPrior doctor visits: " + prior + "\n\n" + out + "\n\n---\niLera provides educational screening, not a diagnosis. Consult a licensed clinician.";
    const a = document.createElement("a");
    const doc = new jsPDF(); doc.setFontSize(10); const _lns = doc.splitTextToSize(txt, 180); let _y = 20; for (const _l of _lns) { if (_y > 280) { doc.addPage(); _y = 20; } doc.text(_l, 15, _y); _y += 6; } doc.save("iLera-pre-visit-read.pdf");
  };

  const inp = "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm";
  const lbl = "text-[11px] font-bold text-slate-300";

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <Link href="/suite/healthcare" className="mb-3 inline-block text-sm font-bold text-cyan-400 hover:underline">← Healthcare Suite</Link>
      <WalletBar />

      <h1 className="text-3xl font-bold text-rose-300">🩺 iLera — AI Healthcare Companion</h1>
      <p className="mt-1 text-sm text-slate-400">Your healthcare companion: symptoms + vitals + history + your doctor's prior findings. iLera adds prevention and preparation to the care you already receive - never replacement. 10 credits per analysis.</p>
      <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-[11px] font-bold text-rose-200">⚕️ Educational screening, not a diagnosis. Chest pain, stroke signs, severe bleeding? Call 911 now.</div>

      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm font-bold text-rose-200">01 · YOUR HEALTH STORY</p>
        <textarea value={brief} onChange={(e) => setBrief(e.target.value)} rows={5} placeholder="Describe what you feel, since when, what makes it better/worse... e.g. 'Fatigue and low motivation for 6 months, worse after poor sleep. Occasional dizziness when standing quickly.'" className={"mt-2 " + inp} />
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <div><p className={lbl}>Age</p><input value={age} onChange={(e) => setAge(e.target.value)} className={"mt-1 " + inp} placeholder="42" /></div>
          <div><p className={lbl}>Gender</p><select value={gender} onChange={(e) => setGender(e.target.value)} className={"mt-1 " + inp}><option>Male</option><option>Female</option><option>Intersex</option><option>Prefer not to say</option></select></div>
          <div><p className={lbl}>Race / ethnicity (optional - reference-range context)</p><select value={race} onChange={(e) => setRace(e.target.value)} className={"mt-1 " + inp}><option>Prefer not to say</option><option>Black / African</option><option>White / European</option><option>Asian</option><option>Hispanic / Latino</option><option>Middle Eastern</option><option>Other</option></select></div>
          <div><p className={lbl}>Goal</p><select value={goal} onChange={(e) => setGoal(e.target.value)} className={"mt-1 " + inp}><option>Understand my symptoms</option><option>Prepare for annual checkup</option><option>Decode existing labs</option><option>Optimize energy & performance</option></select></div>
          <div><p className={lbl}>Height ({hUnit})</p><div className="mt-1 flex gap-1"><input value={height} onChange={(e) => setHeight(e.target.value)} className={inp} placeholder={hUnit === "cm" ? "178" : "70"} /><button onClick={() => setHUnit(hUnit === "cm" ? "in" : "cm")} className="rounded-lg bg-slate-800 px-2 text-[10px] font-bold">{hUnit === "cm" ? "cm→in" : "in→cm"}</button></div></div>
          <div><p className={lbl}>Weight ({wUnit})</p><div className="mt-1 flex gap-1"><input value={weight} onChange={(e) => setWeight(e.target.value)} className={inp} placeholder={wUnit === "kg" ? "82" : "180"} /><button onClick={() => setWUnit(wUnit === "kg" ? "lb" : "kg")} className="rounded-lg bg-slate-800 px-2 text-[10px] font-bold">{wUnit === "kg" ? "kg→lb" : "lb→kg"}</button></div></div>
          <div><p className={lbl}>BMI (auto)</p><p className="mt-2 rounded-lg bg-slate-800 px-3 py-1.5 text-sm font-bold text-cyan-300">{bmi() || "--"}</p></div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div><p className={lbl}>Known conditions</p><input value={conditions} onChange={(e) => setConditions(e.target.value)} className={"mt-1 " + inp} placeholder="Hypertension, hypothyroid..." /></div>
          <div><p className={lbl}>Medications & supplements</p><input value={meds} onChange={(e) => setMeds(e.target.value)} className={"mt-1 " + inp} placeholder="Lisinopril, vitamin D, creatine..." /></div>
          <div><p className={lbl}>Family history</p><input value={family} onChange={(e) => setFamily(e.target.value)} className={"mt-1 " + inp} placeholder="Father: heart attack at 55. Mother: type 2 diabetes..." /></div>
          <div className="md:col-span-2"><p className={lbl}>Prior doctor visits & findings (always included in your report - iLera never overrides them)</p><textarea value={prior} onChange={(e) => setPrior(e.target.value)} rows={3} className={"mt-1 " + inp} placeholder="e.g. March 2026: GP diagnosed mild hypertension, started lisinopril 10mg, ordered lipid panel (LDL 141), recheck in 6 months..." /></div>
          <div><p className={lbl}>Recent lab values (optional - paste anything you have)</p><input value={labs} onChange={(e) => setLabs(e.target.value)} className={"mt-1 " + inp} placeholder="LDL 141, HbA1c 5.9, TSH 2.1..." /></div>
        </div>
        <button onClick={autoDetect} className="mb-2 w-full rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-500/20">✨ Auto-detect age, gender, vitals, conditions & meds from my story</button>
        <button onClick={run} disabled={busy} className="mt-4 w-full rounded-lg bg-rose-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-rose-400 disabled:opacity-50">{busy ? "iLera is reading your brief..." : "Run iLera Analysis (10 credits)"}</button>
        {err && <p className="mt-2 text-xs font-bold text-amber-300">{err}</p>}
      </div>

      {out && (
        <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/5 p-5">
          <p className="text-sm font-bold text-rose-200">03 · iLERA PRE-VISIT READ</p>
          <pre className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{out}</pre>
          <button onClick={download} className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400">Download Pre-Visit Read + Doctor Referral Pack</button>
          <button onClick={() => { localStorage.setItem("ounje_context", brief + " " + out); window.location.href = "/suite/ounje"; }} className="mt-2 w-full rounded-lg bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400">🍲 Ask Ounje: Build a meal plan for this read</button>
        </div>
      )}
    </main>
  );
}

