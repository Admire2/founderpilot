"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export function useWallet() {
  const [email, setEmail] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const refresh = async (em: string) => { 
    if (!em.includes("@")) return; 
    console.log("[Wallet] Refreshing balance for:", em);
    try { 
      const r = await fetch("/api/credits?email=" + encodeURIComponent(em)); 
      const j = await r.json(); 
      console.log("[Wallet] New balance:", j.balance);
      setBalance(j.balance ?? 0); 
    } catch (e) { console.error("[Wallet] Refresh failed:", e); } 
  };
  useEffect(() => { 
    (async () => { 
      let em = ""; 
      try { 
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!); 
        const { data } = await sb.auth.getSession(); 
        em = (data.session && data.session.user && data.session.user.email) || ""; 
      } catch (e) {} 
      if (!em) { 
        try { em = localStorage.getItem("fp_wallet_email") || ""; } catch (e) {} 
      } 
      if (em) { setEmail(em); refresh(em); } 
    })(); 
  }, []);
  
  const spend = async (cost: number) => {
    console.log("[Wallet] Attempting to spend:", cost, "credits");
    if (!email.includes("@")) { 
      alert("Enter your wallet email in the top bar first."); 
      return false; 
    }
    try {
      console.log("[Wallet] Calling API with email:", email, "cost:", cost);
      const r = await fetch("/api/credits", { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ email: email, cost: cost }) 
      });
      if (!r.ok) { 
        const j = await r.json(); 
        console.error("[Wallet] API error:", j);
        alert(j.error || "Not enough credits - open Buy Credits to top up."); 
        return false; 
      }
      const j = await r.json();
      console.log("[Wallet] Success! New balance:", j.newBalance);
      setBalance(j.newBalance);
      window.dispatchEvent(new CustomEvent("wallet-updated", { detail: { balance: j.newBalance } }));
      try { localStorage.setItem("fp_wallet_email", email); } catch (e) {}
      return true;
    } catch (e) { 
      console.error("[Wallet] Network error:", e);
      alert("Network error - please try again."); 
      return false; 
    }
  };
  return { email, setEmail, balance, refresh, spend };
}