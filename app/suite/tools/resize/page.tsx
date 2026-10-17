"use client";
import { useState } from "react";
import Link from "next/link";
import WalletBar from "@/components/WalletBar";
import { useWallet } from "@/components/useWallet";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";

export default function ResizePage() {
  const { spend } = useWallet();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [scaleMode, setScaleMode] = useState<"percent" | "exact">("percent");
  const [percent, setPercent] = useState(50);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [format, setFormat] = useState<"pdf" | "jpg">("pdf");

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const imageFiles = Array.from(newFiles).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => [...prev, ...imageFiles]);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const processJPG = async (file: File, targetW: number, targetH: number): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = targetW;
          canvas.height = targetH;
          const ctx = canvas.getContext("2d");
          if (!ctx) { reject("Canvas error"); return; }
          ctx.drawImage(img, 0, 0, targetW, targetH);
          canvas.toBlob((blob) => {
            if (blob) resolve(blob); else reject("Blob error");
          }, "image/jpeg", 0.92);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const process = async () => {
    console.log("[Resize] Starting process with", files.length, "files, format:", format);
    if (files.length < 1 || busy) { alert("Select at least 1 image."); return; }
    setBusy(true);
    
    console.log("[Resize] Attempting to spend 10 credits...");
    const ok = await spend(10);
    if (!ok) { 
      console.log("[Resize] Spend failed");
      setBusy(false); 
      return; 
    }
    console.log("[Resize] Spend successful, processing files...");
    
    try {
      if (format === "pdf") {
        console.log("[Resize] Creating PDF output");
        const out = await PDFDocument.create();
        for (const f of files) {
          const buf = await f.arrayBuffer();
          let img;
          if (f.type === "image/png") img = await out.embedPng(buf);
          else img = await out.embedJpg(buf);
          let targetW, targetH;
          if (scaleMode === "percent") { targetW = (img.width * percent) / 100; targetH = (img.height * percent) / 100; }
          else { targetW = width; targetH = height; }
          const page = out.addPage([targetW, targetH]);
          page.drawImage(img, { x: 0, y: 0, width: targetW, height: targetH });
        }
        const bytes = await out.save();
        const blob = new Blob([bytes as any], { type: "application/pdf" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = scaleMode === "percent" ? `resized-${percent}percent.pdf` : `resized-${width}x${height}.pdf`;
        a.click();
        console.log("[Resize] PDF downloaded");
      } else {
        console.log("[Resize] Creating JPG output");
        const zip = new JSZip();
        for (let i = 0; i < files.length; i++) {
          const f = files[i];
          const img = await createImageBitmap(f);
          let targetW, targetH;
          if (scaleMode === "percent") { targetW = (img.width * percent) / 100; targetH = (img.height * percent) / 100; }
          else { targetW = width; targetH = height; }
          const blob = await processJPG(f, targetW, targetH);
          const name = f.name.replace(/\.[^.]+$/, "") + "-resized.jpg";
          zip.file(name, blob);
        }
        const content = await zip.generateAsync({ type: "blob" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(content);
        a.download = scaleMode === "percent" ? `resized-${percent}percent.zip` : `resized-${width}x${height}.zip`;
        a.click();
        console.log("[Resize] JPG ZIP downloaded");
      }
    } catch (e) {
      console.error("[Resize] Processing error:", e);
      alert("Resize failed - check console for details.");
    }
    setBusy(false);
  };

  const input = "w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-400";
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <WalletBar />
      <div className="max-w-2xl mx-auto">
        <Link href="/suite" className="text-cyan-400 hover:underline text-sm">&larr; Back to Suite</Link>
        <h1 className="mt-4 text-3xl font-bold">Smart Image Resizer</h1>
        <p className="mt-2 text-sm text-slate-400">10 credits per operation. Upload images → resize → download as PDF or JPG.</p>
        
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
          className={"mt-6 rounded-xl border-2 border-dashed p-8 text-center transition-colors " + (dragOver ? "border-cyan-400 bg-cyan-500/10" : "border-white/20 bg-slate-900/50")}
        >
          <input type="file" accept="image/*" multiple onChange={(e) => handleFiles(e.target.files)} className="hidden" id="img-upload" />
          <label htmlFor="img-upload" className="cursor-pointer">
            <div className="text-4xl mb-2">🖼️</div>
            <p className="text-sm font-bold">Click to select images or drag them here</p>
            <p className="text-xs text-slate-500 mt-1">JPG, PNG, etc.</p>
          </label>
        </div>

        {files.length > 0 && (
          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs font-bold text-slate-300 mb-2">{files.length} image(s) selected:</p>
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

        <div className="mt-4 rounded-xl border-2 border-cyan-400/50 bg-cyan-500/5 p-4">
          <p className="text-sm font-bold mb-3 text-cyan-300">OUTPUT FORMAT:</p>
          <div className="flex gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" checked={format === "pdf"} onChange={() => setFormat("pdf")} className="accent-cyan-400 w-5 h-5" />
              <span className="text-sm font-bold">PDF</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="radio" checked={format === "jpg"} onChange={() => setFormat("jpg")} className="accent-cyan-400 w-5 h-5" />
              <span className="text-sm font-bold">JPG {files.length > 1 ? "(ZIP download)" : ""}</span>
            </label>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm font-bold mb-3">Resize Mode:</p>
          <div className="flex gap-4 mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={scaleMode === "percent"} onChange={() => setScaleMode("percent")} className="accent-cyan-400" />
              <span className="text-sm">Scale %</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="radio" checked={scaleMode === "exact"} onChange={() => setScaleMode("exact")} className="accent-cyan-400" />
              <span className="text-sm">Exact W x H</span>
            </label>
          </div>
          
          {scaleMode === "percent" ? (
            <div>
              <label className="text-xs text-slate-400">Scale: {percent}%</label>
              <input type="range" min="10" max="200" value={percent} onChange={(e) => setPercent(Number(e.target.value))} className="w-full accent-cyan-400" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400">Width (px)</label>
                <input type="number" value={width} onChange={(e) => setWidth(Number(e.target.value))} className={input} />
              </div>
              <div>
                <label className="text-xs text-slate-400">Height (px)</label>
                <input type="number" value={height} onChange={(e) => setHeight(Number(e.target.value))} className={input} />
              </div>
            </div>
          )}
        </div>

        <button onClick={process} disabled={busy} className="mt-4 w-full rounded-xl bg-cyan-500 px-4 py-3 font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50">{busy ? "Processing..." : `Resize & Download ${format.toUpperCase()} (-10 credits)`}</button>
      </div>
    </main>
  );
}