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
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [disputeReason, setDisputeReason] = useState("");
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

  const handleReportProblem = async () => {
    if (disputeReason.trim().length < 5) {
      setActionMessage({ type: "error", text: "Please provide details about the issue (at least 5 characters)." });
      return;
    }
    setDisputeLoading(true);
    setActionMessage(null);
    try {
      const res = await fetch("/api/karakata/order/dispute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order_id: order.id, reason: disputeReason }),
      });
      const data = await res.json();
      if (data.ok) {
        setActionMessage({ type: "success", text: "🛡️ Dispute filed. Funds are frozen in Escrow. KaraKata support will review the seller's proof of delivery." });
        setOrder({ ...order, status: "dispute_open" });
        setShowDisputeModal(false);
        setDisputeReason("");
      } else {
        setActionMessage({ type: "error", text: data.error || "Failed to file dispute." });
      }
    } catch (err: any) {
      setActionMessage({ type: "error", text: err.message || "Network error." });
    } finally {
      setDisputeLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "escrow_active": return "bg-blue-100 text-blue-800";
      case "shipped": return "bg-purple-100 text-purple-800";
      case "dispute_open": return "bg-rose-100 text-rose-800";
      case "completed": return "bg-emerald-100 text-emerald-800";
      case "canceled": return "bg-slate-100 text-slate-800";
      default: return "bg-slate-100 text-slate-800";
    }
  };

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
                {order.status.replace("_", " ").toUpperCase()}
              </span>
            </div>
            <div className="space-y-2 text-xs text-emerald-800">
              <p><strong>Amount:</strong> ${Number(order.total_amount).toFixed(2)}</p>
              <p><strong>Escrow Held:</strong> ${Number(order.escrow_amount).toFixed(2)}</p>
              
              {/* ✅ MULTI-STAGE TRACKING TIMELINE */}
              {order.tracking_stages && Array.isArray(order.tracking_stages) && order.tracking_stages.length > 0 && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-emerald-200">
                  <p className="font-bold text-slate-900 mb-3">📦 Shipment Timeline</p>
                  <div className="space-y-3">
                    {order.tracking_stages
                      .sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime())
                      .map((stage: any, idx: number) => {
                        const labels: Record<string, string> = {
                          label_created: "Label Created",
                          picked_up: "Picked Up by Carrier",
                          in_transit: "In Transit",
                          out_for_delivery: "Out for Delivery 🚚",
                          delivered: "Delivered ✅",
                        };
                        const isLatest = idx === order.tracking_stages.length - 1;
                        return (
                          <div key={idx} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <div className={`w-3 h-3 rounded-full ${isLatest ? "bg-purple-600 ring-4 ring-purple-100" : "bg-slate-300"}`}></div>
                              {idx < order.tracking_stages.length - 1 && <div className="w-0.5 flex-1 bg-slate-200 mt-1"></div>}
                            </div>
                            <div className="flex-1 pb-3">
                              <p className={`text-sm font-bold ${isLatest ? "text-purple-900" : "text-slate-700"}`}>
                                {labels[stage.stage] || stage.stage}
                              </p>
                              <p className="text-xs text-slate-500">
                                {new Date(stage.time).toLocaleString()} · {stage.location}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                  {order.tracking_number && (
                    <a 
                      href={`https://www.fedex.com/fedextrack/?trknbr=${order.tracking_number}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 block text-xs font-bold text-blue-600 hover:underline"
                    >
                      View on {order.carrier?.toUpperCase()} website →
                    </a>
                  )}
                </div>
              )}

              {/* Fallback if no tracking stages but we have a tracking number */}
              {(!order.tracking_stages?.length) && order.tracking_number && (
                <div className="mt-3 p-3 bg-white rounded-lg border border-emerald-200">
                  <p className="font-bold text-slate-900 mb-1">📦 Tracking Information</p>
                  <p className="text-slate-600">Carrier: {order.carrier?.toUpperCase()}</p>
                  <p className="text-slate-600">Tracking: {order.tracking_number}</p>
                </div>
              )}

              {/* ✅ THE INDUSTRY-STANDARD DUAL-ACTION UI */}
              {order.status === "shipped" && (
                <div className="mt-4 pt-4 border-t border-emerald-200 space-y-3">
                  <p className="text-xs text-slate-600">
                    Please inspect your item. If everything is perfect, click below to release the funds. 
                    <br/><span className="font-bold text-amber-700">Note: Funds will auto-release in 7 days if no action is taken.</span>
                  </p>
                  <button onClick={handleConfirmReceipt} disabled={confirmLoading} className="w-full bg-emerald-600 text-white py-2.5 rounded-lg font-bold text-sm hover:bg-emerald-700 transition disabled:opacity-50">
                    {confirmLoading ? "Processing..." : "✅ Confirm Receipt & Release Funds"}
                  </button>
                  <button onClick={() => setShowDisputeModal(true)} className="w-full bg-white border border-rose-300 text-rose-700 py-2.5 rounded-lg font-bold text-sm hover:bg-rose-50 transition">
                    ⚠️ Report a Problem (Freeze Escrow)
                  </button>
                </div>
              )}

              {order.status === "dispute_open" && (
                <div className="mt-4 pt-4 border-t border-rose-200">
                  <p className="text-xs font-bold text-rose-800">🛡️ Escrow Frozen: A dispute is open. KaraKata support is reviewing the seller's proof of delivery. Funds cannot be released until resolved.</p>
                </div>
              )}

              {order.status === "completed" && <p className="mt-2 font-bold text-emerald-800">✅ Order completed. Funds released to seller.</p>}
            </div>

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

      {/* ✅ DISPUTE MODAL */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Report a Problem</h2>
            <p className="text-sm text-slate-600 mb-4">
              This will immediately <strong>freeze the escrow funds</strong>. KaraKata support will contact the seller to provide proof of delivery (e.g., carrier photo). 
            </p>
            <label className="block text-xs font-bold text-slate-600 mb-1">What is the issue?</label>
            <textarea 
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="e.g., Package never arrived, item was damaged, wrong item received..."
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-rose-400 focus:outline-none min-h-[100px]"
            />
            <div className="flex gap-2 mt-4">
              <button onClick={() => setShowDisputeModal(false)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-bold text-sm hover:bg-slate-200 transition">Cancel</button>
              <button onClick={handleReportProblem} disabled={disputeLoading} className="flex-1 bg-rose-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-rose-700 transition disabled:opacity-50">
                {disputeLoading ? "Filing..." : "Freeze Funds & Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
