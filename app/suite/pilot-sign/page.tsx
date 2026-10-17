"use client";
import WalletBar from "@/components/WalletBar";
import { useState } from "react";
import Link from "next/link";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

type Field = { page: number; pdfX: number; pdfY: number; xPct: number; yPct: number; w?: number; wp?: number };

export default function PilotSignDuo() {
  const [name, setName] = useState("");
  const [p1name, setP1name] = useState("");
  const [p1email, setP1email] = useState("");
  const [p2name, setP2name] = useState("");
  const [p2email, setP2email] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [magicLink, setMagicLink] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const COST = 10;

  const checkCredits = async (email: string) => {
    if (!email.includes("@")) return;
    try { const r = await fetch("/api/credits?email=" + encodeURIComponent(email)); const j = await r.json(); setCredits(j.balance); } catch (e) {}
  };

  const send = async () => {
    if (!file || !name || !p1email.includes("@") || !p2email.includes("@")) { alert("Fill the document name and both parties' emails, and upload the PDF."); return; }
    if (credits === null || credits < COST) { alert("Not enough credits."); return; }
    setLoading(true); setErrorMsg("");
    try {
      // ---- PIA SCANS THE DOCUMENT AND MATCHES NAMES TO BLOCKS ----
      const bytes = await file.arrayBuffer();
      const scan = await pdfjsLib.getDocument({ data: new Uint8Array(bytes.slice(0)) }).promise;
      const allItems: { page: number; str: string; x: number; y: number }[] = [];
      const anchors: (Field & { assigned: number })[] = [];
      for (let i = 1; i <= scan.numPages; i++) {
        const pg = await scan.getPage(i);
        const base = pg.getViewport({ scale: 1 });
        const tc = await pg.getTextContent();
        tc.items.forEach((it: any) => {
          const t = it.str || "";
          const tx = it.transform;
          allItems.push({ page: i, str: t, x: tx[4], y: tx[5] });
          if (/sign here|signature/i.test(t)) anchors.push({ page: i, pdfX: tx[4], pdfY: tx[5], xPct: tx[4] / base.width, yPct: (base.height - tx[5]) / base.height, w: Math.min(it.width || 95, 120), wp: Math.min(it.width || 95, 120) / base.width, assigned: -1 });
        });
      }
      const partyList: any[] = [
        { name: p1name || p1email, email: p1email, role: "Party 1 (Seller / Sender)", color: "#2563eb", fields: [] },
        { name: p2name || p2email, email: p2email, role: "Party 2 (Buyer / Receiver)", color: "#dc2626", fields: [] },
      ];
      partyList.forEach((p, pi) => {
        const key = ((String(p.name).trim().split(" ").pop() || String(p.name)) || "").toLowerCase();
        const em = String(p.email || "").toLowerCase();
        allItems.forEach((it) => {
          const s = it.str.toLowerCase();
          const hit = (key.length >= 3 && s.includes(key)) || (em.length > 3 && s.includes(em));
          if (hit) {
            let best = -1, bd = 1e9;
            anchors.forEach((a, ai) => { if (a.page === it.page && a.assigned === -1) { const d = Math.abs(a.pdfY - it.y); if (d < 160 && d < bd) { bd = d; best = ai; } } });
            if (best >= 0) anchors[best].assigned = pi;
          }
        });
      });
      let rr = 0;
      anchors.forEach((a) => { if (a.assigned === -1) { a.assigned = rr % 2; rr++; } });
      partyList.forEach((p, pi) => { p.fields = anchors.filter((a) => a.assigned === pi).map((a) => ({ page: a.page, pdfX: a.pdfX, pdfY: a.pdfY, xPct: a.xPct, yPct: a.yPct })); });

      // ---- UPLOAD + ROUTE ----
      const uuid = typeof crypto !== "undefined" && (crypto as any).randomUUID ? (crypto as any).randomUUID() : String(Date.now());
      const path = uuid + ".pdf";
      const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      const up = await fetch(sbUrl + "/storage/v1/object/contracts/" + path, { method: "POST", headers: { "Authorization": "Bearer " + sbKey, "apikey": sbKey, "Content-Type": "application/pdf", "x-upsert": "true" }, body: file });
      if (!up.ok) throw new Error("upload HTTP " + up.status);
      const res = await fetch("/api/suite/pilotsign/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sender: p1email, name: name, pdfPath: path, parties: partyList, nextParty: 0 }) });
      const j = await res.json();
      if (j.ok) {
        const dr = await fetch("/api/credits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: p1email, cost: COST }) });
        const dj = await dr.json();
        if (dj.newBalance !== undefined) setCredits(dj.newBalance);
        setMagicLink(j.link); setEmailSent(!!j.emailSent);
      } else { throw new Error("API: " + j.error); }
    } catch (e: any) { setErrorMsg(String(e && e.message ? e.message : e)); }
    setLoading(false);
  };

  const inputClass = "w-full rounded-xl border border-white/10 bg-slate-900/70 p-3 text-sm text-white outline-none focus:border-cyan-400";

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <WalletBar />
      <div className="max-w-2xl mx-auto">
        <Link href="/suite" className="text-cyan-400 hover:underline mb-6 inline-block">&larr; Back to Suite</Link>
        <h1 className="text-3xl font-bold mb-2">PilotSign Remote (Two Signers)</h1>
        <p className="text-slate-400 mb-8">Pia scans the contract, reads each party's printed name/email, and routes each signer to ONLY their own blocks.</p>

        {!magicLink ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">Document Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Real Estate Purchase - 2345 Lawrenceville Way" className={inputClass} />
            </div>
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-3">
              <h3 className="text-xs font-bold text-blue-300">PARTY 1 - SELLER / SENDER (signs first)</h3>
              <input value={p1name} onChange={(e) => setP1name(e.target.value)} placeholder="Full name EXACTLY as printed in the document" className={inputClass} />
              <input type="email" value={p1email} onChange={(e) => setP1email(e.target.value)} onBlur={() => checkCredits(p1email)} placeholder="Email" className={inputClass} />
            </div>
            <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-3">
              <h3 className="text-xs font-bold text-red-300">PARTY 2 - BUYER / RECEIVER (signs second)</h3>
              <input value={p2name} onChange={(e) => setP2name(e.target.value)} placeholder="Full name EXACTLY as printed in the document" className={inputClass} />
              <input type="email" value={p2email} onChange={(e) => setP2email(e.target.value)} placeholder="Email" className={inputClass} />
            </div>
            {credits !== null && <div className={`rounded-lg p-3 text-sm font-bold text-center ${credits >= COST ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30" : "bg-red-500/10 text-red-300 border border-red-500/30"}`}>💰 Balance: {credits} Credits</div>}
            <div>
              <label className="mb-2 block text-sm font-medium">Upload Contract PDF (up to 50MB)</label>
              <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400 cursor-pointer" />
            </div>
            {errorMsg && <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-300 break-all">DEBUG: {errorMsg}</div>}
            <button onClick={send} disabled={loading || credits === null} className="w-full rounded-xl bg-cyan-500 px-6 py-4 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50">
              {loading ? "Pia is scanning names & routing..." : "Scan, Route & Send (-" + COST + " Credits)"}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center space-y-6">
            <h2 className="text-2xl font-bold text-emerald-300">{emailSent ? "Routed! Pia is on it 🤖" : "Links Generated!"}</h2>
            <p className="text-sm text-emerald-300">{emailSent ? "Pia emailed Party 1 now. Party 2 is emailed automatically the moment Party 1 signs." : "Automatic email unavailable - copy the backup links below."}</p>
            <div className="space-y-3 text-left">
              <div className="rounded-xl border border-blue-500/30 bg-slate-900/60 p-4">
                <p className="text-sm font-bold text-blue-300">Party 1 (Seller): {p1name || p1email}</p>
                <button onClick={() => navigator.clipboard.writeText(magicLink + "?party=0")} className="text-xs text-cyan-300 underline">Copy Party 1 backup link</button>
              </div>
              <div className="rounded-xl border border-red-500/30 bg-slate-900/60 p-4">
                <p className="text-sm font-bold text-red-300">Party 2 (Buyer): {p2name || p2email}</p>
                <button onClick={() => navigator.clipboard.writeText(magicLink + "?party=1")} className="text-xs text-cyan-300 underline">Copy Party 2 backup link</button>
              </div>
            </div>
            <p className="text-xs text-slate-500">Backup sharing (optional):</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button onClick={() => navigator.clipboard.writeText(magicLink)} className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400">Copy Base Link</button>
              <a href={"https://wa.me/?text=" + encodeURIComponent("Signature required: " + name + " - " + magicLink)} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-500 text-center">Send via WhatsApp</a>
            </div>
            <button onClick={() => setMagicLink("")} className="text-sm text-slate-400 hover:text-white underline">Send another document</button>
          </div>
        )}
      </div>
    </main>
  );
}