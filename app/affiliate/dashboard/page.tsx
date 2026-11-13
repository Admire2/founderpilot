"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AffiliateDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClicks: 0,
    totalConversions: 0,
    totalEarnings: 0,
    pendingBalance: 0,
    availableCredits: 0,
    availableCash: 0,
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { session } } = await sb.auth.getSession();
      
      if (!session?.user?.email) {
        window.location.href = "/auth?redirect=/affiliate/dashboard";
        return;
      }

      // Fetch affiliate stats (simplified for now)
      const { data: credits } = await sb
        .from("credits")
        .select("pack_balance")
        .eq("email", session.user.email)
        .single();

      setStats({
        totalClicks: 0, // Will be implemented with full tracking
        totalConversions: 0,
        totalEarnings: 0,
        pendingBalance: 0,
        availableCredits: Number(credits?.pack_balance || 0) / 100,
        availableCash: 0,
      });

      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="animate-pulse font-bold text-slate-600">Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Affiliate Dashboard</h1>
            <p className="text-slate-600 mt-1">Track your earnings, generate links, and manage payouts.</p>
          </div>
          <Link 
            href="/affiliate" 
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50"
          >
            ← Program Info
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-bold text-slate-500 uppercase">Available Credits</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">${stats.availableCredits.toFixed(2)}</p>
            <p className="text-xs text-slate-400 mt-1">Ready to use instantly</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-bold text-slate-500 uppercase">Pending Balance</p>
            <p className="text-3xl font-bold text-amber-600 mt-2">${stats.pendingBalance.toFixed(2)}</p>
            <p className="text-xs text-slate-400 mt-1">Clearing (60-day hold)</p>
          </div>

          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-bold text-slate-500 uppercase">Total Earnings</p>
            <p className="text-3xl font-bold text-emerald-600 mt-2">${stats.totalEarnings.toFixed(2)}</p>
            <p className="text-xs text-slate-400 mt-1">Lifetime commissions</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2">🔗 Generate Referral Link</h3>
              <p className="text-sm text-slate-600 mb-3">Create custom links to promote products.</p>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={`https://karakata.com/?ref=${"your_id"}`}
                  readOnly
                  className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded text-sm"
                />
                <button className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded hover:bg-purple-700">
                  Copy
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2"> Withdraw Earnings</h3>
              <p className="text-sm text-slate-600 mb-3">Cash out your available credits or request bank transfer.</p>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded hover:bg-purple-700">
                  Withdraw Credits
                </button>
                <button className="px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded hover:bg-slate-50">
                  Request Cash
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Info Notice */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This is a simplified dashboard. Full transaction history and advanced analytics are being built. 
            Commissions are calculated at 5% (Founding Ambassador) or 2.5% (Standard) with a 60-day clearing period.
          </p>
        </div>

      </div>
    </main>
  );
}
