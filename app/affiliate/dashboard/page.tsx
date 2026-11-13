"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Copy, TrendingUp, Users, DollarSign, Clock, Award, Link as LinkIcon } from "lucide-react";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AffiliateDashboard() {
  const [loading, setLoading] = useState(true);
  const [affiliateLink, setAffiliateLink] = useState("");
  const [copied, setCopied] = useState(false);
  
  // Mock data structure (Replace with actual Supabase queries as your backend matures)
  const [stats, setStats] = useState({
    totalEarnings: 12450.00,
    pendingClearance: 3200.50,
    totalClicks: 1842,
    conversionRate: 4.2,
    referredSellers: 14
  });

  const [recentCommissions, setRecentCommissions] = useState([
    { id: 1, seller: "Aso-Oke Heritage Ltd", amount: 450.00, status: "Cleared", date: "Oct 28, 2026" },
    { id: 2, seller: "Ghana Gold Refiners", amount: 1200.00, status: "Pending (Day 14/60)", date: "Nov 02, 2026" },
    { id: 3, seller: "Nairobi Agro-Processors", amount: 320.50, status: "Pending (Day 45/60)", date: "Oct 15, 2026" },
  ]);

  const [topSellers, setTopSellers] = useState([
    { name: "Aso-Oke Heritage Ltd", sales: 12, revenue: 8400.00 },
    { name: "Ghana Gold Refiners", sales: 4, revenue: 5200.00 },
    { name: "Nairobi Agro-Processors", sales: 8, revenue: 3100.00 },
  ]);

  useEffect(() => {
    // TODO: Replace with actual Supabase fetch for the logged-in user's affiliate stats
    // const fetchStats = async () => { ... }
    
    // Generate affiliate link based on user session (mocked for now)
    const userId = "user_12345"; // Replace with actual session user ID
    setAffiliateLink(`https://founderpilot-theta.vercel.app/karakata?ref=${userId}`);
    setLoading(false);
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(affiliateLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-500 font-bold">Loading Command Center...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Affiliate Command Center</h1>
            <p className="text-slate-500 mt-1">Track your impact, manage your network, and scale your earnings.</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-lg flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-800">Status: Founding Ambassador (5% Lifetime)</span>
          </div>
        </div>

        {/* Quick Link Generator */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <LinkIcon className="w-5 h-5 text-amber-500" /> Your Unique Tracking Link
          </h2>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              value={affiliateLink} 
              readOnly 
              className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-4 py-3 text-sm text-slate-700 font-mono focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
            <button 
              onClick={copyToClipboard}
              className={`px-6 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                copied ? "bg-emerald-500 text-white" : "bg-slate-900 text-white hover:bg-slate-800"
              }`}
            >
              {copied ? "Copied! ✅" : <><Copy className="w-4 h-4" /> Copy Link</>}
            </button>
          </div>
          <p className="text-xs text-slate-500 mt-2">Share this link with potential sellers. You earn 5% lifetime commission on all their sales.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon={<DollarSign className="w-6 h-6 text-emerald-600" />}
            label="Total Earnings (Cleared)"
            value={`$${stats.totalEarnings.toLocaleString()}`}
            subtext="Available for withdrawal"
            color="bg-emerald-50 border-emerald-100"
          />
          <StatCard 
            icon={<Clock className="w-6 h-6 text-amber-600" />}
            label="Pending Clearance"
            value={`$${stats.pendingClearance.toLocaleString()}`}
            subtext="60-day fraud protection window"
            color="bg-amber-50 border-amber-100"
          />
          <StatCard 
            icon={<Users className="w-6 h-6 text-blue-600" />}
            label="Total Link Clicks"
            value={stats.totalClicks.toLocaleString()}
            subtext={`${stats.referredSellers} sellers onboarded`}
            color="bg-blue-50 border-blue-100"
          />
          <StatCard 
            icon={<TrendingUp className="w-6 h-6 text-purple-600" />}
            label="Conversion Rate"
            value={`${stats.conversionRate}%`}
            subtext="Clicks to successful onboarding"
            color="bg-purple-50 border-purple-100"
          />
        </div>

        {/* Two Column Layout: Recent Commissions & Top Sellers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Recent Commissions */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Recent Commissions</h2>
            <div className="space-y-4">
              {recentCommissions.map((comm) => (
                <div key={comm.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{comm.seller}</p>
                    <p className="text-xs text-slate-500">{comm.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-600">${comm.amount.toFixed(2)}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      comm.status === "Cleared" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {comm.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Referred Sellers */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Your Top Referred Sellers</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="pb-2 font-medium">Seller Name</th>
                    <th className="pb-2 font-medium text-right">Sales</th>
                    <th className="pb-2 font-medium text-right">Revenue Generated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topSellers.map((seller, idx) => (
                    <tr key={idx} className="group hover:bg-slate-50 transition">
                      <td className="py-3 font-medium text-slate-900">{seller.name}</td>
                      <td className="py-3 text-right text-slate-600">{seller.sales}</td>
                      <td className="py-3 text-right font-bold text-emerald-600">${seller.revenue.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Footer Note */}
        <div className="bg-slate-900 text-slate-300 p-6 rounded-xl text-center">
          <p className="text-sm font-medium">
            💡 <span className="text-white font-bold">Pro Tip:</span> Sellers who opt into the <span className="text-amber-400">Kara Credit Payout Model</span> generate 2x more platform activity. 
            Encourage your network to activate it for bonus affiliate rewards.
          </p>
        </div>

      </div>
    </main>
  );
}

// Reusable Stat Card Component
function StatCard({ icon, label, value, subtext, color }: { 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  subtext: string; 
  color: string;
}) {
  return (
    <div className={`p-5 rounded-xl border shadow-sm ${color}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 mt-1">{subtext}</p>
    </div>
  );
}
