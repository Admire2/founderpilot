"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SellerEarningsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [seller, setSeller] = useState<any>(null);
  const [stats, setStats] = useState({ totalRevenue: 0, available: 0, pending: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.user) {
        router.push("/auth?callbackUrl=/karakata/sellercenter/earnings");
        return;
      }

      // Fetch seller profile
      const { data: sellerData } = await sb
        .from("sellers")
        .select("*")
        .eq("email", session.user.email)
        .order("created_at", { ascending: false })
        .single();

      if (!sellerData) {
        router.push("/karakata/sellercenter");
        return;
      }
      setSeller(sellerData);

      // ✅ QUOTA-FRIENDLY: Fetch ONLY the columns needed for stats
      const { data: orders } = await sb
        .from("kara_orders")
        .select("total_amount, payout_status, status")
        .eq("seller_id", sellerData.id);

      if (orders) {
        const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
        // Pending: Delivered/Completed but not yet paid out
        const pending = orders.filter(o => (o.status === "delivered" || o.status === "completed") && o.payout_status !== "paid").reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
        // Available: Specifically marked as ready by your business logic
        const available = orders.filter(o => o.payout_status === "ready_for_payout").reduce((sum, order) => sum + Number(order.total_amount || 0), 0);
        
        setStats({ totalRevenue, available, pending });
      }

      // ✅ QUOTA-FRIENDLY: Fetch ONLY recent orders for the table
      const { data: recent } = await sb
        .from("kara_orders")
        .select("id, created_at, total_amount, payout_status, status")
        .eq("seller_id", sellerData.id)
        .order("created_at", { ascending: false })
        .limit(15);
      
      setRecentOrders(recent || []);
      setLoading(false);
    };
    init();
  }, [router]);

  const handleRequestPayout = async () => {
    if (!seller?.stripe_account_id) {
      setMessage({ type: "error", text: "Please complete your Stripe Connect onboarding first." });
      return;
    }

    setPayoutLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/karakata/payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seller_id: seller.id }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage({ type: "success", text: "✅ Payout request submitted successfully! Funds will arrive in 2-3 business days." });
        // Brief pause then refresh to show updated stats
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to request payout." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Network error. Please try again." });
    } finally {
      setPayoutLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="animate-pulse font-bold text-slate-600">Loading earnings...</p></div>;

  const isPayoutsEnabled = seller?.stripe_payouts_enabled;

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 text-slate-900">
      <div className="max-w-6xl mx-auto">
        <Link href="/karakata/sellercenter" className="text-sm font-bold text-emerald-700 hover:underline mb-6 inline-block">← Back to Seller Center</Link>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Earnings & Payouts</h1>
            <p className="text-slate-600 mt-1">Track your revenue and manage your Stripe transfers.</p>
          </div>
          <div className="mt-4 md:mt-0 flex gap-3">
            {!isPayoutsEnabled ? (
              <Link href="/karakata/sellercenter/onboarding" className="bg-amber-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-amber-600 transition shadow-sm">
                ⚠️ Complete Stripe Setup
              </Link>
            ) : (
              <button 
                onClick={handleRequestPayout} 
                disabled={payoutLoading || stats.available <= 0}
                className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                {payoutLoading ? "Processing..." : `💸 Request Payout ($${stats.available.toFixed(2)})`}
              </button>
            )}
          </div>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-lg text-sm font-bold border ${message.type === "success" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-red-50 text-red-800 border-red-200"}`}>
            {message.text}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Revenue</p>
            <p className="text-3xl font-bold text-slate-900 mt-2">${stats.totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-slate-400 mt-1">All-time gross sales</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pending Escrow</p>
            <p className="text-3xl font-bold text-amber-600 mt-2">${stats.pending.toFixed(2)}</p>
            <p className="text-xs text-slate-400 mt-1">Funds held until delivery confirmation</p>
          </div>
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">Available for Payout</p>
            <p className="text-3xl font-bold text-emerald-600 mt-2">${stats.available.toFixed(2)}</p>
            <p className="text-xs text-slate-400 mt-1">Ready to transfer to your bank account</p>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-3 text-left">Order ID</th>
                  <th className="px-6 py-3 text-left">Date</th>
                  <th className="px-6 py-3 text-left">Amount</th>
                  <th className="px-6 py-3 text-left">Order Status</th>
                  <th className="px-6 py-3 text-left">Payout Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">No orders yet. Start selling!</td></tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">{String(order.id).slice(0, 8).toUpperCase()}</td>
                      <td className="px-6 py-4 text-slate-600">{new Date(order.created_at).toLocaleDateString()}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">${Number(order.total_amount).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${order.status === "delivered" || order.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"}`}>
                          {order.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          order.payout_status === "paid" ? "bg-emerald-100 text-emerald-800" : 
                          order.payout_status === "ready_for_payout" ? "bg-amber-100 text-amber-800" : 
                          "bg-slate-100 text-slate-800"
                        }`}>
                          {order.payout_status?.replace("_", " ") || "Held"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}
