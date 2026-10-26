"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [isSeller, setIsSeller] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.user) {
        router.push("/auth?callbackUrl=/account");
        return;
      }
      
      setUser(session.user);

      // Fetch user's orders
      const { data: orderData } = await sb
        .from("kara_orders")
        .select("*")
        .eq("buyer_email", session.user.email)
        .order("created_at", { ascending: false });
      
      if (orderData) setOrders(orderData);

      // Check if user is a seller
      const { data: sellerData } = await sb
        .from("sellers")
        .select("id, shop_name")
        .eq("email", session.user.email)
        .single();
      
      if (sellerData) setIsSeller(true);

      setLoading(false);
    };
    init();
  }, [router]);

  const handleSignOut = async () => {
    await sb.auth.signOut();
    router.push("/");
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-slate-600 font-bold animate-pulse">Loading Account...</p></div>;

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "escrow_active": return "bg-blue-100 text-blue-800";
      case "shipped": return "bg-purple-100 text-purple-800";
      case "completed": return "bg-emerald-100 text-emerald-800";
      case "canceled": return "bg-rose-100 text-rose-800";
      case "dispute_open": return "bg-orange-100 text-orange-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/karakata" className="text-sm font-bold text-emerald-700 hover:underline">← Back to Market</Link>
            <h1 className="mt-2 text-3xl font-bold text-slate-900">My Account</h1>
          </div>
          <button onClick={handleSignOut} className="text-sm font-bold text-rose-600 hover:underline">Sign Out</button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar: Profile & Actions */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-amber-700">{user?.email?.[0].toUpperCase()}</span>
              </div>
              <h2 className="text-xl font-bold text-center text-slate-900">{user?.user_metadata?.full_name || "Valued Customer"}</h2>
              <p className="text-sm text-slate-500 text-center mb-4">{user?.email}</p>
              
              <div className="space-y-2">
                <Link href="/karakata/sellercenter" className={`block w-full text-center py-2.5 rounded-lg font-bold text-sm transition ${isSeller ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-amber-400 text-slate-900 hover:bg-amber-300"}`}>
                  {isSeller ? "🏪 Go to Seller Center" : "🚀 Become a Seller"}
                </Link>
                <Link href="/karakata/track" className="block w-full text-center py-2.5 rounded-lg font-bold text-sm bg-slate-100 text-slate-700 hover:bg-slate-200 transition">
                  📦 Track an Order
                </Link>
              </div>
            </div>
          </div>

          {/* Right Main: Order History */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">Order History</h2>
                <p className="text-sm text-slate-500">View and track all your KaraKata purchases.</p>
              </div>
              
              <div className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <div className="p-8 text-center text-slate-500">
                    <p className="mb-4">You haven't made any purchases yet.</p>
                    <Link href="/karakata" className="text-emerald-700 font-bold hover:underline">Start Shopping →</Link>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="p-6 hover:bg-slate-50 transition">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="text-xs text-slate-500">Order #{String(order.id).slice(0, 8)}</p>
                          <p className="text-sm text-slate-500">{new Date(order.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getStatusColor(order.status)}`}>
                          {order.status?.replace("_", " ").toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-4">
                        <p className="font-bold text-slate-900">${Number(order.total_amount).toFixed(2)}</p>
                        <Link href={`/karakata/track?email=${encodeURIComponent(user.email)}&orderId=${order.stripe_session_id || ""}`} className="text-sm font-bold text-cyan-600 hover:underline">
                          View Details →
                        </Link>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
