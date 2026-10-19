"use client";
import WalletBar from "@/components/WalletBar";
import { useState } from "react";
import { jsPDF } from "jspdf";
import Link from "next/link";

export default function TextCheckerPage() {
  const [text, setText] = useState("");
  const [fixed, setFixed] = useState("");
  const [loading, setLoading] = useState(false);

  const check = async () => {
    if (text.trim().length < 5) { alert("Please paste some text first."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/suite/fix", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: text }) });
      const j = await res.json();
      if (!res.ok || !j.fixed) { alert("All AI engines are busy right now. Please try again in a moment."); }
      else { setFixed(j.fixed); }
    } catch (e) { alert("Error checking text."); }
    setLoading(false);
  };

  const downloadTxt = () => {
    const blob = new Blob([fixed], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "corrected-text.txt";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const downloadDoc = () => {
    const html = "<html xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'></head><body><p>" + fixed.split(/\n/).join("</p><p>") + "</p></body></html>";
    const blob = new Blob(["\ufeff" + html], { type: "application/msword" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "corrected-text.doc";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const downloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(fixed, 170);
    let y = 20;
    for (const line of lines) { if (y > 280) { doc.addPage(); y = 20; } doc.text(line, 20, y); y += 6; }
    doc.save("corrected-text.pdf");
  };

  const inputClass = "w-full rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-white outline-none focus:border-cyan-400";

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <WalletBar />

      <div className="max-w-3xl mx-auto">
        <Link href="/suite" className="text-cyan-400 hover:underline mb-6 inline-block">&larr; Back to Suite</Link>
        <h1 className="text-3xl font-bold mb-2">Text & Grammar Checker</h1>
        <p className="text-slate-400 mb-8">Paste any text - emails, essays, reports - and get a clean, corrected version instantly.</p>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 space-y-6">
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your text here..." className={inputClass + " min-h-[180px]"} />
          <button onClick={check} disabled={loading} className="w-full rounded-xl bg-cyan-500 px-6 py-4 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition">
            {loading ? "Checking & Fixing..." : "Check & Fix Text"}
          </button>
        </div>

        {fixed && (
          <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 space-y-4">
            <h2 className="text-xl font-bold text-emerald-300">Corrected Version (Editable)</h2>
            <textarea value={fixed} onChange={(e) => setFixed(e.target.value)} className={inputClass + " min-h-[180px]"} />
            <div className="grid grid-cols-3 gap-4">
              <button onClick={downloadTxt} className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400">Download .txt</button>
              <button onClick={downloadDoc} className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400">Download .doc</button>
              <button onClick={downloadPdf} className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400">Download .pdf</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
