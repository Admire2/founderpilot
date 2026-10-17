"use client";
import { useState } from "react";
import Link from "next/link";
import WalletBar from "@/components/WalletBar";
import { useWallet } from "@/components/useWallet";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

type Row = { name: string; domain: string; status: "checking" | "available" | "taken" | "unknown" };

export default function NameCreatorPage() {
  const { spend } = useWallet();
  const [desc, setDesc] = useState("");
  const [industry, setIndustry] = useState("");
  const [audience, setAudience] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);

  const checkDomain = async (raw: string): Promise<Row> => {
    const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, "");
    const domain = clean + ".com";
    try {
      const r = await fetch("https://dns.google/resolve?name=" + domain + "&type=A");
      const j = await r.json();
      return { name: raw, domain: domain, status: j.Status === 3 ? "available" : "taken" };
    } catch (e) {
      return { name: raw, domain: domain, status: "unknown" };
    }
  };

  const generate = async () => {
    if (!desc.trim() || busy) { alert("Describe your business first"); return; }
    setBusy(true);
    setRows([]);
    try {
      const r = await fetch("/api/name-creator", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ desc: desc, industry: industry, audience: audience }) });
      const j = await r.json();
      const names: string[] = (j.names || []).slice(0, 10);
      setRows(names.map((n) => ({ name: n, domain: "", status: "checking" as any })));
      const checked = await Promise.all(names.map(checkDomain));
      setRows(checked);
    } catch (e) { alert("Could not generate names - try again"); }
    setBusy(false);
  };

  const downloadReport = async () => {
    if (rows.length === 0) return;
    const ok = await spend(10);
    if (!ok) return;
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const pg = doc.addPage([595.28, 841.89]);
    const lines = [
      "FounderPilot Name Creator Report",
      "Generated: " + new Date().toLocaleString(),
      "",
      "Business: " + desc,
      "Industry: " + (industry || "-"),
      "Audience: " + (audience || "-"),
      "",
      "Names + Domain Status:",
    ].concat(rows.map((r, i) => (i + 1) + ". " + r.name + "  |  " + r.domain + "  |  " + r.status.toUpperCase())).concat(["", "Powered by FounderPilot"]);
    let y = 800;
    for (const ln of lines) {
      pg.drawText(ln, { x: 50, y: y, size: y > 790 ? 16 : 10, font: font, color: rgb(0.1, 0.1, 0.1) });
      y -= ln === "" ? 10 : 18;
    }
    const bytes = await doc.save();
    const blob = new Blob([bytes as any], { type: "application/pdf" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "founderpilot-brand-report.pdf";
    a.click();
  };

  const chip = (s: Row["status"]) =>
    s === "available" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" :
    s === "taken" ? "bg-red-500/10 text-red-300 border-red-500/30" :
    s === "checking" ? "bg-white/5 text-slate-400 border-white/10" :
    "bg-white/5 text-slate-400 border-white/10";

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <WalletBar />
      <div className="max-w-3xl mx-auto">
        <Link href="/suite" className="text-cyan-400 hover:underline text-sm">&larr; Back to Suite</Link>
        <h1 className="mt-4 text-3xl font-bold">Name Creator</h1>
        <p className="mt-2 text-sm text-slate-400">AI brand names with LIVE domain availability checks. Preview free - full report 10 credits.</p>

        <div className="mt-6 space-y-4">
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} placeholder="Describe your business (e.g., AI assisted bus transport)" className="w-full rounded-xl border border-white/10 bg-slate-900 p-4 text-sm outline-none focus:border-cyan-400" />
          <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Industry (optional, e.g., SaaS, food, fashion)" className="w-full rounded-xl border border-white/10 bg-slate-900 p-4 text-sm outline-none focus:border-cyan-400" />
          <input value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Target audience (optional, e.g., millennials, B2B)" className="w-full rounded-xl border border-white/10 bg-slate-900 p-4 text-sm outline-none focus:border-cyan-400" />
          <button onClick={generate} disabled={busy} className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50">{busy ? "Generating + checking domains..." : "Generate Names + Check Domains (free)"}</button>
        </div>

        {rows.length > 0 && (
          <div className="mt-6 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6">
            <h3 className="text-lg font-bold text-emerald-300 mb-4">Names + Domain Status:</h3>
            <ul className="space-y-2">
              {rows.map((r, idx) => (
                <li key={idx} className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900 px-4 py-2 text-sm">
                  <span className="font-bold text-cyan-300">{r.name}</span>
                  <span className="text-xs text-slate-400">{r.domain}</span>
                  <span className={"rounded-full border px-2 py-0.5 text-[10px] font-bold " + chip(r.status)}>{r.status === "checking" ? "CHECKING..." : r.status.toUpperCase()}</span>
                </li>
              ))}
            </ul>
            <button onClick={downloadReport} className="mt-4 w-full rounded-xl bg-emerald-500 px-4 py-3 font-bold text-slate-950 hover:bg-emerald-400">Download Full Report (-10 credits)</button>
          </div>
        )}
      </div>
    </main>
  );
}