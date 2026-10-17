"use client";
import WalletBar from "@/app/components/WalletBar";
import { useState, useRef, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import Link from "next/link";

export default function ESignPage() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [busy, setBusy] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#111111";
  }, []);

  const getPos = (e: React.PointerEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: ((e.clientX - rect.left) / rect.width) * canvas.width, y: ((e.clientY - rect.top) / rect.height) * canvas.height };
  };

  const onDown = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as Element).setPointerCapture(e.pointerId);
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = getPos(e);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    setDrawing(true);
    setHasSignature(true);
  };

  const onMove = (e: React.PointerEvent) => {
    if (!drawing) return;
    const ctx = canvasRef.current!.getContext("2d")!;
    const p = getPos(e);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  };

  const onUp = () => setDrawing(false);

  const clearSig = () => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const sign = async () => {
    if (!pdfFile) { alert("Please upload a PDF first."); return; }
    if (!hasSignature) { alert("Please draw your signature first."); return; }
    setBusy(true);
    try {
      const bytes = await pdfFile.arrayBuffer();
      const pdf = await PDFDocument.load(bytes);
      const pngBytes = await (await fetch(canvasRef.current!.toDataURL("image/png"))).arrayBuffer();
      const png = await pdf.embedPng(pngBytes);
      const pages = pdf.getPages();
      const page = pages[pages.length - 1];
      const { width } = page.getSize();
      const sigW = 200;
      const sigH = sigW * (200 / 500);
      page.drawImage(png, { x: width - sigW - 40, y: 40, width: sigW, height: sigH });
      
      const out = await pdf.save();
      // TypeScript fix: cast the Uint8Array to BlobPart so Next.js 16 accepts it
      const blob = new Blob([out as unknown as BlobPart], { type: "application/pdf" });
      setSignedUrl(URL.createObjectURL(blob));
    } catch (e) {
      alert("Could not sign this PDF. Make sure it is not password-protected.");
    }
    setBusy(false);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <WalletBar />

      <div className="max-w-3xl mx-auto">
        <Link href="/suite" className="text-cyan-400 hover:underline mb-6 inline-block">&larr; Back to Suite</Link>
        <h1 className="text-3xl font-bold mb-2">E-Sign Documents</h1>
        <p className="text-slate-400 mb-8">Upload a PDF, draw your signature (mouse or finger), and it is stamped onto the last page. 100% private - nothing leaves your device.</p>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium">1. Upload your PDF</label>
            <input type="file" accept="application/pdf" onChange={(e) => { setPdfFile(e.target.files ? e.target.files[0] : null); setSignedUrl(null); }}
              className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400 cursor-pointer" />
            {pdfFile && <p className="mt-2 text-sm text-cyan-300">Selected: {pdfFile.name}</p>}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium">2. Draw your signature below</label>
            <canvas
              ref={canvasRef}
              width={500}
              height={200}
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
              onPointerLeave={onUp}
              className="w-full rounded-xl bg-white border-2 border-dashed border-white/20 touch-none cursor-crosshair"
            />
            <button onClick={clearSig} className="mt-2 text-xs text-slate-400 hover:text-white underline">Clear signature</button>
          </div>

          <button onClick={sign} disabled={busy} className="w-full rounded-xl bg-cyan-500 px-6 py-4 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 transition">
            {busy ? "Signing..." : "3. Sign & Download PDF"}
          </button>
        </div>

        {signedUrl && (
          <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
            <h2 className="text-xl font-bold text-emerald-300 mb-4">Signed Document Ready!</h2>
            <a href={signedUrl} download={"signed-" + (pdfFile ? pdfFile.name : "document.pdf")} className="inline-block rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-400">Download Signed PDF</a>
          </div>
        )}
      </div>
    </main>
  );
}