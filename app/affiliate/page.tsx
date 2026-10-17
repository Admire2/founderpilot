"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AffiliateDashboard() {
  const [tab, setTab] = useState("suite");
  const [user, setUser] = useState<any>(null);
  const [origin, setOrigin] = useState("");
  const [aff, setAff] = useState<any>(null);
  const [refs, setRefs] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [myRank, setMyRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setOrigin(window.location.origin);
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await loadAll(session.user.email || "");
        await loadLeaderboard();
      }
      setLoading(false);
    })();
  }, []);

  const loadAll = async (email: string) => {
    const { data } = await supabase.from("affiliates").select("*").eq("email", email).limit(1);
    if (data && data.length > 0) {
      setAff(data[0]);
      const { data: r } = await supabase.from("referrals").select("*").eq("affiliate_code", data[0].affiliate_code).order("created_at", { ascending: false });
      setRefs(r || []);
    }
  };

  const loadLeaderboard = async () => {
    const { data } = await supabase.from("affiliates").select("affiliate_code, first_name, last_name, total_earned").order("total_earned", { ascending: false }).limit(10);
    if (data) {
      const ranked = data.map((a: any, i: number) => ({ ...a, rank: i + 1 }));
      setLeaderboard(ranked);
    }
  };

  if (loading) return <main className="min-h-screen bg-slate-950 p-8 text-white">Loading...</main>;

  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-emerald-400">💰 Affiliate Dashboard</h1>
        
        <div className="mt-8 flex gap-2 border-b border-slate-700">
          <button onClick={() => setTab("suite")} className={"px-6 py-3 font-bold " + (tab === "suite" ? "border-b-2 border-emerald-400 text-emerald-400" : "text-slate-400")}>Suite</button>
          <button onClick={() => setTab("market")} className={"px-6 py-3 font-bold " + (tab === "market" ? "border-b-2 border-emerald-400 text-emerald-400" : "text-slate-400")}>Market (3%)</button>
          <button onClick={() => setTab("funding")} className={"px-6 py-3 font-bold " + (tab === "funding" ? "border-b-2 border-emerald-400 text-emerald-400" : "text-slate-400")}>🏦 Funded Sellers</button>
        </div>

        {tab === "market" && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-emerald-400">🏆 Springboard Leaderboard</h2>
            <div className="mt-4 space-y-2">
              {leaderboard.map((a, i) => (
                <div key={a.affiliate_code} className="rounded-lg border border-slate-700 bg-slate-900 p-4">
                  <div className="flex justify-between">
                    <span className="text-2xl font-bold">{i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${a.rank}`}</span>
                    <span className="font-bold text-white">{a.first_name} {a.last_name}</span>
                    <span className="text-emerald-400">${Number(a.total_earned || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === "funding" && (
          <div className="mt-8">
            <h2 className="text-2xl font-bold text-emerald-400">🏦 Sellers Who Got Funded</h2>
            <p className="mt-2 text-slate-400">Coming soon: track which sellers you recruited qualified for expansion capital.</p>
          </div>
        )}
      </div>
    </main>
  );
}