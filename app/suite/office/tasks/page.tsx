"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import WalletBar from "@/app/components/WalletBar";
import { createClient } from "@supabase/supabase-js";
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const QUADS = ["do", "schedule", "delegate", "delete"];
const STATS = ["todo", "doing", "done"];
export default function OpsBoard() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [est, setEst] = useState("30");
  const [quad, setQuad] = useState("do");
  const [due, setDue] = useState("");
  const [pom, setPom] = useState(1500);
  const [view, setView] = useState("list");
  const [goal, setGoal] = useState("");
  const [msg, setMsg] = useState("");
  const emailOf = () => { let e = ""; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) { const j = JSON.parse(localStorage.getItem(k) || "null"); e = (j && j.user && j.user.email) || ""; if (e) break; } } } catch (err) {} return e; };
  const load = async () => { const { data } = await sb.from("fp_tasks").select("*").eq("email", emailOf()).order("created_at", { ascending: false }); setTasks(data || []); };
  useEffect(() => { load(); }, []);
  const add = async () => { if (!title.trim()) return; await sb.from("fp_tasks").insert({ email: emailOf(), title: title, estimate_min: Number(est) || 30, quadrant: quad, status: "todo", due: due || null }); setTitle(""); load(); };
  const move = async (id: number, status: string) => { await sb.from("fp_tasks").update({ status: status }).eq("id", id); load(); };
  const del = async (id: number) => { await sb.from("fp_tasks").delete().eq("id", id); load(); };
  const breakGoal = async () => { if (!goal.trim()) return; setMsg("Breaking goal into tasks..."); const r = await fetch("/api/karakata", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode: "taskbreak", email: emailOf(), brief: goal }) }); const j = await r.json(); if (j.ok && j.answer) { const rows = String(j.answer).split("\n").filter((l: string) => l.toUpperCase().indexOf("TASK:") === 0); for (const l of rows) { const g = (k: string) => { const m = l.split("|").find((s: string) => s.trim().toUpperCase().indexOf(k + ":") === 0); return m ? m.split(":").slice(1).join(":").trim() : ""; }; const q = g("Q").toLowerCase(); await sb.from("fp_tasks").insert({ email: emailOf(), title: g("TASK"), estimate_min: Number(g("EST")) || 30, quadrant: QUADS.indexOf(q) >= 0 ? q : "do", tag: g("TAG"), status: "todo" }); } setMsg(rows.length + " tasks added from your goal."); load(); try { window.dispatchEvent(new Event("wallet-refresh")); } catch (e) {} } else setMsg(j.error || "Failed."); };
  const inp = "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm";
  const Card = ({ t }: any) => (
    <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
      <p className="text-xs font-bold text-slate-200">{t.title}</p>
      <p className={"mt-1 text-[10px] " + (t.due && t.due < new Date().toISOString().slice(0, 10) && t.status !== "done" ? "font-bold text-rose-400" : "text-slate-500")}>{t.estimate_min} min · {t.quadrant}{t.tag ? " · #" + t.tag : ""}{t.due ? " · due " + t.due : ""}</p>
      <div className="mt-2 flex gap-1">
        {STATS.map((s) => (<button key={s} onClick={() => move(t.id, s)} className={"rounded px-1.5 py-0.5 text-[9px] font-bold " + (t.status === s ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-400")}>{s}</button>))}
        <button onClick={() => del(t.id)} className="ml-auto rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] font-bold text-rose-300">del</button>
      </div>
    </div>
  );
  const todayList = tasks.filter((t) => t.status !== "done" && (!t.due || t.due <= new Date().toISOString().slice(0, 10)));
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <Link href="/suite/office" className="mb-3 inline-block text-sm font-bold text-cyan-400 hover:underline">← Office Suite</Link>
      <WalletBar />
      <h1 className="text-3xl font-bold text-cyan-300">📋 Ops Board</h1>
      <p className="mt-1 text-sm text-slate-400">The free task-master's job, FounderPilot style: capture, estimate, prioritize - list, Kanban or Eisenhower. AI breaks goals into queues.</p>
      <div className="mt-4 flex gap-2">
        {["list", "kanban", "matrix", "today"].map((v) => (<button key={v} onClick={() => setView(v)} className={"rounded-lg px-3 py-1.5 text-xs font-bold " + (view === v ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-300")}>{v}</button>))}
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-bold text-cyan-200">Pomodoro</p>
          <p className="mt-1 font-mono text-2xl text-amber-300">{Math.floor(pom / 60)}:{String(pom % 60).padStart(2, "0")}</p>
          <div className="mt-2 flex gap-2">
            <button onClick={() => { const iv = setInterval(() => setPom((x) => { if (x <= 1) { clearInterval(iv); return 1500; } return x - 1; }), 1000); }} className="rounded bg-cyan-500 px-2 py-1 text-[10px] font-bold text-slate-950">Start 25m</button>
            <button onClick={() => setPom(1500)} className="rounded bg-slate-800 px-2 py-1 text-[10px] font-bold text-slate-300">Reset</button>
          </div>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="text-xs font-bold text-cyan-200">Voice capture (Chrome/Edge)</p>
          <button onClick={() => { const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition; if (!SR) { setMsg("Voice not supported here - type instead."); return; } const r = new SR(); r.onresult = (ev: any) => { const txt = String(ev.results[0][0].transcript); sb.from("fp_tasks").insert({ email: emailOf(), title: txt, estimate_min: 30, quadrant: "do", status: "todo" }).then(() => load()); }; r.start(); setMsg("Listening... speak your task."); }} className="mt-2 rounded-lg bg-rose-500 px-3 py-2 text-xs font-bold text-slate-950">Speak a task</button>
        </div>
      </div>
      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          <input value={title} onChange={(e) => setTitle(e.target.value)} className={inp} placeholder="New task..." />
          <input value={est} onChange={(e) => setEst(e.target.value)} className={inp} placeholder="min" />
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className={inp} />
          <select value={quad} onChange={(e) => setQuad(e.target.value)} className={inp}>{QUADS.map((q) => (<option key={q}>{q}</option>))}</select>
        </div>
        <button onClick={add} className="mt-2 rounded-lg bg-cyan-500 px-3 py-2 text-xs font-bold text-slate-950">Add (free)</button>
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-4">
          <input value={goal} onChange={(e) => setGoal(e.target.value)} className={inp + " md:col-span-3"} placeholder="Goal to break down: e.g. launch the Ankara collection in 30 days..." />
          <button onClick={breakGoal} className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950">AI Breakdown (10 cr)</button>
        </div>
        {msg && <p className="mt-2 text-xs font-bold text-amber-300">{msg}</p>}
      </div>
      <div className="mt-5">
        {view === "list" && (<div className="grid grid-cols-1 gap-2 md:grid-cols-3">{tasks.map((t) => (<Card key={t.id} t={t} />))}</div>)}
        {view === "kanban" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {STATS.map((s) => (
              <div key={s} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="mb-2 text-xs font-bold uppercase text-cyan-300">{s} ({tasks.filter((t) => t.status === s).length})</p>
                <div className="space-y-2">{tasks.filter((t) => t.status === s).map((t) => (<Card key={t.id} t={t} />))}</div>
              </div>
            ))}
          </div>
        )}
        {view === "matrix" && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {QUADS.map((q) => (
              <div key={q} className="rounded-xl border border-white/10 bg-white/5 p-3">
                <p className="mb-2 text-xs font-bold uppercase text-amber-300">{q} ({tasks.filter((t) => t.quadrant === q).length})</p>
                <div className="space-y-2">{tasks.filter((t) => t.quadrant === q).map((t) => (<Card key={t.id} t={t} />))}</div>
              </div>
            ))}
          </div>
        )}
        {view === "today" && (
          <div className="space-y-2">
            {todayList.map((t) => (<Card key={t.id} t={t} />))}
            {todayList.length === 0 && (<p className="text-xs text-slate-500">Nothing due today or overdue.</p>)}
          </div>
        )}
      </div>
    </main>
  );
}
