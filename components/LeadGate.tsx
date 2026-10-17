"use client";
import { useEffect, useState } from "react";

export default function LeadGate() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.location.pathname.startsWith("/suite")) return;
    if (!localStorage.getItem("fp_lead_email")) setOpen(true);
  }, []);

  const deviceId = () => {
    const raw = [navigator.userAgent, navigator.language, screen.width + "x" + screen.height, Intl.DateTimeFormat().resolvedOptions().timeZone, navigator.platform].join("|");
    let h = 0;
    for (let i = 0; i < raw.length; i++) { h = ((h << 5) - h + raw.charCodeAt(i)) | 0; }
    return "dev-" + Math.abs(h).toString(36);
  };

  const unlock = async () => {
    if (!email.includes("@")) { alert("Please enter a valid email to unlock your 20 free credits."); return; }
    setBusy(true);
    const dev = deviceId();
    try {
      await fetch("/api/leads", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email, device_id: dev, tool: "suite-gate", meta: navigator.userAgent }) });
      await fetch("/api/credits?email=" + encodeURIComponent(email));
      localStorage.setItem("fp_lead_email", email);
      localStorage.setItem("fp_lead_device", dev);
      setOpen(false);
    } catch (e) {}
    setBusy(false);
  };

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="max-w-md w-full rounded-2xl border border-cyan-500/30 bg-slate-900 p-8 text-white">
        <h2 className="text-2xl font-bold mb-2">🎁 Unlock your 20 free credits</h2>
        <p className="text-sm text-slate-400 mb-6">Enter your email to unlock downloads, PilotSign sending and every Business Suite tool. 20 credits are added instantly - no card required.</p>
        <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="you@company.com" className="w-full rounded-xl border border-white/10 bg-slate-950 p-4 text-sm outline-none focus:border-cyan-400 mb-4" />
        <button onClick={unlock} disabled={busy} className="w-full rounded-xl bg-cyan-500 px-6 py-4 font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-50">
          {busy ? "Unlocking..." : "Unlock Free Credits & Downloads"}
        </button>
        <p className="mt-3 text-[11px] text-slate-500">Your device is securely linked to your account to protect your credits.</p>
      </div>
    </div>
  );
}