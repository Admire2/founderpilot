"use client";
import WalletBar from "@/components/WalletBar";
import { useState, useRef } from "react";
import Link from "next/link";

export default function ImageResizerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [origW, setOrigW] = useState(0);
  const [origH, setOrigH] = useState(0);
  const [mode, setMode] = useState<"dimensions" | "scale">("dimensions");
  const [targetW, setTargetW] = useState(0);
  const [targetH, setTargetH] = useState(0);
  const [scale, setScale] = useState(100);
  const [lockRatio, setLockRatio] = useState(true);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f); setResultUrl(null);
    const url = URL.createObjectURL(f);
    const img = new Image();
    img.onload = () => {
      setOrigW(img.width); setOrigH(img.height);
      setTargetW(img.width); setTargetH(img.height);
      imgRef.current = img;
    };
    img.src = url;
  };

  const updateW = (w: number) => {
    setTargetW(w);
    if (lockRatio && origW > 0) setTargetH(Math.round((w / origW) * origH));
  };
  const updateH = (h: number) => {
    setTargetH(h);
    if (lockRatio && origH > 0) setTargetW(Math.round((h / origH) * origW));
  };
  const updateScale = (s: number) => {
    setScale(s);
    setTargetW(Math.round(origW * (s / 100)));
    setTargetH(Math.round(origH * (s / 100)));
  };

  const process = () => {
    if (!imgRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = targetW; canvas.height = targetH;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(imgRef.current, 0, 0, targetW, targetH);
    canvas.toBlob((blob) => {
      if (blob) setResultUrl(URL.createObjectURL(blob));
    }, file?.type || "image/jpeg", 0.95);
  };

  const inputClass = "w-full rounded-xl border border-white/10 bg-slate-900/70 p-3 text-sm text-white outline-none focus:border-cyan-400";

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <WalletBar />

      <div className="max-w-3xl mx-auto">
        <Link href="/suite" className="text-cyan-400 hover:underline mb-6 inline-block">&larr; Back to Suite</Link>
        <h1 className="text-3xl font-bold mb-2">Smart Image Resizer</h1>
        <p className="text-slate-400 mb-8">Increase or reduce pixels. Set exact dimensions (W x H) or scale by percentage. 100% private, processed in your browser.</p>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 space-y-6">
          <input type="file" accept="image/*" onChange={handleFile} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400 cursor-pointer" />
          
          {origW > 0 && (
            <>
              <p className="text-sm text-slate-400">Original Size: <span className="text-cyan-300 font-bold">{origW} x {origH} px</span></p>
              
              <div className="flex gap-4">
                <button onClick={() => setMode("dimensions")} className={`flex-1 rounded-lg py-2 text-sm font-semibold ${mode === "dimensions" ? "bg-cyan-500 text-slate-950" : "bg-white/5 text-slate-300"}`}>Exact Dimensions</button>
                <button onClick={() => setMode("scale")} className={`flex-1 rounded-lg py-2 text-sm font-semibold ${mode === "scale" ? "bg-cyan-500 text-slate-950" : "bg-white/5 text-slate-300"}`}>Scale %</button>
              </div>

              {mode === "dimensions" ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">Width (px)</label>
                    <input type="number" value={targetW} onChange={(e) => updateW(Number(e.target.value))} className={inputClass} />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs text-slate-400">Height (px)</label>
                    <input type="number" value={targetH} onChange={(e) => updateH(Number(e.target.value))} className={inputClass} />
                  </div>
                  <label className="col-span-2 flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input type="checkbox" checked={lockRatio} onChange={(e) => setLockRatio(e.target.checked)} className="accent-cyan-500" />
                    Lock Aspect Ratio
                  </label>
                </div>
              ) : (
                <div>
                  <label className="mb-2 block text-sm font-medium">Scale: <span className="text-cyan-300 font-bold">{scale}%</span> {scale > 100 ? "(Enlarging)" : scale < 100 ? "(Reducing)" : "(Original)"}</label>
                  <input type="range" min={10} max={300} step={5} value={scale} onChange={(e) => updateScale(Number(e.target.value))} className="w-full accent-cyan-500" />
                </div>
              )}

              <button onClick={process} className="w-full rounded-xl bg-cyan-500 px-6 py-4 font-semibold text-slate-950 hover:bg-cyan-400 transition">
                Resize to {targetW} x {targetH} px
              </button>
            </>
          )}
        </div>

        {resultUrl && (
          <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
            <h2 className="text-xl font-bold text-emerald-300 mb-4">Resized Image Ready!</h2>
            <img src={resultUrl} alt="Resized" className="max-h-64 mx-auto mb-4 rounded-lg border border-white/10" />
            <a href={resultUrl} download={`resized-${file?.name}`} className="inline-block rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-400">Download Image</a>
          </div>
        )}
      </div>
    </main>
  );
}
