"use client";
import WalletBar from "@/components/WalletBar";
import { useState } from "react";
import Link from "next/link";

export default function PilotSignSolo() {
  const [name, setName] = useState("");
  const [sender, setSender] = useState("");
  const [signerName, setSignerName] = useState("");
  const [signer, setSigner] = useState("");
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
    if (!file || !sender || !signer || !name) { alert("Please fill all fields and upload a PDF."); return; }
    if (credits === null || credits < COST) { alert("Not enough credits."); return; }
    setLoading(true); setErrorMsg("");
    try {
      const uuid = typeof crypto !== "undefined" && (crypto as any).randomUUID ? (crypto as any).randomUUID() : String(Date.now());
      const path = uuid + ".pdf";
      const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
      const up = await fetch(sbUrl + "/storage/v1/object/contracts/" + path, { method: "POST", headers: { "Authorization": "Bearer " + sbKey, "apikey": sbKey, "Content-Type": "application/pdf", "x-upsert": "true" }, body: file });
      if (!up.ok) throw new Error("upload HTTP " + up.status);
      const parties = [{ name: signerName || signer, email: signer, role: "Sole Signer", color: "#2563eb", fields: [] }];
      const res = await fetch("/api/suite/pilotsign/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sender: sender, name: name, pdfPath: path, parties: parties, nextParty: 0 }) });
      const j = await res.json();
      if (j.ok) {
        const dr = await fetch("/api/credits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: sender, cost: COST }) });
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
        <h1 className="text-3xl font-bold mb-2">PilotSign Remote (One Signer)</h1>
        <p className="text-slate-400 mb-8">For leases, rentals, consents & purchases - only the receiver signs. You stay the initiator.</p>

        {!magicLink ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-8 space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium">Document Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Apartment Lease - Unit 4" className={inputClass} />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium">Your Email (Initiator - you do NOT sign)</label>
              <input type="email" value={sender} onChange={(e) => setSender(e.target.value)} onBlur={() => checkCredits(sender)} placeholder="you@company.com" className={inputClass} />
            </div>
            <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 space-y-3">
              <h3 className="text-xs font-bold text-blue-300">THE SIGNER (details as printed in the document)</h3>
              <input value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="Signer full name" className={inputClass} />
              <input type="email" value={signer} onChange={(e) => setSigner(e.target.value)} placeholder="Signer email" className={inputClass} />
            </div>
            {credits !== null && <div className={`rounded-lg p-3 text-sm font-bold text-center ${credits >= COST ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/30" : "bg-red-500/10 text-red-300 border border-red-500/30"}`}>💰 Balance: {credits} Credits</div>}
            <div>
              <label className="mb-2 block text-sm font-medium">Upload PDF (up to 50MB)</label>
              <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)} className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400 cursor-pointer" />
            </div>
            {errorMsg && <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-300 break-all">DEBUG: {errorMsg}</div>}
            <button onClick={send} disabled={loading || credits === null} className="w-full rounded-xl bg-cyan-500 px-6 py-4 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50">
              {loading ? "Uploading..." : "Generate Signing Link (-" + COST + " Credits)"}
            </button>
          </div>
        ) : (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 text-center space-y-6">
            <h2 className="text-2xl font-bold text-emerald-300">{emailSent ? "Sent! Pia is on it 🤖" : "Link Generated!"}</h2>
            <p className="text-slate-300">Only <span className="font-bold text-white">{signer}</span> needs to sign this document.</p>
            <p className="text-sm text-emerald-300">{emailSent ? "🤖 Pia already emailed the signer a clickable Review & Sign button." : "Automatic email unavailable - use the backup options below."}</p>
            <div className="bg-slate-900 p-4 rounded-lg border border-white/10 break-all text-cyan-300 text-sm">{magicLink}</div>
            <p className="text-xs text-slate-500">Backup sharing (optional):</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button onClick={() => navigator.clipboard.writeText(magicLink)} className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-slate-950 hover:bg-emerald-400">Copy Link</button>
              <a href={"https://wa.me/?text=" + encodeURIComponent("Signature required: " + name + " - " + magicLink)} target="_blank" rel="noopener noreferrer" className="rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-500 text-center">Send via WhatsApp</a>
              <a href={"mailto:" + signer + "?subject=Signature Required: " + name + "&body=Please sign this document: " + magicLink} className="rounded-xl bg-emerald-700 px-4 py-3 font-semibold text-white hover:bg-emerald-600 text-center">Email App</a>
            </div>
            <button onClick={() => setMagicLink("")} className="text-sm text-slate-400 hover:text-white underline">Send another document</button>
          </div>
        )}
      </div>
    </main>
  );
}