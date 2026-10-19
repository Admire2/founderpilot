"use client";
import WalletBar from "@/components/WalletBar";
import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import Link from "next/link";

export default function MergePdfsPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);

  const addFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    setFiles((prev) => [...prev, ...Array.from(newFiles)]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const merge = async () => {
    if (files.length < 2) { alert("Please select at least 2 files to merge."); return; }
    setBusy(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of files) {
        const bytes = await file.arrayBuffer();
        if (file.type === "application/pdf") {
          const subDoc = await PDFDocument.load(bytes);
          const pages = await mergedPdf.copyPages(subDoc, subDoc.getPageIndices());
          pages.forEach((p) => mergedPdf.addPage(p));
        } else if (file.type.startsWith("image/")) {
          const img = file.type.includes("png") ? await mergedPdf.embedPng(bytes) : await mergedPdf.embedJpg(bytes);
          const page = mergedPdf.addPage([img.width, img.height]);
          page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height });
        }
      }
      const out = await mergedPdf.save();
      const blob = new Blob([out as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "merged-contract.pdf";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (e: any) {
      alert("Error merging: " + (e.message || "File might be too large or corrupted."));
    }
    setBusy(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <WalletBar />

      <div className="max-w-3xl mx-auto">
        <Link href="/suite" className="text-cyan-400 hover:underline mb-6 inline-block">&larr; Back to Suite</Link>
        <h1 className="text-3xl font-bold mb-2">Merge PDFs & Images</h1>
        <p className="text-slate-400 mb-8">Combine multiple PDFs and JPGs into one master contract document. 100% private - processed in your browser.</p>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium">Select Files (Hold Ctrl/Cmd to select multiple)</label>
            <input type="file" multiple accept="application/pdf,image/jpeg,image/png" onChange={(e) => addFiles(e.target.files)}
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400 cursor-pointer" />
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-300">Files to Merge ({files.length}):</h3>
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between bg-slate-900/60 p-3 rounded-lg border border-white/5">
                  <span className="text-sm truncate">{i + 1}. {f.name} <span className="text-slate-500">({(f.size / 1024 / 1024).toFixed(2)} MB)</span></span>
                  <button onClick={() => removeFile(i)} className="text-red-400 hover:text-red-300 text-xs font-bold">REMOVE</button>
                </div>
              ))}
            </div>
          )}

          <button onClick={merge} disabled={busy || files.length < 2} className="w-full rounded-xl bg-cyan-500 px-6 py-4 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition">
            {busy ? "Merging Documents..." : "Merge & Download Master PDF"}
          </button>
        </div>
      </div>
    </main>
  );
}
