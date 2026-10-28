"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import ShipOrderModal from "@/components/karakata/ShipOrderModal";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SellerOrders() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [sellerId, setSellerId] = useState<string | number | null>(null);
  const [shippingModal, setShippingModal] = useState<any>(null);
  const [disputeModal, setDisputeModal] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.user) {
        router.push("/auth?callbackUrl=/karakata/sellercenter/orders");
        return;
      }
      const email = session.user.email;
      setUserEmail(email);
      const { data: sellerData } = await sb.from("sellers").select("id, shop_name").eq("email", email).single();
      if (!sellerData) { setLoading(false); return; }
      setSellerId(sellerData.id);
      const { data } = await sb.from("kara_orders").select("*").eq("seller_id", sellerData.id).order("created_at", { ascending: false });
      if (data) setOrders(data);
      setLoading(false);
    };
    init();
  }, [router]);

  const handleOrderUpdated = () => {
    setOrders(prev => prev.map(o => o.id === shippingModal?.id ? { ...o, status: "shipped", tracking_number: shippingModal.tracking_number } : o));
    setShippingModal(null);
  };

  const handleDisputeResolved = () => {
    setDisputeModal(null);
    window.location.reload();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "escrow_active": return "bg-blue-100 text-blue-800";
      case "cancellation_requested": return "bg-amber-100 text-amber-800";
      case "shipped": return "bg-purple-100 text-purple-800";
      case "delivered": return "bg-indigo-100 text-indigo-800";
      case "completed": return "bg-emerald-100 text-emerald-800";
      case "canceled": return "bg-slate-100 text-slate-800";
      case "dispute_open": return "bg-rose-100 text-rose-800";
      case "dispute_under_review": return "bg-orange-100 text-orange-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const filteredOrders = filterStatus ? orders.filter(o => o.status === filterStatus) : orders;

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-slate-600 font-bold animate-pulse">Loading orders...</p></div>;
  if (!sellerId) return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">Seller Profile Not Found</h1>
      <p className="text-slate-600 mb-6">You are logged in, but you haven't set up a seller profile yet.</p>
      <Link href="/karakata/sellercenter" className="bg-amber-400 text-slate-900 px-8 py-3 rounded-xl font-bold hover:bg-amber-300 transition">Go to Onboarding</Link>
    </main>
  );

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            {/* ✅ UPDATED: Points to Dashboard */}
            <Link href="/karakata/sellercenter/dashboard" className="text-sm font-bold text-emerald-700 hover:underline">← Back to Dashboard</Link>
            <h1 className="mt-2 text-3xl font-bold">Order Management</h1>
            <p className="text-sm text-slate-600">Manage fulfillment, print labels, and resolve disputes.</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Logged in as</p>
            <p className="font-bold text-slate-900">{userEmail}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <button onClick={() => setFilterStatus(null)} className={`bg-white p-4 rounded-xl border shadow-sm text-left transition hover:shadow-md ${filterStatus === null ? 'border-slate-400 ring-2 ring-slate-200' : 'border-slate-200 hover:border-slate-300'}`}>
            <p className="text-xs font-bold text-slate-500 uppercase">Total Orders</p>
            <p className="text-2xl font-bold text-slate-900">{orders.length}</p>
          </button>
          <button onClick={() => setFilterStatus(filterStatus === "escrow_active" ? null : "escrow_active")} className={`bg-white p-4 rounded-xl border shadow-sm text-left transition hover:shadow-md ${filterStatus === "escrow_active" ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300'}`}>
            <p className="text-xs font-bold text-blue-600 uppercase">Pending</p>
            <p className="text-2xl font-bold text-blue-700">{orders.filter(o => o.status === "escrow_active").length}</p>
          </button>
          <button onClick={() => setFilterStatus(filterStatus === "shipped" ? null : "shipped")} className={`bg-white p-4 rounded-xl border shadow-sm text-left transition hover:shadow-md ${filterStatus === "shipped" ? 'border-purple-500 ring-2 ring-purple-200' : 'border-slate-200 hover:border-purple-300'}`}>
            <p className="text-xs font-bold text-purple-600 uppercase">Shipped</p>
            <p className="text-2xl font-bold text-purple-700">{orders.filter(o => o.status === "shipped").length}</p>
          </button>
          <button onClick={() => setFilterStatus(filterStatus === "completed" ? null : "completed")} className={`bg-white p-4 rounded-xl border shadow-sm text-left transition hover:shadow-md ${filterStatus === "completed" ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200 hover:border-emerald-300'}`}>
            <p className="text-xs font-bold text-emerald-600 uppercase">Completed</p>
            <p className="text-2xl font-bold text-emerald-700">{orders.filter(o => o.status === "completed").length}</p>
          </button>
          <button onClick={() => setFilterStatus(filterStatus?.includes("dispute") ? null : "dispute_open")} className={`bg-white p-4 rounded-xl border shadow-sm text-left transition hover:shadow-md ${filterStatus?.includes("dispute") ? 'border-rose-500 ring-2 ring-rose-200' : 'border-rose-200 hover:border-rose-400 bg-rose-50'}`}>
            <p className="text-xs font-bold text-rose-600 uppercase">⚠️ Disputes</p>
            <p className="text-2xl font-bold text-rose-700">{orders.filter(o => o.status === "dispute_open" || o.status === "dispute_under_review").length}</p>
          </button>
        </div>

        {filterStatus && (
          <div className="mb-4 flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
            <span className="text-sm font-bold text-amber-800">🔍 Filtering by: <span className="uppercase">{filterStatus.replace("_", " ")}</span></span>
            <button onClick={() => setFilterStatus(null)} className="text-xs font-bold text-amber-700 hover:text-amber-900 underline">Clear Filter</button>
          </div>
        )}

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-bold text-slate-700">Order ID</th>
                  <th className="px-6 py-3 font-bold text-slate-700">Buyer</th>
                  <th className="px-6 py-3 font-bold text-slate-700">Total</th>
                  <th className="px-6 py-3 font-bold text-slate-700">Status</th>
                  <th className="px-6 py-3 font-bold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-8 text-center text-slate-500">{filterStatus ? `No orders found with status: ${filterStatus}` : "No orders yet."}</td></tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">#{String(order.id).slice(0, 8)}</td>
                      <td className="px-6 py-4"><p className="text-xs text-slate-500">{order.buyer_email}</p></td>
                      <td className="px-6 py-4 font-bold text-slate-900">${Number(order.total_amount || 0).toFixed(2)}</td>
                      <td className="px-6 py-4"><span className={`inline-flex rounded-full px-2 py-1 text-xs font-bold ${getStatusColor(order.status)}`}>{order.status?.replace("_", " ").toUpperCase() || "PENDING"}</span></td>
                      <td className="px-6 py-4">
                        {order.status === "escrow_active" && <button onClick={() => setShippingModal(order)} className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-purple-700 transition">Mark as Shipped</button>}
                        {order.status === "dispute_open" && <button onClick={() => setDisputeModal(order)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-700 transition">🛡️ Submit Evidence</button>}
                        {order.status === "dispute_under_review" && <span className="inline-flex items-center rounded-lg bg-orange-100 px-3 py-1.5 text-xs font-bold text-orange-800">⏳ Under Review</span>}
                        {order.status === "shipped" && <button className="rounded-lg bg-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 cursor-default">Awaiting Delivery</button>}
                        {order.status === "completed" && <span className="text-xs font-bold text-emerald-600">✅ Completed</span>}
                        {order.status === "canceled" && <span className="text-xs font-bold text-rose-600">❌ Canceled</span>}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      {shippingModal && sellerId && <ShipOrderModal order={shippingModal} sellerId={sellerId} onClose={() => setShippingModal(null)} onUpdated={handleOrderUpdated} />}
      {disputeModal && sellerId && <DisputeEvidenceModal order={disputeModal} sellerId={sellerId} onClose={() => setDisputeModal(null)} onSubmitted={handleDisputeResolved} />}
    </main>
  );
}

function DisputeEvidenceModal({ order, sellerId, onClose, onSubmitted }: { order: any; sellerId: string | number; onClose: () => void; onSubmitted: () => void }) {
  const [evidenceType, setEvidenceType] = useState("tracking_url");
  const [evidenceValue, setEvidenceValue] = useState("");
  const [evidenceNotes, setEvidenceNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async () => {
    if (!evidenceValue.trim()) { setMessage({ type: "error", text: "Please provide evidence." }); return; }
    setLoading(true); setMessage(null);
    try {
      const res = await fetch("/api/karakata/order/dispute/respond", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.id, seller_id: sellerId, evidence_type: evidenceType, evidence_value: evidenceValue, evidence_notes: evidenceNotes }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage({ type: "success", text: "✅ Evidence submitted! Admin will review within 48 hours." });
        setTimeout(() => onSubmitted(), 2000);
      } else { setMessage({ type: "error", text: data.error || "Failed to submit." }); }
    } catch (err: any) { setMessage({ type: "error", text: err.message || "Network error." }); }
    finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold text-rose-900 mb-2">🛡️ Submit Dispute Evidence</h2>
        <p className="text-sm text-slate-600 mb-4">The buyer has filed a dispute. Submit proof of delivery to claim your funds.</p>
        <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 mb-4">
          <p className="text-xs font-bold text-rose-800 mb-1">Buyer's Claim:</p>
          <p className="text-sm text-rose-900 italic">"{order.dispute_reason || 'No reason provided'}"</p>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-600 mb-1">Type of Evidence</label>
          <select value={evidenceType} onChange={(e) => setEvidenceType(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-rose-400 focus:outline-none">
            <option value="tracking_url">Carrier Tracking URL</option>
            <option value="delivery_photo_link">Direct Link to Delivery Photo</option>
            <option value="other">Other Documentation</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-xs font-bold text-slate-600 mb-1">Evidence (URL / Details)</label>
          <input type="text" value={evidenceValue} onChange={(e) => setEvidenceValue(e.target.value)} placeholder="https://..." className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-rose-400 focus:outline-none" />
        </div>
        {message && <div className={`mb-4 p-3 rounded-lg text-xs ${message.type === "success" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>{message.text}</div>}
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-bold text-sm hover:bg-slate-200 transition">Cancel</button>
          <button onClick={handleSubmit} disabled={loading} className="flex-1 bg-rose-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-rose-700 transition disabled:opacity-50">{loading ? "Submitting..." : "Submit Evidence"}</button>
        </div>
      </div>
    </div>
  );
}
