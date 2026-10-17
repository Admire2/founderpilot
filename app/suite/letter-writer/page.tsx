"use client";
import WalletBar from "@/app/components/WalletBar";
import { useState } from "react";
import { jsPDF } from "jspdf";
import Link from "next/link";

const TYPES = [
  "Business Inquiry / Enquiry",
  "Request for Quotation (RFQ)",
  "Distributor / Partnership Application",
  "Cover Letter",
  "Resignation Letter",
  "Complaint Letter",
  "Apology Letter",
  "Personal Letter (Friend / Family)",
  "Condolence / Sympathy",
  "Thank You Letter",
  "Recommendation / Reference"
];
const TONES = ["Formal", "Friendly", "Assertive", "Empathetic"];

export default function LetterWriterPage() {
  const [type, setType] = useState(TYPES[0]);
  const [customType, setCustomType] = useState("");
  const [recipient, setRecipient] = useState("");
  const [sender, setSender] = useState("");
  const [tone, setTone] = useState(TONES[0]);
  const [points, setPoints] = useState("");
  const [letter, setLetter] = useState("");
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (points.trim().length < 10) { alert("Please describe what the letter should be about."); return; }
    setLoading(true);
    try {
      const actualType = customType.trim() || type;
      const res = await fetch("/api/suite/letter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: actualType, recipient: recipient, sender: sender, tone: tone, points: points }) });
      const j = await res.json();
      if (!res.ok || !j.letter) { alert("All AI engines are busy right now. Please try again in a moment."); }
      else { setLetter(j.letter); }
    } catch (e) { alert("Error writing letter."); }
    setLoading(false);
  };

  const downloadTxt = () => {
    const blob = new Blob([letter], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "founderpilot-letter.txt";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const downloadDoc = () => {
    const html = "<html xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'></head><body><p>" + letter.split(/\n/).join("</p><p>") + "</p></body></html>";
    const blob = new Blob(["\ufeff" + html], { type: "application/msword" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "founderpilot-letter.doc";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const downloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(letter, 170);
    let y = 20;
    for (const line of lines) { if (y > 280) { doc.addPage(); y = 20; } doc.text(line, 20, y); y += 6; }
    doc.save("founderpilot-letter.pdf");
  };

  const inputClass = "w-full rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-white outline-none focus:border-cyan-400";

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <WalletBar />

      <div className="max-w-3xl mx-auto">
        <Link href="/suite" className="text-cyan-400 hover:underline mb-6 inline-block">&larr; Back to Suite</Link>
        <h1 className="text-3xl font-bold mb-2">Professional & Personal Letter Writer</h1>
        <p className="text-slate-400 mb-8">Business enquiries, applications, OR personal letters. Pick a category or type your own custom request.</p>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Letter Category</label>
              <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
                {TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Custom Type (Optional - overrides list)</label>
              <input value={customType} onChange={(e) => setCustomType(e.target.value)} placeholder="e.g. Application to be a Distributor" className={inputClass} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Tone</label>
              <select value={tone} onChange={(e) => setTone(e.target.value)} className={inputClass}>
                {TONES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Recipient (Optional)</label>
              <input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g. The Manager, ABC Ltd" className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium">Your Name / Company (Optional)</label>
              <input value={sender} onChange={(e) => setSender(e.target.value)} placeholder="e.g. Akande Joseph" className={inputClass} />
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">What should the letter be about?</label>
            <textarea value={points} onChange={(e) => setPoints(e.target.value)} placeholder="e.g. I want to enquire about the price of 50 office chairs, delivery time to Lagos, and bulk discount..." className={inputClass + " min-h-[120px]"} />
          </div>
          <button onClick={generate} disabled={loading} className="w-full rounded-xl bg-cyan-500 px-6 py-4 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition">
            {loading ? "Writing your letter..." : "Write My Letter"}
          </button>
        </div>

        {letter && (
          <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 space-y-4">
            <h2 className="text-xl font-bold text-emerald-300">Your Letter (editable)</h2>
            <textarea value={letter} onChange={(e) => setLetter(e.target.value)} className={inputClass + " min-h-[250px]"} />
            <div className="grid grid-cols-3 gap-4">
              <button onClick={downloadTxt} className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400">.txt</button>
              <button onClick={downloadDoc} className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400">.doc (Word)</button>
              <button onClick={downloadPdf} className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400">.pdf</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}