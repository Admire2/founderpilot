"use client";
import WalletBar from "@/components/WalletBar";
import { useState, useRef } from "react";
import { jsPDF } from "jspdf";
import Link from "next/link";

export default function AudioToTextPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [transcript, setTranscript] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const transcribe = async () => {
    if (!file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("audio", file);
      const res = await fetch("/api/suite/stt", { method: "POST", body: fd });
      const j = await res.json();
      if (!res.ok || !j.text) { alert("Transcription failed. Try a shorter recording (under 10 minutes)."); }
      else setTranscript(j.text);
    } catch (e) { alert("Transcription error."); }
    setLoading(false);
  };

  const downloadTxt = () => {
    const blob = new Blob([transcript], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "founderpilot-transcript.txt";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const downloadDoc = () => {
    const html = "<html xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset='utf-8'><title>Transcript</title></head><body><p>" + transcript.split(/\n/).join("</p><p>") + "</p></body></html>";
    const blob = new Blob(["\ufeff" + html], { type: "application/msword" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "founderpilot-transcript.doc";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const downloadPdf = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text("Seminar Transcript", 20, 20);
    doc.setFontSize(11);
    const lines = doc.splitTextToSize(transcript, 170);
    let y = 32;
    for (const line of lines) { if (y > 280) { doc.addPage(); y = 20; } doc.text(line, 20, y); y += 6; }
    doc.save("founderpilot-transcript.pdf");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <WalletBar />

      <div className="max-w-3xl mx-auto">
        <Link href="/suite" className="text-cyan-400 hover:underline mb-6 inline-block">&larr; Back to Suite</Link>
        <h1 className="text-3xl font-bold mb-2">Audio-to-Text Transcriber</h1>
        <p className="text-slate-400 mb-8">At a seminar or meeting? Upload the recording and get editable text in seconds. Fix any mistake, then export to TXT, Word, or PDF.</p>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 space-y-6">
          <input ref={fileRef} type="file" accept="audio/*,.mp3,.wav,.m4a,.webm" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400 cursor-pointer" />
          {file && <p className="text-sm text-cyan-300">Selected: {file.name} ({Math.round(file.size / 1024)} KB)</p>}
          <button onClick={transcribe} disabled={!file || loading} className="w-full rounded-xl bg-cyan-500 px-6 py-4 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition">
            {loading ? "Transcribing with Whisper AI..." : "Transcribe Audio"}
          </button>
        </div>

        {transcript && (
          <div className="mt-8 space-y-4">
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6">
              <h2 className="text-xl font-bold text-emerald-300 mb-3">Your Editable Transcript</h2>
              <textarea value={transcript} onChange={(e) => setTranscript(e.target.value)} className="w-full min-h-[250px] rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-white outline-none focus:border-cyan-400" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <button onClick={downloadTxt} className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400">Download .txt</button>
              <button onClick={downloadDoc} className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400">Download .doc (Word)</button>
              <button onClick={downloadPdf} className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400">Download .pdf</button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
