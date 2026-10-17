"use client";
import { useState } from "react";
export default function SellerRelay() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [state, setState] = useState("");
  const pid = typeof window !== "undefined" ? (window.location.pathname.split("/karakata/p/")[1] || "").split("?")[0] : "";
  const send = async () => {
    if (!name || !email || !msg) { setState("Fill your name, email and message."); return; }
    setState("Sending...");
    try {
      const r = await fetch("/api/karakata/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pid: pid, name: name, email: email, message: msg }) });
      const j = await r.json();
      if (j.ok) { setState("Message relayed. The seller replies through KaraKata - your direct contacts stay private."); setMsg(""); }
      else setState(j.error || "Relay failed - try again.");
    } catch (e) { setState("Network error - try again."); }
  };
  const inp = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";
  return (
    <div className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50 p-5">
      <p className="text-sm font-bold text-emerald-800">❓ Ask the seller about this item</p>
      <p className="mt-1 text-[11px] text-emerald-700">KaraKata relays every message. Phone numbers and emails are never shared - buyers stay scam-proof, sellers stay harassment-proof, disputes stay on-platform.</p>
      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
        <input value={name} onChange={(e) => setName(e.target.value)} className={inp} placeholder="Your name" />
        <input value={email} onChange={(e) => setEmail(e.target.value)} className={inp} placeholder="Your email" />
      </div>
      <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={3} className={inp + " mt-2"} placeholder="Question about size, materials, delivery, warranty..." />
      <button onClick={send} className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-500">Send via KaraKata relay</button>
      {state && (<p className="mt-2 text-xs font-bold text-emerald-800">{state}</p>)}
    </div>
  );
}
