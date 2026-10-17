"use client";
import WalletBar from "@/app/components/WalletBar";
import { useState, useRef } from "react";
import { jsPDF } from "jspdf";
import JSZip from "jszip";
import Link from "next/link";

const ALL_FORMATS = ["jpg","jpeg","png","webp","gif","bmp","svg","heic","tiff","raw","pdf","txt","md","rtf","log","csv","doc","docx","odt","pages","xls","xlsx","ods","numbers","ppt","pptx","key","html","epub","zip"];
const IMAGE_EXT = ["jpg", "jpeg", "png", "webp", "gif", "bmp", "svg", "heic", "tiff", "raw"];
const TEXT_EXT = ["txt", "md", "csv", "html", "rtf", "log"];

export default function ConverterPage() {
  const [from, setFrom] = useState("jpg");
  const [to, setTo] = useState("pdf");
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fromCat = IMAGE_EXT.includes(from) ? "img" : TEXT_EXT.includes(from) ? "txt" : "other";
  const accept = fromCat === "img" ? "image/*" : "." + from;

  const isSupported = 
    (fromCat === "img" && (to === "pdf" || ["jpg","png","webp"].includes(to))) ||
    (fromCat === "txt" && (to === "pdf" || ["jpg","png","webp","txt","md","csv"].includes(to)));

  function downloadBlob(blob: Blob, name: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async function reencode(file: File, fmt: string): Promise<Blob> {
    const url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
    const canvas = document.createElement("canvas");
    canvas.width = img.width; canvas.height = img.height;
    const ctx = canvas.getContext("2d")!;
    if (fmt !== "png") { ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
    ctx.drawImage(img, 0, 0);
    const mime = fmt === "png" ? "image/png" : fmt === "webp" ? "image/webp" : "image/jpeg";
    const blob = await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), mime, 0.92));
    URL.revokeObjectURL(url);
    return blob;
  }

  async function textToImageBlob(text: string, fmt: string): Promise<Blob> {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;
    const lines: string[] = [];
    for (const raw of text.split(/\r?\n/)) {
      if (raw.length === 0) { lines.push(""); continue; }
      for (let i = 0; i < raw.length; i += 90) lines.push(raw.slice(i, i + 90));
    }
    const lineH = 28; const pad = 60;
    canvas.width = 1200;
    canvas.height = Math.min(6000, pad * 2 + lines.length * lineH);
    ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#111111"; ctx.font = "20px Arial";
    lines.forEach((l, i) => ctx.fillText(l, pad, pad + i * lineH));
    const mime = fmt === "png" ? "image/png" : "image/jpeg";
    return new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), mime, 0.92));
  }

  const handleConvert = async () => {
    if (files.length === 0) return;
    if (!isSupported) {
      setMsg("." + from + " to ." + to + " is on the roadmap. Live today: Images & Text to PDF / JPG / PNG / WEBP. New engines ship monthly!");
      return;
    }
    setLoading(true); setMsg("");
    try {
      if (fromCat === "img" && to === "pdf") {
        const pdf = new jsPDF();
        for (let i = 0; i < files.length; i++) {
          const data = await new Promise<string>((resolve) => { const r = new FileReader(); r.onload = (e) => resolve(e.target?.result as string); r.readAsDataURL(files[i]); });
          if (i > 0) pdf.addPage();
          pdf.addImage(data, files[i].type === "image/png" ? "PNG" : "JPEG", 10, 10, 190, 0);
        }
        pdf.save("founderpilot-combined.pdf");
        setMsg("Success! " + files.length + " files combined into ONE PDF.");
      } else if (fromCat === "txt" && to === "pdf") {
        const doc = new jsPDF();
        for (let i = 0; i < files.length; i++) {
          if (i > 0) doc.addPage();
          const lines = doc.splitTextToSize(await files[i].text(), 180);
          let y = 20;
          for (const line of lines) { if (y > 280) { doc.addPage(); y = 20; } doc.text(line, 20, y); y += 7; }
        }
        doc.save("founderpilot-combined.pdf");
        setMsg("Success! " + files.length + " files combined into ONE PDF.");
      } else if (fromCat === "txt" && (to === "txt" || to === "md" || to === "csv")) {
        let combined = "";
        for (const f of files) combined += "===== " + f.name + " =====\n\n" + (await f.text()) + "\n\n";
        downloadBlob(new Blob([combined], { type: "text/plain" }), "founderpilot-combined." + to);
        setMsg("Success! " + files.length + " files merged into ONE ." + to + ".");
      } else if (["jpg","png","webp"].includes(to)) {
        const blobs: Blob[] = [];
        for (const f of files) {
          blobs.push(fromCat === "img" ? await reencode(f, to) : await textToImageBlob(await f.text(), to));
        }
        if (blobs.length === 1) { downloadBlob(blobs[0], "converted." + to); setMsg("Success! 1 file converted."); }
        else {
          const zip = new JSZip();
          blobs.forEach((b, i) => zip.file("converted-" + (i + 1) + "." + to, b));
          downloadBlob(await zip.generateAsync({ type: "blob" }), "founderpilot-converted.zip");
          setMsg("Success! " + files.length + " files packaged into ONE ZIP.");
        }
      }
    } catch (e) { setMsg("Something went wrong. Please try again."); }
    setLoading(false);
  };

  const selClass = "w-full rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-white outline-none focus:border-cyan-400 max-h-48";

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <WalletBar />

      <div className="max-w-2xl mx-auto">
        <Link href="/suite" className="text-cyan-400 hover:underline mb-6 inline-block">&larr; Back to Suite</Link>
        <h1 className="text-3xl font-bold mb-2">Universal Converter</h1>
        <p className="text-slate-400 mb-8">30 formats on both sides. Hold <span className="text-cyan-300 font-bold">Ctrl/Cmd</span> in the file picker to select and combine multiple files.</p>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Convert FROM</label>
              <select value={from} onChange={(e) => { setFrom(e.target.value); setFiles([]); }} className={selClass} size={6}>
                {ALL_FORMATS.map((o) => <option key={o} value={o}>.{o}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Convert TO</label>
              <select value={to} onChange={(e) => setTo(e.target.value)} className={selClass} size={6}>
                {ALL_FORMATS.map((o) => <option key={o} value={o}>.{o}</option>)}
              </select>
            </div>
          </div>

          <div className={`rounded-lg p-3 text-sm ${isSupported ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300" : "bg-yellow-500/10 border border-yellow-500/30 text-yellow-300"}`}>
            {isSupported 
              ? "✅ Live Engine: ."+from+" to ."+to+" is currently supported!" 
              : "⏳ Coming Next Month: ."+from+" to ."+to+". (Live today: Images & Text to PDF/JPG/PNG/WEBP)."}
          </div>

          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); if (e.dataTransfer.files) setFiles(Array.from(e.dataTransfer.files)); }}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${dragging ? "border-cyan-400 bg-cyan-500/10" : "border-white/20 hover:border-cyan-500/50"}`}
          >
            <input ref={fileInputRef} type="file" multiple accept={accept} onChange={(e) => { if (e.target.files) setFiles(Array.from(e.target.files)); }} className="hidden" />
            <p className="text-lg font-semibold text-slate-200">Click to upload or drag and drop</p>
            <p className="text-xs text-slate-500 mt-2">Hold <span className="font-bold text-cyan-300">Ctrl</span> or <span className="font-bold text-cyan-300">Cmd</span> to select many files.</p>
          </div>

          {files.length > 0 && (
            <p className="text-sm text-cyan-300 text-center">
              {files.length} file(s) selected.
              {to === "pdf" && " They will be combined into ONE PDF."}
              {to !== "pdf" && files.length > 1 && " They will be packaged into ONE ZIP."}
            </p>
          )}

          <button onClick={handleConvert} disabled={files.length === 0 || loading || !isSupported}
            className="w-full rounded-lg bg-cyan-500 px-6 py-3 text-lg font-semibold text-slate-950 hover:bg-cyan-400 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed transition">
            {loading ? "Converting & Combining..." : "Convert & Download"}
          </button>

          {msg && <p className={`text-sm text-center ${msg.startsWith("Success") ? "text-emerald-300" : "text-yellow-300"}`}>{msg}</p>}
        </div>
      </div>
    </main>
  );
}