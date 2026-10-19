"use client";
import Link from "next/link";
import { jsPDF } from "jspdf";
import WalletBar from "@/components/WalletBar";
import { useState } from "react";
export default function ShadowPhysical() {
  const [text, setText] = useState("");
  const [img, setImg] = useState("");
  const [age, setAge] = useState(""); const [gender, setGender] = useState("Prefer not to say");
  const [prior, setPrior] = useState("");
  const [out, setOut] = useState(""); const [busy, setBusy] = useState(false); const [err, setErr] = useState("");

  const handleFile = (e: any) => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 4 * 1024 * 1024) { setErr("Photo too large. Max 4MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setImg(reader.result as string);
    reader.readAsDataURL(f);
  };

  const run = async () => {
    if (!text.trim() && !img) { setErr("Paste values or upload a photo of your report."); return; }
    setBusy(true); setErr(""); setOut("");
    let email = "";
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) { const j = JSON.parse(localStorage.getItem(k) || "null"); email = (j && j.user && j.user.email) || ""; if (email) break; } } } catch (e) {}
    try {
      const r = await fetch("/api/ilera", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "physical", email, labs: text, image: img, age, gender, prior }) });
      const j = await r.json();
      if (j.ok) { setOut(j.answer || "No response."); try { window.dispatchEvent(new Event("wallet-refresh")); } catch (e) {} } else setErr(j.error || "Failed.");
    } catch (e) { setErr("Connection error."); }
    setBusy(false);
  };

  const MARKERS = [
    { name: "LDL Cholesterol", low: "< 50", norm: "50-99", high: "100-129", high2: "130-159", too: "> 160", cons: "Sustained high LDL accelerates artery plaque, raising heart-attack and stroke risk." },
    { name: "HbA1c", low: "< 5.0", norm: "5.0-5.6", high: "5.7-6.4", high2: "6.5-7.0", too: "> 7.0", cons: "High HbA1c indicates poor glucose control, risking nerve, eye, and kidney damage (diabetes)." },
    { name: "TSH (Thyroid)", low: "< 0.4", norm: "0.4-4.0", high: "4.1-10.0", high2: "10.1-20.0", too: "> 20.0", cons: "Low TSH (hyperthyroid) risks bone loss and arrhythmia; high TSH (hypo) causes fatigue and weight gain." },
    { name: "Vitamin D", low: "< 12", norm: "30-50", high: "51-80", high2: "81-100", too: "> 100", cons: "Low Vitamin D leads to bone weakening (osteoporosis) and compromised immune function." },
    { name: "Iodine (Urinary)", low: "< 20", norm: "100-199", high: "200-299", high2: "300-499", too: "> 500", cons: "Low iodine can lead to thyroid dysfunction, goiter, and developmental issues." },
    { name: "eGFR (Kidney)", low: "> 90", norm: "60-89", high: "45-59", high2: "30-44", too: "< 30", cons: "Declining eGFR indicates chronic kidney disease, requiring medication adjustments." }
  ];

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <Link href="/suite/healthcare" className="mb-3 inline-block text-sm font-bold text-cyan-400 hover:underline">← Healthcare Suite</Link>
      <WalletBar />

      <h1 className="text-3xl font-bold text-rose-300">🩺 Shadow Annual Physical</h1>
      <p className="mt-1 text-sm text-slate-400">The free reference table every patient needs, plus a 10-credit deep read of your actual report (text or photo). Educational screening only.</p>
      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="text-lg font-bold text-cyan-300">The Shadow Physical (Free Reference)</p>
        <p className="text-xs text-slate-400">Standard adult reference bands. Your clinician uses your personal history to set exact targets.</p>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800 text-slate-300"><tr><th className="p-2">Marker</th><th className="p-2">Too Low</th><th className="p-2">Low</th><th className="p-2 text-emerald-300">Normal</th><th className="p-2">High</th><th className="p-2">Too High</th></tr></thead>
            <tbody>
              {MARKERS.map((m) => (
                <tr key={m.name} className="border-b border-slate-800">
                  <td className="p-2 font-bold text-white">{m.name}<p className="text-[10px] font-normal text-amber-300">{m.cons}</p></td>
                  <td className="p-2 text-blue-300">{m.low}</td><td className="p-2 text-cyan-300">{m.norm}</td><td className="p-2 text-emerald-300 font-bold">{m.high}</td><td className="p-2 text-orange-300">{m.high2}</td><td className="p-2 text-red-300">{m.too}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="text-lg font-bold text-rose-200">Your Personal Shadow Read (10 credits)</p>
        <p className="text-xs text-slate-400">Paste the text of your lab report, or take a photo of the printout. iLera will extract the values, map them to the bands, and flag what is missing.</p>
        <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
          <div><p className="text-[11px] font-bold text-slate-300">Age</p><input value={age} onChange={(e) => setAge(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" /></div>
          <div><p className="text-[11px] font-bold text-slate-300">Gender</p><select value={gender} onChange={(e) => setGender(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"><option>Male</option><option>Female</option><option>Intersex</option><option>Prefer not to say</option></select></div>
        </div>
        <p className="mt-3 text-[11px] font-bold text-slate-300">Upload Photo of Lab Report (Optional - JPG/PNG)</p>
        <input type="file" accept="image/*" onChange={handleFile} className="mt-1 block w-full text-xs text-slate-400 file:mr-3 file:rounded-lg file:border-0 file:bg-rose-500 file:px-3 file:py-2 file:text-sm file:font-bold file:text-slate-950" />
        <p className="mt-3 text-[11px] font-bold text-slate-300">Or Paste Text Values</p>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder="LDL 141, HbA1c 5.9, TSH 2.1..." className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" />
        <p className="mt-3 text-[11px] font-bold text-slate-300">Prior doctor notes on these labs</p>
        <textarea value={prior} onChange={(e) => setPrior(e.target.value)} rows={2} placeholder="GP said recheck in 6 months..." className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" />
        <button onClick={run} disabled={busy} className="mt-4 w-full rounded-lg bg-rose-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-rose-400 disabled:opacity-50">{busy ? "iLera is reading your report..." : "Read My Shadow Physical (10 credits)"}</button>
        {err && <p className="mt-2 text-xs font-bold text-amber-300">{err}</p>}
      </div>

      {out && (<div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-500/5 p-5"><p className="text-sm font-bold text-rose-200">YOUR PERSONAL SHADOW READ</p><pre className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{out}</pre></div>)}
    </main>
  );
}

