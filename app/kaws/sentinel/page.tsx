"use client";
import { useEffect, useState } from "react";

export default function SentinelDashboard() {
  const [status, setStatus] = useState("Checking...");
  const [errorRate, setErrorRate] = useState(0);

  useEffect(() => {
    fetch("/api/karakata/kaws/sentinel").then(r => r.json()).then(j => {
      if (j.ok) {
        setErrorRate(j.error_rate);
        setStatus(j.action);
      }
    });
  }, []);

  const isHealthy = errorRate < 10;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <header className="max-w-4xl mx-auto mb-8">
        <div className="text-sm font-bold tracking-widest text-emerald-400 uppercase mb-2">KAWS Infrastructure</div>
        <h1 className="text-4xl font-bold">Kara Sentinel Dashboard</h1>
        <p className="text-slate-400">Real-time health monitoring for 150+ concurrent voice agents.</p>
      </header>

      <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-6">
        <div className={`p-6 rounded-xl border ${isHealthy ? "bg-emerald-900/20 border-emerald-700" : "bg-red-900/20 border-red-700"}`}>
          <h2 className="text-xl font-bold mb-2">System Status</h2>
          <div className="text-3xl font-bold mb-4">{isHealthy ? "🟢 OPERATIONAL" : "🔴 DEGRADED"}</div>
          <p className="text-sm text-slate-300">Current Action: {status}</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-bold mb-2">Live Error Rate</h2>
          <div className="text-5xl font-bold text-indigo-400 mb-4">{errorRate.toFixed(1)}%</div>
          <div className="w-full bg-slate-800 rounded-full h-2.5">
            <div className={`h-2.5 rounded-full ${isHealthy ? "bg-emerald-500" : "bg-red-500"}`} style={{ width: `${Math.min(errorRate, 100)}%` }}></div>
          </div>
          <p className="text-xs text-slate-500 mt-2">Threshold for auto-fix: 20%</p>
        </div>
      </div>
    </main>
  );
}