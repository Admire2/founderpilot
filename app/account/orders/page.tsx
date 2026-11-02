"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// Helper to get status badge colors
function getStatusColor(status: string) {
  switch (status) {
    case "delivered": case "completed": return "bg-emerald-100 text-emerald-800 border-emerald-200";
    case "shipped": return "bg-blue-100 text-blue-800 border-blue-200";
    case "escrow_active": case "paid": return "bg-amber-100 text-amber-800 border-amber-200";
    case "refunded": case "cancelled": return "bg-rose-100 text-rose-800 border-rose-200";
    default: return "bg-slate-100 text-slate-800 border-slate-200";
  }
}

export default function BuyerOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.user) {
        router.push("/auth?callbackUrl=/account/orders");
        return;
      }
      setUserEmail(session.user.email);

      try {
        // ✅ QUOTA-FRIENDLY: Fetch ONLY this buyer's orders, select ONLY needed columns, limit to 50
        const { data, error } = await sb
          .from("kara_orders")
          .select("id, code, total_amount, status, tracking_number, created_at, seller_id, tracking_stages")
          .eq("buyer_email", session.user.email)
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) throw error;
        setOrders(data || []);
      } catch (err) {
        console.error("Failed to fetch orders:", err);
      }
      setLoading(false);
    };
    fetchOrders();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600 font-bold animate-pulse">Loading your orders...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">📦 Your Orders</h1>
            <p className="text-sm text-slate-600 mt-1">Track your purchases, manage returns, and leave reviews.</p>
          </div>
          <Link href="/account" className="text-sm font-bold text-slate-600 hover:text-slate-900 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm transition">
            ← Back to Account
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 text-center">
            <p className="text-4xl mb-4">🛒</p>
            <h2 className="text-xl font-bold text-slate-900 mb-2">No orders yet</h2>
            <p className="text-slate-600 mb-6">Start exploring the marketplace and find something you love!</p>
            <Link href="/karakata" className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-emerald-700 transition">
              Browse Marketplace
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 hover:shadow-md transition">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Order Placed</p>
                    <p className="text-sm font-bold text-slate-900">{new Date(order.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Total</p>
                    <p className="text-lg font-bold text-slate-900">${Number(order.total_amount).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Order #</p>
                    <p className="text-sm font-mono font-bold text-slate-900">{order.code || String(order.id).slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                      {order.status.replace("_", " ").toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex-1">
                    {order.tracking_number ? (
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <span className="text-emerald-600">🚚</span>
                        <span className="font-bold">Tracking:</span> 
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded">{order.tracking_number}</span>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500">Tracking information will appear here once the seller ships your order.</p>
                    )}
                  </div>
                  
                  <div className="flex gap-3">
                    {order.status === "delivered" || order.status === "completed" ? (
                      <Link href={`/karakata/review?order_id=${order.id}`} className="text-sm font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 px-4 py-2 rounded-lg border border-amber-200 transition">
                        ⭐ Leave Review
                      </Link>
                    ) : null}
                    
                    {order.status === "escrow_active" || order.status === "shipped" ? (
                      <Link href={`/karakata/track?id=${order.id}`} className="text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg border border-blue-200 transition">
                        📍 Track Package
                      </Link>
                    ) : null}

                    <Link href={`/karakata/product/${order.seller_id}`} className="text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg border border-slate-200 transition">
                      Visit Store
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
