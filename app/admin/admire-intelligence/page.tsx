"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

// Initialize Supabase Client
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdmireIntelligencePage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const { data: pipelineData, error } = await sb
        .from("admire_pipeline")
        .select("*")
        .order("admire_score", { ascending: false });

      if (!error) {
        setData(pipelineData || []);
      }
      setLoading(false);
    };
    fetchData();
  }, []);

  // Helper for Score Bar Color
  const getScoreColor = (score: number) => {
    if (score >= 85) return "bg-emerald-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-slate-400";
  };

  // Helper for Status Badge Color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ready_for_sourcing": return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "sourcing_in_progress": return "bg-blue-100 text-blue-800 border-blue-200";
      case "admire_launched": return "bg-purple-100 text-purple-800 border-purple-200";
      default: return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">KaraKata Admire Intelligence</h1>
            <p className="text-slate-500 mt-1">Identify top-selling products for our flagship brand rollout.</p>
          </div>
          <Link href="/admin" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-50 transition">
            ← Back to Admin
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total Monitored</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">{data.length}</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Ready for Sourcing</p>
            <p className="text-3xl font-bold text-emerald-600 mt-2">
              {data.filter(d => d.admire_score >= 85).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Average Admire Score</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {data.length > 0 ? Math.round(data.reduce((acc: number, curr: any) => acc + curr.admire_score, 0) / data.length) : 0}
            </p>
          </div>
        </div>

        {/* Main Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Product Pipeline</h2>
            <span className="text-xs font-bold text-slate-500">Sorted by Admire Score (Highest First)</span>
          </div>

          {loading ? (
            <div className="p-10 text-center text-slate-500">Loading intelligence data...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Product Name</th>
                    <th className="px-6 py-3">Price</th>
                    <th className="px-6 py-3">Monthly Sales</th>
                    <th className="px-6 py-3">Admire Score</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-bold text-slate-900">{item.product_name}</td>
                      <td className="px-6 py-4 text-slate-600">${Number(item.current_avg_price).toFixed(2)}</td>
                      <td className="px-6 py-4 text-slate-600">{item.monthly_sales}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getScoreColor(item.admire_score)}`} 
                              style={{ width: `${item.admire_score}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-bold text-slate-900">{item.admire_score}/100</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusBadge(item.status)}`}>
                          {item.status.replace(/_/g, ' ').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="px-3 py-1.5 bg-purple-600 text-white text-xs font-bold rounded-lg hover:bg-purple-700 transition">
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                  {data.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-500">
                        No products in the pipeline yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
