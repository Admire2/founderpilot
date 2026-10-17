"use client";
import WalletBar from "@/app/components/WalletBar";
import { useState } from "react";
import QRCode from "qrcode";
import Link from "next/link";

export default function QRGeneratorPage() {
  const [text, setText] = useState("https://founderpilot-theta.vercel.app");
  const [url, setUrl] = useState("");

  const generate = async () => {
    if (!text) return;
    const u = await QRCode.toDataURL(text, { width: 500, margin: 2, color: { dark: "#000000", light: "#ffffff" } });
    setUrl(u);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <WalletBar />

      <div className="max-w-2xl mx-auto">
        <Link href="/suite" className="text-cyan-400 hover:underline mb-6 inline-block">&larr; Back to Suite</Link>
        <h1 className="text-3xl font-bold mb-2">QR Code Generator</h1>
        <p className="text-slate-400 mb-8">Create high-quality QR codes for URLs, Wi-Fi, or text instantly.</p>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 space-y-6">
          <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Enter URL or text..." className="w-full rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-white outline-none focus:border-cyan-400 min-h-[100px]" />
          <button onClick={generate} className="w-full rounded-xl bg-cyan-500 px-6 py-4 font-semibold text-slate-950 hover:bg-cyan-400">Generate QR Code</button>
        </div>

        {url && (
          <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
            <img src={url} alt="QR" className="mx-auto mb-4 bg-white p-4 rounded-xl" style={{width: "250px", height: "250px"}} />
            <a href={url} download="founderpilot-qr.png" className="inline-block rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-400">Download PNG</a>
          </div>
        )}
      </div>
    </main>
  );
}