"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function AffiliateWidget() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [aff, setAff] = useState<any>(null);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data } = await supabase.from("affiliates").select("*").eq("email", session.user.email).limit(1);
        if (data && data.length > 0) setAff(data[0]);
      }
    })();
  }, []);

  const join = async () => {
    const code = user.email.split("@")[0].replace(/[^a-z0-9]/gi, "-").toLowerCase();
    const m = document.cookie.match(/(^| )fp_ref=([^;]+)/);
    const ref = m ? decodeURIComponent(m[2]) : "";
    let parent: any = null;
    if (ref) {
      const { data } = await supabase.from("affiliates").select("affiliate_code").eq("affiliate_code", ref).limit(1);
      if (data && data.length > 0) parent = ref;
    }
    const etNow = new Date().toLocaleString("en-US", { timeZone: "America/New_York", hour12: false });
    const { error } = await supabase.from("affiliates").insert({ email: user.email, affiliate_code: code, commission_rate: 20, parent_code: parent, created_at_et: etNow });
    if (!error) { const { data } = await supabase.from("affiliates").select("*").eq("email", user.email).limit(1); setAff(data?.[0] || null); }
    else alert(error.message);
  };

  const copy = () => { navigator.clipboard.writeText(origin + "/?ref=" + aff.affiliate_code); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  return (
    <div style={{ position: "fixed", bottom: 16, right: 16, zIndex: 999, fontFamily: "sans-serif" }}>
      {open && (
        <div style={{ background: "#0f172a", border: "1px solid #d946ef55", borderRadius: 12, padding: 16, width: 300, marginBottom: 8, color: "#fff", boxShadow: "0 8px 30px #0008" }}>
          <h4 style={{ margin: "0 0 8px", color: "#f0abfc" }}>🤝 Earn with FounderPilot</h4>
          {!user && <p style={{ fontSize: 13, color: "#94a3b8" }}>Sign in to get your referral link and earn 20% per paid client.</p>}
          {!user && <a href="/auth" style={{ display: "block", textAlign: "center", background: "#c026d3", color: "#fff", padding: 8, borderRadius: 8, textDecoration: "none", fontWeight: 700 }}>Sign in / Sign up</a>}
          {user && !aff && <p style={{ fontSize: 13, color: "#94a3b8" }}>Join free. If someone invited you (link), you automatically join under them.</p>}
          {user && !aff && <button onClick={join} style={{ width: "100%", background: "#c026d3", color: "#fff", padding: 8, borderRadius: 8, border: 0, fontWeight: 700, cursor: "pointer" }}>Become an Affiliate</button>}
          {aff && (
            <>
              <div style={{ display: "flex", gap: 6 }}>
                <input readOnly value={origin + "/?ref=" + aff.affiliate_code} style={{ flex: 1, background: "#1e293b", border: 0, color: "#fff", padding: 6, borderRadius: 6, fontSize: 11 }} />
                <button onClick={copy} style={{ background: "#c026d3", color: "#fff", border: 0, borderRadius: 6, padding: "6px 10px", cursor: "pointer", fontWeight: 700 }}>{copied ? "✅" : "Copy"}</button>
              </div>
              <p style={{ fontSize: 12, color: "#34d399", margin: "8px 0 4px" }}>Earned: ${Number(aff.total_earned || 0).toFixed(2)}</p>
              <a href="/affiliate" style={{ fontSize: 12, color: "#f0abfc" }}>Open full dashboard →</a>
            </>
          )}
        </div>
      )}
      <button onClick={() => setOpen(!open)} style={{ background: "#c026d3", color: "#fff", border: 0, borderRadius: 999, padding: "10px 16px", fontWeight: 800, cursor: "pointer", boxShadow: "0 6px 20px #c026d366" }}>🤝 Earn</button>
    </div>
  );
}