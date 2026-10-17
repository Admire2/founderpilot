"use client";
import { useState } from "react";
import Link from "next/link";

const CATEGORIES = ["General question", "Pricing & plans", "Partner application", "Technical support", "Bug report", "Enterprise / custom", "Legal / privacy", "Press & media"];

export default function ContactPage() {
  const [f, setF] = useState({ name: "", email: "", category: "General question", subject: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!f.name || !f.email || !f.subject || !f.message) { alert("Please fill all fields"); return; }
    setBusy(true);
    try {
      // A. Save to Supabase (Your secure cloud database)
      await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      
      // B. Forward to your hidden personal email via FormSubmit.co
      const formData = new FormData();
      formData.append("name", f.name);
      formData.append("email", f.email);
      formData.append("category", f.category);
      formData.append("subject", f.subject);
      formData.append("message", f.message);
      formData.append("_subject", "FounderPilot Contact: " + f.subject);
      formData.append("_captcha", "false");
      
      // Forwarding to greatmind20@gmail.com
      await fetch("https://formsubmit.co/ajax/greatmind20@gmail.com", { method: "POST", body: formData });
      
      setDone(true); 
      setF({ name: "", email: "", category: "General question", subject: "", message: "" });
    } catch (e) { 
      alert("Network error - please try again later"); 
    }
    setBusy(false);
  };

  const inp = "w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-sm outline-none focus:border-cyan-400";

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/suite/engineering" className="text-cyan-400 hover:underline text-sm">&larr; Back to Suite</Link>
        <h1 className="mt-4 text-3xl font-bold">📬 Contact FounderPilot</h1>
        <p className="mt-2 text-sm text-slate-400">Questions, partnerships, bugs, enterprise - we read every message. Typical reply: under 24 hours.</p>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
            <p className="text-xs font-bold text-cyan-300">📧 How to reach us</p>
            <p className="mt-1 text-lg font-bold text-white">Use the form below</p>
            <p className="mt-1 text-xs text-slate-400">We read every message and reply within 24 hours. No public email (privacy-first).</p>
          </div>
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <p className="text-xs font-bold text-emerald-300">🤝 Partner applications</p>
            <Link href="/suite/maxi/partners" className="mt-1 block text-lg font-bold text-white hover:underline">Maxi Partners page</Link>
            <p className="mt-1 text-xs text-slate-400">Vendors, designers, techs - apply directly with credits.</p>
          </div>
        </div>

        {done ? (
          <div className="mt-6 rounded-xl border-2 border-emerald-400/40 bg-emerald-500/5 p-6 text-center">
            <p className="text-2xl">✅</p>
            <p className="mt-2 font-bold text-emerald-300">Message received!</p>
            <p className="mt-1 text-sm text-slate-400">We will reply within 24 hours. Check your inbox (and spam folder).</p>
            <button onClick={() => setDone(false)} className="mt-4 rounded-xl bg-emerald-500 px-4 py-2 font-bold text-slate-950 hover:bg-emerald-400">Send another message</button>
          </div>
        ) : (
          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-lg font-bold text-cyan-300">Send us a message</h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="Your name" className={inp} />
              <input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} type="email" placeholder="Your email" className={inp} />
              <select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })} className={inp + " md:col-span-2"}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} placeholder="Subject" className={inp + " md:col-span-2"} />
              <textarea value={f.message} onChange={(e) => setF({ ...f, message: e.target.value })} rows={6} placeholder="Your message..." className={inp + " md:col-span-2"} />
            </div>
            <button onClick={submit} disabled={busy} className="mt-4 w-full rounded-xl bg-cyan-500 px-4 py-3 font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50">{busy ? "Sending..." : "Send message"}</button>
          </div>
        )}
      </div>
    </main>
  );
}