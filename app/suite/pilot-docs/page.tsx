"use client";
import WalletBar from "@/components/WalletBar";
import { useState } from "react";
import Link from "next/link";

export default function PilotVaultPage() {
  const [email, setEmail] = useState("");
  const [docs, setDocs] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);
  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  const load = async () => {
    if (!email.includes("@")) { alert("Enter the email you used as sender."); return; }
    const res = await fetch("/api/suite/pilotsign/list?email=" + encodeURIComponent(email));
    const j = await res.json();
    setDocs(j.docs || []);
    setLoaded(true);
  };

  const download = async (url: string, name: string) => {
    const res = await fetch(url, { headers: { "apikey": sbKey, "Authorization": "Bearer " + sbKey } });
    const blob = await res.blob();
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u; a.download = "signed-" + name + ".pdf";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const purge = async (id: string, path: string) => {
    if (!confirm("Permanently purge this document from the PilotSign vault? This cannot be undone.")) return;
    await fetch("/api/suite/pilotsign/purge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, path }) });
    setDocs(docs.filter(d => d.id !== id));
  };

  const inputClass = "w-full rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-white outline-none focus:border-cyan-400";

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <WalletBar />
      <div className="max-w-4xl mx-auto">
        <Link href="/suite" className="text-cyan-400 hover:underline mb-6 inline-block">&larr; Back to Suite</Link>
        <h1 className="text-3xl font-bold mb-2">PilotSign Agreements Vault</h1>
        <p className="text-slate-400 mb-4">Your secure, legally compliant archive of executed contracts.</p>
        
        <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-4 mb-8 flex items-start gap-3">
          <span className="text-xl">⚠️</span>
          <p className="text-sm text-yellow-200"><strong>Corporate Retention Policy:</strong> Completed documents are stored indefinitely. Unfinished drafts are automatically purged after 30 days. <strong>Always download and save a local PDF copy</strong> of your signed contracts for your personal archives.</p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 mb-8 flex gap-4">
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Your sender email" className={inputClass} />
          <button onClick={load} className="shrink-0 rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400">Load Agreements</button>
        </div>

        {loaded && docs.length === 0 && <p className="text-slate-500 text-center">No agreements found for this email.</p>}

        <div className="space-y-6">
          {docs.map((d) => (
            <div key={d.id} className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between gap-4 mb-3 flex-wrap">
                <h3 className="text-lg font-bold">{d.doc_name}</h3>
                <div className="flex gap-2">
                  {d.status === "signed" ? (
                    <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-3 py-1 rounded-full">COMPLETED (Kept Indefinitely)</span>
                  ) : (
                    <span className="bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 text-xs font-bold px-3 py-1 rounded-full">DRAFT (Auto-purge in &lt;30 days)</span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-400 mb-4">
                <p>Signer: <span className="text-slate-200">{d.signer_email}</span></p>
                <p>Sent: <span className="text-slate-200">{new Date(d.created_at).toLocaleString()}</span></p>
                {d.signed_at && <p>Signed: <span className="text-emerald-300">{new Date(d.signed_at).toLocaleString()}</span></p>}
                {d.signer_location && <p>Location: <span className="text-slate-200">{d.signer_location}</span></p>}
              </div>
              <div className="flex gap-3 flex-wrap">
                {d.status === "signed" ? (
                  <button onClick={() => download(d.pdf_url, d.doc_name)} className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-400">Download Local Copy</button>
                ) : (
                  <button onClick={() => navigator.clipboard.writeText(d.magic_link)} className="flex-1 rounded-lg bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600">Copy Pending Link</button>
                )}
                <button onClick={() => purge(d.id, d.pdf_path)} className="rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 px-4 py-2 text-sm font-semibold hover:bg-red-500/30">Purge</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}