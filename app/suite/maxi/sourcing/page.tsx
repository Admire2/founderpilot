"use client";
import WalletBar from "@/components/WalletBar";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
export default function SourcingPage() {
  const [obj, setObj] = useState("");
  const [busy, setBusy] = useState(false);
  const [rows, setRows] = useState<any[]>([]);
  const [email, setEmail] = useState("anonymous");
  useEffect(() => { try { const o = new URLSearchParams(window.location.search).get("obj"); if (o) setObj(o); } catch (e) {} }, []);
  const chargeCredits = async (cost: number, action: string) => {
    try {
      let em = "";
      try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.startsWith("sb-") && k.endsWith("-auth-token")) { const raw = localStorage.getItem(k); if (raw) { const j = JSON.parse(raw); em = j?.user?.email || ""; if (em) break; } } } } catch (e) {}
      if (!em) return;
      await fetch("/api/charge", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: em, cost, action }) });
    } catch (e) {}
  };

  const run = async () => {
    if (!obj.trim() || busy) return;
    setBusy(true); setRows([]);
    try {
      const r = await fetch("/api/maxi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: "SOURCING MODE. Objective: " + obj + ". List exactly 8 real companies that can supply parts, assemble, manufacture, or sell finished products for this objective. MUST include at least 2 China-based manufacturers (Shenzhen/Guangdong hubs) alongside nearest-region and US/EU options. One per line, format: NAME | COUNTRY | WEBSITE | CAPABILITY. No extra commentary." }) });
      const j = await r.json();
      const lines = (j.answer || "").split("\n").filter((l: string) => l.indexOf("|") >= 0);
      const out: any[] = [];
      for (const l of lines) {
        const p = l.split("|").map((x: string) => x.trim());
        if (p.length >= 3) {
          const name = p[0].replace(/^[-*\d.\s]+/, "");
          const site = (p[2] || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
          const url = site ? "https://" + site + "/?ref=founderpilot" : "";
          const ex = await supabase.from("affiliate_partners").select("id").eq("partner_name", name).limit(1);
          if ((ex.data || []).length === 0 && name) {
            await supabase.from("affiliate_partners").insert({ partner_name: name, category: "sourced", affiliate_url: url, commission_rate: "per agreement", network: "Sourced", country: p[1] || "", services: p[3] || p[1] || "", status: "sourced", partnership_model: "lead-fee" });
          }
          out.push({ name, country: p[1], site, cap: p[3] || "" });
        }
      }
      setRows(out);
    } catch (e) {}
    setBusy(false);
  };
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <WalletBar />

      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold">🔍 Sourcing Search</h1>
        <p className="mt-2 text-sm text-slate-400">Type any objective (e.g. "Build me an AC generator"). We find suppliers / assemblers / manufacturers worldwide, add them to the partner network, and tag every visit with ref=founderpilot so they know the lead is ours.</p>
        <textarea rows={2} value={obj} onChange={(e) => setObj(e.target.value)} placeholder="Objective..." className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-800 px-3 py-2 text-sm" />
        <p className="mt-2 text-[10px] text-amber-300">💡 Quotes open in a NEW TAB - your objective and supplier list stay safe on this page. Do not refresh mid-search; exports save automatically.</p>
        <button onClick={run} disabled={busy} className="mt-2 w-full rounded-xl bg-cyan-500 px-4 py-3 font-bold text-slate-900 disabled:opacity-40">{busy ? "Searching global supply chain..." : "Search suppliers"}</button>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          {rows.filter((r: any) => r.name && r.name.toUpperCase() !== "NAME").map((r) => (
            <div key={r.name} className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
              <p className="font-bold text-cyan-200">{r.name}</p>
              <p className="text-xs text-slate-400">{r.country} • {r.cap}</p>
              <a className="mt-2 inline-block rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-900" target="_blank" rel="noreferrer" href={"/api/go?p=" + encodeURIComponent(r.name) + "&item=" + encodeURIComponent(obj) + "&e=" + encodeURIComponent(email) + "&s=sourcing"}>Request quote (tracked)</a>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

