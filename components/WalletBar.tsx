"use client";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export default function WalletBar() {
  const pathname = usePathname();
  const isEngineering = pathname.includes("/suite/maxi") || pathname.includes("/suite/rivet") || pathname.includes("/suite/volt") || pathname.includes("/suite/terra") || pathname.includes("/suite/engineering");
  const [email, setEmail] = useState("");
  const [balance, setBalance] = useState<number | null>(null); const [split, setSplit] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);

  const refresh = async (em: string) => {
    if (!em.includes("@")) { setBalance(null); return; }
    try { const r = await fetch("/api/credits?email=" + encodeURIComponent(em)); const j = await r.json(); setBalance(typeof j.balance === "number" ? j.balance : 0); setSplit(typeof j.monthly === "number" ? (j.monthly + " monthly + " + j.pack + " pack") : ""); } catch (e) { setBalance(null); }
  };

  useEffect(() => {
    (async () => {
      let em = "";
      try { const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!); const { data } = await sb.auth.getSession(); em = (data.session && data.session.user && data.session.user.email) || ""; if (em) setLoggedIn(true); } catch (e) {}
      if (!em) { try { em = localStorage.getItem("fp_wallet_email") || ""; } catch (e) {} }
      if (em) { setEmail(em); refresh(em); }
    })();
  }, []);
  useEffect(() => { const handler = () => { if (email) refresh(email); }; window.addEventListener("wallet-updated", handler); return () => window.removeEventListener("wallet-updated", handler); }, [email]);

  const zero = balance !== null && balance <= 0;

  return (
    <div className={"sticky top-0 z-50 mb-6 border-b px-4 py-2 backdrop-blur " + (zero ? "bg-red-950/90 border-red-500/40" : "bg-slate-950/90 border-white/10")}>
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 text-xs md:text-sm">
        <span className="font-bold text-cyan-300">💳 Wallet:</span>
        {loggedIn ? <span className="rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs font-bold text-emerald-200">{email}</span> : <input value={email} onChange={(e) => setEmail(e.target.value)} onBlur={() => { try { localStorage.setItem("fp_wallet_email", email); } catch (e) {} refresh(email); }} placeholder="your email = your wallet" className="w-56 rounded border border-white/10 bg-slate-900 px-2 py-1 text-xs text-white outline-none focus:border-cyan-400" />}
        {loggedIn && <span className="text-emerald-300">✅ logged in</span>}
        {balance !== null && <span className={"font-bold " + (zero ? "text-red-300" : "text-emerald-300")}>💰 {balance} credits</span>}{split && <span className="text-[10px] text-slate-400">({split})</span>}
        <Link href={isEngineering ? "/buy" : "/suite/buy-credits"} className={"rounded px-3 py-1 font-bold " + (zero ? "bg-red-500 text-white" : "bg-cyan-500 text-slate-950")}>{zero ? "0 credits - Buy more" : "Buy Credits"}</Link>
        {!loggedIn && <Link href="/auth" className="text-slate-400 underline hover:text-white">Log in so credits follow you</Link>}
      </div>
    </div>
  );
}