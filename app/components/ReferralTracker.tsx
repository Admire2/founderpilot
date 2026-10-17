"use client";
import { useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

function getCookie(name: string) {
  const m = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return m ? decodeURIComponent(m[2]) : "";
}

export default function ReferralTracker() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      const expires = new Date();
      expires.setTime(expires.getTime() + 30 * 24 * 60 * 60 * 1000);
      document.cookie = "fp_ref=" + ref + ";expires=" + expires.toUTCString() + ";path=/";
      console.log("🤝 Referral code captured:", ref);
    }

    const claim = async () => {
      const code = getCookie("fp_ref");
      if (!code) return;
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email;
      if (!email) return;
      try {
        const r = await fetch("/api/affiliate/claim", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code })
        });
        const j = await r.json();
        if (j.ok) console.log("🤝 Referral claimed for", email, j.already ? "(already recorded)" : "(NEW!)");
      } catch (e) {}
    };
    claim();
  }, []);
  return null;
}