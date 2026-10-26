"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function TrackOrderPage() {
  const [email, setEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const urlEmail = params.get("email");
      const urlOrderId = params.get("orderId");
      if (urlEmail) setEmail(urlEmail);
      if (urlOrderId) setOrderId(urlOrderId);
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setOrder(null);
    setActionMessage(null);

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
        setError("No orders found matching those details.");
      }
    } catch (err: any) {
      setError("An error occurred while searching.");
    } finally {
      setLoading(false);
    }
  };

  const handleInstantCancel = async () => {
    if (!confirm("Are you sure you want to cancel this order? A full refund will be issued.")) return;
    setCancelLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch("/api/karakata/order/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.id, mode: "instant" }),
      });
      const data = await res.json();
      if (data.ok) {
        setActionMessage({ type: "success", text: "✅ Order canceled! A full refund has been issued." });
        setOrder({ ...order, status: "canceled" });
      } else {
        setActionMessage({ type: "error", text: data.error || "Failed to cancel order." });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Network error." });
    } finally {
      setCancelLoading(false);
    }
  };

  const handleRequestCancel = async () => {
    if (cancelReason.trim().length < 5) {
      setActionMessage({ type: "error", text: "Please provide a reason (at least 5 characters)." });
      return;
    }
    setCancelLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch("/api/karakata/order/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.id, mode: "request", reason: cancelReason }),
      });
      const data = await res.json();
      if (data.ok) {
        setActionMessage({ type: "success", text: "✅ Cancellation request sent to seller." });
        setOrder({ ...order, status: "cancellation_requested" });
        setShowRequestModal(false);
        setCancelReason("");
      } else {
        setActionMessage({ type: "error", text: data.error || "Failed to submit request." });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Network error." });
    } finally {
      setCancelLoading(false);
    }
  };

  // ✅ NEW: CONFIRM RECEIPT & RELEASE FUNDS
  const handleConfirmReceipt = async () => {
    if (!confirm("Are you sure you received the item in good condition? This will release the funds to the seller.")) return;
    setConfirmLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch("/api/karakata/order/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.id, buyer_email: order.buyer_email }),
      });
      const data = await res.json();
      if (data.ok) {
        setActionMessage({ type: "success", text: "✅ Thank you! Funds have been released to the seller." });
        setOrder({ ...order, status: "completed" });
      } else {
        setActionMessage({ type: "error", text: data.error || "Failed to confirm receipt." });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Network error." });
    } finally {
      setConfirmLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "escrow_active": return "bg-blue-100 text-blue-800";
      case "cancellation_requested": return "bg-amber-100 text-amber-800";
      case "canceled": return "bg-rose-100 text-rose-800";
      case "shipped": return "bg-purple-100 text-purple-800";
      case "delivered": return "bg-indigo-100 text-indigo-800";
      case "completed": return "bg-emerald-100 text-emerald-800";
      case "pending_payment": return "bg-slate-100 text-slate-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

  const getCancelState = () => {
    if (!order) return null;
    if (order.status !== "escrow_active") return null;
    const createdAt = new Date(order.created_at);
    const now = new Date();
    const minutesSince = (now.getTime() - createdAt.getTime()) / (1000 * 60);
    if (minutesSince <= 60) return { type: "instant", minutesRemaining: Math.floor(60 - minutesSince) };
    return { type: "request" };
  };

  const cancelState = getCancelState();

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 max-w-md w-full">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 mb-2 text-center">Track Your Order</h1>
        <p className="text-slate-600 mb-6 text-sm text-center">Enter the email address or Stripe Order ID you used at checkout.</p>

        <form onSubmit={handleSearch} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-400 focus:outline-none" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Order ID (Optional)</label>
            <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="e.g., cs_test_..." className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-400 focus:outline-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition disabled:opacity-50">
            {loading ? "Searching..." : "Track Order"}
          </button>
        </form>

        {error && <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-sm font-bold text-red-900">⚠️ {error}</p></div>}

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
              
              {order.status === "escrow_active" && <p className="mt-2 font-bold">Next Step: Seller is preparing your shipment.</p>}
              {order.status === "cancellation_requested" && <p className="mt-2 font-bold text-amber-800">⏳ Awaiting seller's response (up to 24 hours).</p>}
              {order.status === "canceled" && <p className="mt-2 font-bold text-rose-800">✅ Refund issued. Check your email.</p>}
              
              {/* ✅ NEW: CONFIRM RECEIPT UI */}
              {(order.status === "shipped" || order.status === "delivered") && (
                <div className="mt-4 pt-4 border-t border-emerald-200">
                  <p className="text-xs text-indigo-800 mb-2 font-bold">📦 Your item has been shipped/delivered.</p>
                  <p className="text-xs text-slate-600 mb-3">Please inspect your item. If everything is perfect, click below to release the funds to the seller.</p>
                  <button onClick={handleConfirmReceipt} disabled={confirmLoading} className="w-full bg-emerald-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-emerald-700 transition disabled:opacity-50">
                    {confirmLoading ? "Processing..." : "Confirm Receipt & Release Funds"}
                  </button>
                </div>
              )}
              {order.status === "completed" && <p className="mt-2 font-bold text-emerald-800">✅ Order completed. Funds released to seller.</p>}
            </div>

            {cancelState && (
              <div className="mt-4 pt-4 border-t border-emerald-200">
                {cancelState.type === "instant" && (
                  <div>
                    <p className="text-xs text-blue-800 mb-2 font-bold">⏱️ Oops Window: {cancelState.minutesRemaining} min remaining</p>
                    <button onClick={handleInstantCancel} disabled={cancelLoading} className="w-full bg-rose-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-rose-700 transition disabled:opacity-50">
                      {cancelLoading ? "Processing..." : "Cancel Order (Instant Refund)"}
                    </button>
                  </div>
                )}
                {cancelState.type === "request" && (
                  <button onClick={() => setShowRequestModal(true)} className="w-full bg-amber-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-amber-600 transition">
                    Request Cancellation
                  </button>
                )}
              </div>
            )}

            {actionMessage && (
              <div className={`mt-4 p-3 rounded-lg text-xs ${actionMessage.type === "success" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
                {actionMessage.text}
              </div>
            )}
          </div>
        )}

        <Link href="/karakata" className="block mt-6 text-sm font-bold text-emerald-700 hover:underline text-center">
          ← Return to Market
        </Link>
      </div>

      {showRequestModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Request Cancellation</h2>
            <p className="text-sm text-slate-600 mb-4">The seller has 24 hours to respond.</p>
            <label className="block text-xs font-bold text-slate-600 mb-1">Reason for cancellation</label>
            <textarea value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} placeholder="e.g., Ordered wrong size..." className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-400 focus:outline-none min-h-[100px]" />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowRequestModal(false)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-bold text-sm hover:bg-slate-200 transition">Back</button>
              <button onClick={handleRequestCancel} disabled={cancelLoading} className="flex-1 bg-amber-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-amber-600 transition disabled:opacity-50">{cancelLoading ? "Sending..." : "Submit Request"}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
