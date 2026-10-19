"use client";
import WalletBar from "@/components/WalletBar";
import { useState } from "react";
import JSZip from "jszip";
import Link from "next/link";

type Result = { name: string; orig: number; size: number; url: string };

function fmtSize(b: number) {
  if (b > 1048576) return (b / 1048576).toFixed(2) + " MB";
  return Math.round(b / 1024) + " KB";
}

export default function ImageToolPage() {
  const [mode, setMode] = useState<"compress" | "enlarge">("compress");
  const [files, setFiles] = useState<File[]>([]);
  const [quality, setQuality] = useState(60);
  const [scale, setScale] = useState(2);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);

  const handleProcess = async () => {
    if (files.length === 0) return;
    setLoading(true);
    const out: Result[] = [];
    for (const file of files) {
      const url0 = URL.createObjectURL(file);
      const img = new Image();
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url0; });
      
      const canvas = document.createElement("canvas");
      if (mode === "compress") {
        const maxDim = 1920;
        const s = Math.min(1, maxDim / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * s);
        canvas.height = Math.round(img.height * s);
      } else {
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;
      }
      
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      
      const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/jpeg", mode === "compress" ? quality / 100 : 0.95));
      URL.revokeObjectURL(url0);
      
      const prefix = mode === "compress" ? "compressed" : "enlarged-" + scale + "x";
      out.push({ name: file.name.replace(/\.[^.]+$/, "") + "-" + prefix + ".jpg", orig: file.size, size: blob.size, url: URL.createObjectURL(blob) });
    }
    setResults(out);
    setLoading(false);
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    for (const r of results) zip.file(r.name, await (await fetch(r.url)).blob());
    const z = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(z);
    const a = document.createElement("a");
    a.href = url; a.download = "founderpilot-" + mode + ".zip";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <WalletBar />

      <div className="max-w-2xl mx-auto">
        <Link href="/suite" className="text-cyan-400 hover:underline mb-6 inline-block">&larr; Back to Suite</Link>
        <h1 className="text-3xl font-bold mb-2">Smart Compress & Enlarge</h1>
        <p className="text-slate-400 mb-8">Shrink file size for the web, or enlarge images for print and posters.</p>

        <div className="flex gap-4 mb-6">
          <button onClick={() => setMode("compress")} className={`flex-1 rounded-xl py-3 font-semibold transition ${mode === "compress" ? "bg-cyan-500 text-slate-950" : "bg-white/5 text-slate-300 border border-white/10"}`}>Compress (Shrink Size)</button>
          <button onClick={() => setMode("enlarge")} className={`flex-1 rounded-xl py-3 font-semibold transition ${mode === "enlarge" ? "bg-cyan-500 text-slate-950" : "bg-white/5 text-slate-300 border border-white/10"}`}>Enlarge (Upscale)</button>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 space-y-6">
          <input type="file" multiple accept="image/*" onChange={(e) => { setFiles(Array.from(e.target.files || [])); setResults([]); }}
            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400 cursor-pointer" />

          {mode === "compress" ? (
            <div>
              <label className="mb-2 block text-sm font-medium">Quality: <span className="text-cyan-300 font-bold">{quality}%</span> <span className="text-slate-500">(lower = smaller file)</span></label>
              <input type="range" min={10} max={90} step={5} value={quality} onChange={(e) => setQuality(Number(e.target.value))} className="w-full accent-cyan-500" />
            </div>
          ) : (
            <div>
              <label className="mb-2 block text-sm font-medium">Enlarge by: <span className="text-cyan-300 font-bold">{scale}x</span></label>
              <input type="range" min={1.5} max={4} step={0.5} value={scale} onChange={(e) => setScale(Number(e.target.value))} className="w-full accent-cyan-500" />
            </div>
          )}

          <button onClick={handleProcess} disabled={files.length === 0 || loading}
            className="w-full rounded-lg bg-cyan-500 px-6 py-3 text-lg font-semibold text-slate-950 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed transition">
            {loading ? "Processing..." : mode === "compress" ? "Compress Images" : "Enlarge Images"}
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-8 space-y-4">
            <h2 className="text-xl font-bold text-emerald-300">Your files are ready</h2>
            {results.map((r, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-sm">{r.name}</p>
                  <p className="text-xs text-slate-400">
                    {mode === "compress" 
                      ? <>{fmtSize(r.orig)} → <span className="text-emerald-300 font-bold">{fmtSize(r.size)}</span> ({Math.max(0, Math.round((1 - r.size / r.orig) * 100))}% smaller)</>
                      : <>Original: {fmtSize(r.orig)} → New: <span className="text-emerald-300 font-bold">{fmtSize(r.size)}</span></>
                    }
                  </p>
                </div>
                <a href={r.url} download={r.name} className="shrink-0 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400">Download</a>
              </div>
            ))}
            {results.length > 1 && <button onClick={downloadAll} className="w-full rounded-lg bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400">Download All as ZIP</button>}
          </div>
        )}
      </div>
    </main>
  );
}
