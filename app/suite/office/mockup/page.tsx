"use client";
import { useState } from "react";
import Link from "next/link";
import WalletBar from "@/components/WalletBar";
import { downloadPdf } from "@/lib/pdf";
const PRESETS: Record<string, string> = { studio: "clean studio lighting, seamless backdrop", lifestyle: "candid lifestyle scene, natural light", festive: "festive celebration setting, warm bokeh", minimalist: "minimalist composition, soft shadows" };
export default function Mockup() {
  const [product, setProduct] = useState("");
  const [vibe, setVibe] = useState("");
  const [preset, setPreset] = useState("studio");
  const [out, setOut] = useState("");
  const [busy, setBusy] = useState(false);
  const [seed, setSeed] = useState(7);
  const emailOf = () => { let e = ""; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) { const j = JSON.parse(localStorage.getItem(k) || "null"); e = (j && j.user && j.user.email) || ""; if (e) break; } } } catch (err) {} return e; };
  const run = async () => { if (!product.trim()) return; setBusy(true); setOut(""); const r = await fetch("/api/karakata", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "mockup", email: emailOf(), brief: "PRODUCT: " + product + "\nVIBE: " + (vibe || PRESETS[preset]) }) }); const j = await r.json(); if (j.ok) { setOut(j.answer || ""); setSeed(Math.floor(Math.random() * 900) + 1); try { window.dispatchEvent(new Event("wallet-refresh")); } catch (e) {} } setBusy(false); };
  const img = (i: number, w: number, h: number) => "https://image.pollinations.ai/prompt/" + encodeURIComponent("professional product hero photo of " + product + " in " + (vibe || PRESETS[preset]) + ", variant " + i) + "?width=" + w + "&height=" + h + "&seed=" + (seed + i) + "&nologo=true";
  const publish = async (url: string) => { const price = window.prompt("Price (USD)?", "45"); if (!price) return; const cat = window.prompt("Category?", "Fashion & Clothing") || "Fashion & Clothing"; const r = await fetch("/api/karakata/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailOf(), title: product, category: cat, price_usd: Number(price), description: vibe || PRESETS[preset], image_url: url, lead_time_days: 7, season: "Everyday" }) }); const j = await r.json(); window.alert(j.ok ? "Published to your KaraKata storefront!" : (j.error || "Publish failed")); };
  const inp = "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm";
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <Link href="/suite/office" className="mb-3 inline-block text-sm font-bold text-cyan-400 hover:underline">← Office Suite</Link>
      <WalletBar />
      <h1 className="text-3xl font-bold text-cyan-300">🎨 Mockup & Scene Studio</h1>
      <p className="mt-1 text-sm text-slate-400">AI scene renders now + an open-3D-suite-ready brief after. We honour the free legends - we hand you the pipeline, not a replacement.</p>
      <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="text-[11px] font-bold text-slate-300">Product</p>
        <input value={product} onChange={(e) => setProduct(e.target.value)} className={"mt-1 " + inp} placeholder="Handmade leather tote bag..." />
        <p className="mt-3 text-[11px] font-bold text-slate-300">Vibe / scene</p>
        <input value={vibe} onChange={(e) => setVibe(e.target.value)} className={"mt-1 " + inp} placeholder="Lagos market morning, golden hour..." />
        <select value={preset} onChange={(e) => setPreset(e.target.value)} className={"mt-2 " + inp}><option value="studio">Preset: Studio</option><option value="lifestyle">Preset: Lifestyle</option><option value="festive">Preset: Festive</option><option value="minimalist">Preset: Minimalist</option></select>
        <button onClick={run} disabled={busy} className="mt-4 w-full rounded-lg bg-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50">{busy ? "Rendering brief..." : "Generate Scenes + 3D Brief (10 credits)"}</button>
      </div>
      {product && (
        <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i + "-" + seed} className="rounded-xl border border-white/10 bg-slate-900 p-2">
              <img src={img(i, 512, 512)} alt="" loading="lazy" className="aspect-square w-full rounded-lg object-cover" />
              <div className="mt-2 flex flex-wrap gap-1">
                <button onClick={() => window.open(img(i, 512, 512), "_blank")} className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-300">1:1</button>
                <button onClick={() => window.open(img(i, 512, 910), "_blank")} className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-300">9:16</button>
                <button onClick={() => window.open(img(i, 910, 512), "_blank")} className="rounded bg-slate-800 px-1.5 py-0.5 text-[9px] font-bold text-slate-300">16:9</button>
                <button onClick={() => publish(img(i, 512, 512))} className="ml-auto rounded bg-emerald-500 px-1.5 py-0.5 text-[9px] font-bold text-slate-950">Publish to KaraKata</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {out && (<div className="mt-5 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-5">
        <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">{out}</pre>
        <button onClick={() => downloadPdf("MOCKUP & SCENE STUDIO\nProduct: " + product + "\nVibe: " + vibe + "\n\n" + out, "mockup-brief.pdf")} className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950">Download PDF</button>
      </div>)}
    </main>
  );
}

