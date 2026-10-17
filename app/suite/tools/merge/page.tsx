"use client";
import { useState } from "react";
import Link from "next/link";
import WalletBar from "@/components/WalletBar";
import { useWallet } from "@/components/useWallet";
import { PDFDocument } from "pdf-lib";

export default function MergePage() {
  const { spend } = useWallet();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const pdfFiles = Array.from(newFiles).filter((f) => f.type === "application/pdf");
    setFiles((prev) => [...prev, ...pdfFiles]);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const run = async () => {
    if (files.length < 2 || busy) { alert("Pick at least 2 PDFs."); return; }
    setBusy(true);
    try {
      const out = await PDFDocument.create();
      for (const f of files) { const src = await PDFDocument.load(await f.arrayBuffer()); const pages = await out.copyPages(src, src.getPageIndices()); pages.forEach((p) => out.addPage(p)); }
      const bytes = await out.save();
      const ok = await spend(10);
      if (ok) { const blob = new Blob([bytes as any], { type: "application/pdf" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "merged.pdf"; a.click(); }
    } catch (e) { alert("Merge failed - check your PDFs."); }
    setBusy(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <WalletBar />
      <div className="max-w-2xl mx-auto">
        <Link href="/suite" className="text-cyan-400 hover:underline text-sm">&larr; Back to Suite</Link>
        <h1 className="mt-4 text-3xl font-bold">Merge PDFs</h1>
        <p className="mt-2 text-sm text-slate-400">10 credits per merge. Combine contracts, exhibits, and attachments into one file.</p>
        
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          className={"mt-6 rounded-xl border-2 border-dashed p-8 text-center transition-colors " + (dragOver ? "border-cyan-400 bg-cyan-500/10" : "border-white/20 bg-slate-900/50")}
        >
          <input
            type="file"
            accept="application/pdf"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
            id="pdf-upload"
          />
          <label htmlFor="pdf-upload" className="cursor-pointer">
            <div className="text-4xl mb-2">📄</div>
            <p className="text-sm font-bold">Click to select PDFs or drag them here</p>
            <p className="text-xs text-slate-500 mt-1">Add 2 or more PDFs to merge</p>
          </label>
        </div>

        {files.length > 0 && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-bold text-slate-300 mb-2">{files.length} file(s) selected - merge order:</p>
            <div className="space-y-2">
              {files.map((f, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs">
                  <span className="flex items-center gap-2 truncate">
                    <span className="text-slate-500">{idx + 1}.</span>
                    <span className="truncate">{f.name}</span>
                  </span>
                  <button onClick={() => removeFile(idx)} className="text-red-400 hover:text-red-300 ml-2">✕</button>
                </div>
              ))}
            </div>
          </div>
        )}

        <button onClick={run} disabled={busy} className="mt-4 w-full rounded-xl bg-cyan-500 px-4 py-3 font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50">{busy ? "Merging..." : "Merge & Download (-10 credits)"}</button>
      </div>
    </main>
  );
}