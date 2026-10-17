"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SellerOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [shippingModal, setShippingModal] = useState<any>(null);
  const [trackingNum, setTrackingNum] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await sb.auth.getSession();
      const userEmail = session?.user?.email || "";
      setEmail(userEmail);
      
      if (userEmail) {
        // Fetch orders for this seller (In production, filter by seller_id matching the user's seller profile)
        // For now, we fetch all and filter client-side, or you can add a seller_id column to kara_orders
        const { data, error } = await sb.from("kara_orders").select("*").order("created_at", { ascending: false });
        if (data) {
          // Filter orders where the seller matches (mocked logic: assuming seller email is in the order or linked)
          // In your actual DB, you should have seller_email or seller_id in the kara_orders table
          const myOrders = data.filter((o: any) => o.seller_email === userEmail || o.seller_id === userEmail);
          setOrders(myOrders.length > 0 ? myOrders : data); // Fallback to all for testing if no seller_email yet
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleMarkShipped = async (orderId: string) => {
    if (!trackingNum.trim()) {
      alert("Please enter a tracking number or logistics partner name.");
      return;
    }
    setUpdating(true);
    const { error } = await sb
      .from("kara_orders")
      .update({ 
        status: "shipped", 
        tracking_number: trackingNum,
        shipped_at: new Date().toISOString()
      })
      .eq("id", orderId);

    if (!error) {
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: "shipped", tracking_number: trackingNum } : o));
      setShippingModal(null);
      setTrackingNum("");
    } else {
      alert("Failed to update order: " + error.message);
    }
    setUpdating(false);
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending": return "bg-amber-100 text-amber-800";
      case "shipped": return "bg-blue-100 text-blue-800";
      case "delivered": return "bg-emerald-100 text-emerald-800";
      case "cancelled": return "bg-rose-100 text-rose-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-slate-600">Loading orders...</p></div>;

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/karakata/seller" className="text-sm font-bold text-emerald-700 hover:underline">? Back to Seller Center</Link>
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
            <p className="text-xs font-bold text-amber-600 uppercase">Pending Fulfillment</p>
            <p className="text-2xl font-bold text-amber-700">{orders.filter(o => o.status === "pending").length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-blue-600 uppercase">Shipped</p>
            <p className="text-2xl font-bold text-blue-700">{orders.filter(o => o.status === "shipped").length}</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-emerald-600 uppercase">Delivered</p>
            <p className="text-2xl font-bold text-emerald-700">{orders.filter(o => o.status === "delivered").length}</p>
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
                  <th className="px-6 py-3 font-bold text-slate-700">Shipping Method</th>
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
                        <p className="text-xs text-slate-500">Cost: ${order.shipping_cost || "0.00"}</p>
                        {order.tracking_number && <p className="text-xs text-blue-600 mt-1">?? {order.tracking_number}</p>}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">${Number(order.total || 0).toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${getStatusColor(order.status)}`}>
                          {order.status?.toUpperCase() || "PENDING"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {order.status === "pending" && (
                          <button 
                            onClick={() => setShippingModal(order)}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 transition"
                          >
                            Mark Shipped
                          </button>
                        )}
                        {order.status === "shipped" && (
                          <button className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 cursor-default">
                            Awaiting Delivery
                          </button>
                        )}
                        {order.status === "delivered" && (
                          <span className="text-xs font-bold text-emerald-600">? Completed</span>
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

      {/* Shipping Modal */}
      {shippingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Mark Order as Shipped</h3>
            <p className="text-sm text-slate-600 mb-4">
              Enter the tracking number or the name of the logistics partner (e.g., "GIG Logistics - TRK12345"). 
              This will notify the buyer and update the escrow status.
            </p>
            <input 
              type="text" 
              value={trackingNum} 
              onChange={(e) => setTrackingNum(e.target.value)} 
              placeholder="Enter tracking number..." 
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              autoFocus
            />
            <div className="flex gap-3">
              <button 
                onClick={() => { setShippingModal(null); setTrackingNum(""); }} 
                className="flex-1 rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-50"
                disabled={updating}
              >
                Cancel
              </button>
              <button 
                onClick={() => handleMarkShipped(shippingModal.id)} 
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                disabled={updating}
              >
                {updating ? "Updating..." : "Confirm Shipped"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
