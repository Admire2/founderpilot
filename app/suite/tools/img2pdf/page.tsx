"use client";
import { useState } from "react";
import Link from "next/link";
import WalletBar from "@/components/WalletBar";
import { useWallet } from "@/components/useWallet";
import { PDFDocument } from "pdf-lib";

export default function Img2PdfPage() {
  const { spend } = useWallet();
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (files.length < 1 || busy) { alert("Pick at least 1 image."); return; }
    setBusy(true);
    try {
      const out = await PDFDocument.create();
      for (const f of files) {
        const buf = await f.arrayBuffer();
        const im = f.type === "image/png" ? await out.embedPng(buf) : await out.embedJpg(buf);
        const page = out.addPage([im.width, im.height]);
        page.drawImage(im, { x: 0, y: 0, width: im.width, height: im.height });
      }
      const bytes = await out.save();
      const ok = await spend(10);
      if (ok) { const blob = new Blob([bytes as any], { type: "application/pdf" }); const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "images.pdf"; a.click(); }
    } catch (e) { alert("Conversion failed - use JPG or PNG."); }
    setBusy(false);
  };
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <WalletBar />
      <div className="max-w-2xl mx-auto">
        <Link href="/suite" className="text-cyan-400 hover:underline text-sm">&larr; Back to Suite</Link>
        <h1 className="mt-4 text-3xl font-bold">JPG / PNG to PDF</h1>
        <p className="mt-2 text-sm text-slate-400">10 credits per conversion. Turn photos and scans into a clean PDF.</p>
        <input type="file" accept="image/jpeg,image/png" multiple onChange={(e) => setFiles(Array.from(e.target.files || []))} className="mt-6 w-full text-sm" />
        <button onClick={run} disabled={busy} className="mt-4 w-full rounded-xl bg-cyan-500 px-4 py-3 font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50">{busy ? "Converting..." : "Convert & Download (-10 credits)"}</button>
      </div>
    </main>
  );
}