"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function TeamPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const { data } = await supabase.auth.getUser();
    setUser(data.user);
    if (data.user) {
      const { data: prof } = await supabase.from("profiles").select("*").eq("id", data.user.id).single();
      setProfile(prof);
      if (prof?.team_id) {
        const { data: mem } = await supabase.from("profiles").select("email, is_team_owner").eq("team_id", prof.team_id);
        setMembers(mem || []);
      }
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function createTeam() {
    setError(""); setMessage("");
    const { error } = await supabase.rpc("create_team", { tname: "My Team" });
    if (error) setError(error.message);
    else { setMessage("Team created! Share your team code with up to 4 teammates."); load(); }
  }

  async function joinTeam() {
    setError(""); setMessage("");
    const { data, error } = await supabase.rpc("join_team", { tid: code.trim() });
    if (error) setError(error.message);
    else if (data?.error) setError(data.error);
    else { setMessage("Welcome aboard! You now have full Pro access as a team member."); load(); }
  }

  const card = "rounded-2xl border border-white/10 bg-white/5 p-8";

  return (
    <main className="w-full min-w-0 p-6 md:p-10">
      <div className="mx-auto max-w-2xl min-w-0">
        <header className="mb-8 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">Team Workspace</p>
          <h1 className="mt-3 text-3xl font-bold">My Team</h1>
          <p className="mt-2 text-sm text-slate-400">Team plan includes up to 5 seats. The limit is enforced by our database.</p>
        </header>

        {loading ? (
          <div className={card + " text-center text-slate-400"}>Loading…</div>
        ) : !user ? (
          <div className={card + " text-center"}>
            <p className="text-slate-300">Log in to create or join a team.</p>
            <Link href="/auth" className="mt-6 inline-block rounded-xl bg-cyan-500 px-8 py-3 font-semibold text-slate-950 hover:bg-cyan-400">Sign in</Link>
          </div>
        ) : profile?.is_team_owner && profile?.team_id ? (
          <div className={card}>
            <h2 className="text-lg font-semibold text-emerald-300">You own a team ✅</h2>
            <p className="mt-2 text-sm text-slate-400">Share this team code with teammates (max 5 seats including you):</p>
            <div className="mt-4 rounded-xl border border-cyan-500/30 bg-slate-900/70 p-4 font-mono text-sm text-cyan-300 break-all">{profile.team_id}</div>
            <h3 className="mt-6 text-sm font-semibold text-slate-200">Members ({members.length}/5)</h3>
            <ul className="mt-2 space-y-2">
              {members.map((m) => (
                <li key={m.email} className="flex justify-between rounded-lg bg-slate-900/60 px-4 py-2 text-sm text-slate-300">
                  <span className="break-all">{m.email}</span>
                  <span className="ml-4 shrink-0 text-cyan-400">{m.is_team_owner ? "Owner" : "Member"}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : profile?.team_id ? (
          <div className={card}>
            <h2 className="text-lg font-semibold text-emerald-300">You are a team member ✅</h2>
            <p className="mt-2 text-sm text-slate-400">You have full Pro access through your team.</p>
            <h3 className="mt-6 text-sm font-semibold text-slate-200">Members ({members.length}/5)</h3>
            <ul className="mt-2 space-y-2">
              {members.map((m) => (
                <li key={m.email} className="flex justify-between rounded-lg bg-slate-900/60 px-4 py-2 text-sm text-slate-300">
                  <span className="break-all">{m.email}</span>
                  <span className="ml-4 shrink-0 text-cyan-400">{m.is_team_owner ? "Owner" : "Member"}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className={card}>
            <h2 className="text-lg font-semibold">Join a team</h2>
            <p className="mt-2 text-sm text-slate-400">Paste the team code from your team owner.</p>
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Team code (uuid)" className="mt-4 box-border w-full max-w-full rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-white outline-none focus:border-cyan-400" />
            <button onClick={joinTeam} className="mt-4 box-border w-full max-w-full rounded-xl bg-cyan-500 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-400">Join Team</button>
            {profile?.plan !== "team" && (
              <p className="mt-6 text-sm text-slate-400">Want your own team? <Link href="/pricing" className="text-cyan-400 hover:underline">Upgrade to Team</Link></p>
            )}
          </div>
        )}

        {message && <p className="mt-4 text-center text-sm text-emerald-300">{message}</p>}
        {error && <p className="mt-4 text-center text-sm text-red-300">{error}</p>}
      </div>
    </main>
  );
}