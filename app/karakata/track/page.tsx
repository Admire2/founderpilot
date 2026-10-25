"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function TrackOrderPage() {
  const [email, setEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);

    try {
      let query = sb.from("kara_orders").select("*");
      
      if (orderId.trim()) {
        query = query.eq("stripe_session_id", orderId.trim());
      } else if (email.trim()) {
        query = query.eq("buyer_email", email.trim().toLowerCase());
      } else {
        setError("Please enter an email or Order ID.");
        setLoading(false);
        return;
      }

      const { data, error: dbError } = await query.order("created_at", { ascending: false }).limit(1);

      if (dbError) throw dbError;

      if (data && data.length > 0) {
        setOrder(data[0]);
      } else {
        setError("No orders found matching those details. Please check your email or try again.");
      }
    } catch (err: any) {
      console.error("Track order error:", err);
      setError("An error occurred while searching. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-emerald-100 text-emerald-800";
      case "pending_payment": return "bg-amber-100 text-amber-800";
      case "shipped": return "bg-blue-100 text-blue-800";
      case "delivered": return "bg-slate-100 text-slate-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 max-w-md w-full">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Track Your Order</h1>
        <p className="text-slate-600 mb-6 text-sm">
          Enter the email address or Stripe Order ID you used at checkout.
        </p>

        <form onSubmit={handleSearch} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Order ID (Optional)</label>
            <input 
              type="text" 
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g., cs_test_..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition disabled:opacity-50"
          >
            {loading ? "Searching..." : "Track Order"}
          </button>
        </form>

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <p className="text-sm font-bold text-red-900">⚠️ {error}</p>
          </div>
        )}

        {order && (
          <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-left">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold text-emerald-900">Order Found!</p>
              <span className={`text-xs px-2 py-1 rounded-full font-bold uppercase ${getStatusColor(order.status)}`}>
                {order.status.replace("_", " ")}
              </span>
            </div>
            <div className="space-y-2 text-xs text-emerald-800">
              <p><strong>Amount:</strong> ${Number(order.total_amount).toFixed(2)}</p>
              <p><strong>Escrow Held:</strong> ${Number(order.escrow_amount).toFixed(2)}</p>
              {order.paid_at && <p><strong>Paid At:</strong> {new Date(order.paid_at).toLocaleString()}</p>}
              <p className="mt-3 font-bold">Next Step: Seller is preparing your shipment. You will be notified when it ships.</p>
            </div>
          </div>
        )}

        <Link href="/karakata" className="block mt-6 text-sm font-bold text-emerald-700 hover:underline">
          ← Return to Market
        </Link>
      </div>
    </main>
  );
}
