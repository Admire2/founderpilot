"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import ShipOrderModal from "@/components/karakata/ShipOrderModal";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SellerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [sellerId, setSellerId] = useState<string | number | null>(null);
  const [shippingModal, setShippingModal] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await sb.auth.getSession();
      const userEmail = session?.user?.email || "";
      setEmail(userEmail);
      
      if (userEmail) {
        // Fetch seller profile to get the actual seller_id
        const { data: sellerData } = await sb.from("sellers").select("id").eq("email", userEmail).single();
        const currentSellerId = sellerData?.id || userEmail;
        setSellerId(currentSellerId);

        const { data, error } = await sb.from("kara_orders").select("*").order("created_at", { ascending: false });
        if (data) {
          // Filter orders for this specific seller
          const myOrders = data.filter((o: any) => String(o.seller_id) === String(currentSellerId));
          setOrders(myOrders);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleOrderUpdated = () => {
    // Refresh local state instantly so the UI updates without a full page reload
    setOrders(prev => prev.map(o => 
      o.id === shippingModal?.id ? { ...o, status: "shipped", tracking_number: shippingModal.tracking_number } : o
    ));
    setShippingModal(null);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "escrow_active": return "bg-blue-100 text-blue-800";
      case "cancellation_requested": return "bg-amber-100 text-amber-800";
      case "shipped": return "bg-purple-100 text-purple-800";
      case "delivered": return "bg-indigo-100 text-indigo-800";
      case "completed": return "bg-emerald-100 text-emerald-800";
      case "canceled": return "bg-rose-100 text-rose-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-slate-600 font-bold animate-pulse">Loading orders...</p></div>;

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/karakata/sellercenter" className="text-sm font-bold text-emerald-700 hover:underline">← Back to Seller Center</Link>
            <h1 className="mt-2 text-3xl font-bold">Order Management</h1>
            <p className="text-sm text-slate-600">Manage fulfillment, print labels, and update shipping status.</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Logged in as</p>
            <p className="font-bold text-slate-900">{email || "Seller"}</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase">Total Orders</p>
            <p className="text-2xl font-bold text-slate-900">{orders.length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-blue-600 uppercase">Pending Fulfillment</p>
            <p className="text-2xl font-bold text-blue-700">{orders.filter(o => o.status === "escrow_active").length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-purple-600 uppercase">Shipped</p>
            <p className="text-2xl font-bold text-purple-700">{orders.filter(o => o.status === "shipped").length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-emerald-600 uppercase">Completed</p>
            <p className="text-2xl font-bold text-emerald-700">{orders.filter(o => o.status === "completed").length}</p>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-bold text-slate-700">Order ID</th>
                  <th className="px-6 py-3 font-bold text-slate-700">Buyer</th>
                  <th className="px-6 py-3 font-bold text-slate-700">Items</th>
                  <th className="px-6 py-3 font-bold text-slate-700">Shipping</th>
                  <th className="px-6 py-3 font-bold text-slate-700">Total</th>
                  <th className="px-6 py-3 font-bold text-slate-700">Status</th>
                  <th className="px-6 py-3 font-bold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                      No orders yet. When a buyer purchases your items, they will appear here.
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">#{String(order.id).slice(0, 8)}</td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{order.buyer_name || "Unknown"}</p>
                        <p className="text-xs text-slate-500">{order.buyer_email}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-slate-900">{order.items ? (Array.isArray(order.items) ? order.items.map((i:any) => i.title).join(", ") : (typeof order.items === 'string' ? order.items : (order.items && order.items.title ? order.items.title : "1 Item"))) : "1 Item"}</p>
                        <p className="text-xs text-slate-500">Qty: {order.qty || 1}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-900 capitalize">{order.shipping_method || "Standard"}</p>
                        {order.tracking_number && <p className="text-xs text-blue-600 mt-1">📦 {order.tracking_number}</p>}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">${Number(order.total_amount || 0).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${getStatusColor(order.status)}`}>
                          {order.status?.replace("_", " ").toUpperCase() || "PENDING"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {order.status === "escrow_active" && (
                          <button 
                            onClick={() => setShippingModal(order)}
                            className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700 transition"
                          >
                            Mark as Shipped
                          </button>
                        )}
                        {order.status === "cancellation_requested" && (
                          <span className="inline-flex items-center rounded-lg bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800">
                            ⚠️ Check Email
                          </span>
                        )}
                        {order.status === "shipped" && (
                          <button className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 cursor-default">
                            Awaiting Delivery
                          </button>
                        )}
                        {order.status === "completed" && (
                          <span className="text-xs font-bold text-emerald-600">✅ Completed</span>
                        )}
                        {order.status === "canceled" && (
                          <span className="text-xs font-bold text-rose-600">❌ Canceled</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Shipping Modal Component */}
      {shippingModal && sellerId && (
        <ShipOrderModal 
          order={shippingModal} 
          sellerId={sellerId} 
          onClose={() => setShippingModal(null)} 
          onUpdated={handleOrderUpdated} 
        />
      )}
    </main>
  );
}
