"use client";
import { useState, useEffect } from "react";

export default function AdminDisputesPage() {
  const [passcode, setPasscode] = useState("");
  const [authed, setAuthed] = useState(false);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [action, setAction] = useState<"release_to_seller" | "refund_buyer" | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [resolving, setResolving] = useState(false);
  const [msg, setMsg] = useState("");

  const handleLogin = () => {
    if (passcode === (process.env.NEXT_PUBLIC_ADMIN_PASSCODE || "founder2026")) {
      setAuthed(true);
      fetchDisputes();
    } else {
      alert("Invalid passcode");
    }
  };

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/admin/disputes?key=${passcode}`);
      const j = await r.json();
      if (j.ok) {
        setDisputes(j.disputes);
        setMetrics(j.metrics);
      } else {
        alert(j.error);
      }
    } catch (e) {
      alert("Failed to fetch");
    }
    setLoading(false);
  };

  const handleResolve = async () => {
    if (!selectedDispute || !action) return;
    if (!confirm(`Are you sure you want to ${action === "refund_buyer" ? "REFUND THE BUYER" : "RELEASE FUNDS TO SELLER"} for order #${selectedDispute.id}? This action cannot be undone.`)) return;

    setResolving(true);
    setMsg("");
    try {
      const r = await fetch("/api/admin/disputes/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: passcode,
          order_id: selectedDispute.id,
          action,
          admin_note: adminNote,
          admin_email: "admin@karakata.com"
        })
      });
      const j = await r.json();
      if (j.ok) {
        setMsg(`✅ ${action === "refund_buyer" ? "Refund issued" : "Funds released"} successfully!`);
        setSelectedDispute(null);
        setAction(null);
        setAdminNote("");
        fetchDisputes();
      } else {
        setMsg(`❌ ${j.error}`);
      }
    } catch (e) {
      setMsg("❌ Network error");
    }
    setResolving(false);
  };

  if (!authed) {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700">
          <h1 className="text-2xl font-bold text-amber-400 mb-2">🔐 Admin Access</h1>
          <p className="text-sm text-slate-400 mb-6">Enter admin passcode to access dispute dashboard</p>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            placeholder="Admin passcode"
            className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white mb-4 focus:border-amber-400 focus:outline-none"
          />
          <button onClick={handleLogin} className="w-full bg-amber-500 text-slate-900 py-3 rounded-lg font-bold hover:bg-amber-400 transition">
            Access Dashboard
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">🛡️ Dispute Resolution Center</h1>
            <p className="text-sm text-slate-600 mt-1">God Mode: Review evidence, release escrow, or issue refunds</p>
          </div>
          <button onClick={fetchDisputes} disabled={loading} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50">
            {loading ? "Refreshing..." : "🔄 Refresh"}
          </button>
        </div>

        {/* ✅ METRICS DASHBOARD */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase">Total Disputes</p>
              <p className="text-3xl font-bold text-rose-600 mt-1">{metrics.totalDisputes}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase">Awaiting Seller</p>
              <p className="text-3xl font-bold text-orange-600 mt-1">{metrics.openDisputes}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase">Under Review</p>
              <p className="text-3xl font-bold text-amber-600 mt-1">{metrics.underReview}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase">Total Escrow Held</p>
              <p className="text-3xl font-bold text-emerald-600 mt-1">${metrics.totalEscrowHeld.toFixed(2)}</p>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 p-4">
              <p className="text-xs font-bold text-slate-500 uppercase">Disputed Escrow</p>
              <p className="text-3xl font-bold text-rose-600 mt-1">${metrics.disputeEscrowHeld.toFixed(2)}</p>
            </div>
          </div>
        )}

        {/* ✅ DISPUTES TABLE */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <h2 className="font-bold text-slate-700">Open Disputes ({disputes.length})</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Order</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Buyer</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Seller</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Amount</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Reason</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {disputes.length === 0 ? (
                  <tr><td colSpan={7} className="px-4 py-12 text-center text-slate-500">No open disputes 🎉</td></tr>
                ) : (
                  disputes.map((d) => (
                    <tr key={d.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono text-xs">{String(d.id).slice(0, 8)}...</td>
                      <td className="px-4 py-3 text-xs">{d.buyer_email || "Guest"}</td>
                      <td className="px-4 py-3 text-xs font-bold">{d.seller?.shop_name || "Unknown"}</td>
                      <td className="px-4 py-3 font-bold text-emerald-700">${Number(d.total_amount).toFixed(2)}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          d.status === "dispute_open" ? "bg-orange-100 text-orange-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {d.status === "dispute_open" ? "⚠️ Open" : "📋 Under Review"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate">{d.dispute_reason || "No reason"}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => setSelectedDispute(d)} className="text-xs font-bold text-emerald-700 hover:text-emerald-900">
                          Review →
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ✅ RESOLUTION MODAL */}
        {selectedDispute && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-slate-900">🛡️ Dispute Review</h2>
                <button onClick={() => { setSelectedDispute(null); setAction(null); setMsg(""); }} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
              </div>

              {/* Order Details */}
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="font-bold text-slate-600">Order ID:</span> <span className="font-mono text-xs">{selectedDispute.id}</span></div>
                  <div><span className="font-bold text-slate-600">Amount:</span> <span className="font-bold text-emerald-700">${Number(selectedDispute.total_amount).toFixed(2)}</span></div>
                  <div><span className="font-bold text-slate-600">Buyer:</span> {selectedDispute.buyer_email}</div>
                  <div><span className="font-bold text-slate-600">Seller:</span> {selectedDispute.seller?.shop_name} ({selectedDispute.seller?.email})</div>
                  <div><span className="font-bold text-slate-600">Status:</span> {selectedDispute.status}</div>
                  <div><span className="font-bold text-slate-600">Opened:</span> {new Date(selectedDispute.dispute_opened_at || selectedDispute.created_at).toLocaleString()}</div>
                </div>
              </div>

              {/* Buyer's Reason */}
              <div className="mb-4">
                <h3 className="font-bold text-rose-700 mb-2">📝 Buyer's Dispute Reason</h3>
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-900 italic">
                  "{selectedDispute.dispute_reason || "No reason provided"}"
                </div>
              </div>

              {/* Seller's Evidence */}
              <div className="mb-4">
                <h3 className="font-bold text-emerald-700 mb-2">📎 Seller's Evidence</h3>
                {Array.isArray(selectedDispute.dispute_evidence) && selectedDispute.dispute_evidence.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDispute.dispute_evidence.map((e: any, i: number) => (
                      <div key={i} className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                        <p className="text-xs font-bold text-emerald-700 mb-1">Type: {e.type}</p>
                        <p className="text-sm text-slate-700">{e.note || e.description}</p>
                        {e.url && <a href={e.url} target="_blank" className="text-xs text-blue-600 hover:underline mt-1 block">🔗 View Evidence</a>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-500 italic">
                    Seller has not submitted evidence yet.
                  </div>
                )}
              </div>

              {/* Admin Actions */}
              <div className="border-t border-slate-200 pt-4">
                <h3 className="font-bold text-slate-900 mb-3">⚖️ Your Decision</h3>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Admin notes (required for audit trail)..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-3 focus:border-amber-500 focus:outline-none"
                />
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setAction("refund_buyer")}
                    disabled={!adminNote.trim() || resolving}
                    className="bg-rose-600 text-white py-3 rounded-lg font-bold hover:bg-rose-700 disabled:opacity-50"
                  >
                    💸 Refund Buyer
                  </button>
                  <button
                    onClick={() => setAction("release_to_seller")}
                    disabled={!adminNote.trim() || resolving}
                    className="bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50"
                  >
                    💰 Release to Seller
                  </button>
                </div>
                {action && (
                  <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                    <p className="text-sm font-bold text-amber-900 mb-2">
                      ⚠️ Confirm: You are about to {action === "refund_buyer" ? "REFUND THE BUYER via Stripe" : "RELEASE ESCROW TO SELLER"}
                    </p>
                    <button
                      onClick={handleResolve}
                      disabled={resolving}
                      className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50"
                    >
                      {resolving ? "Processing..." : `Confirm ${action === "refund_buyer" ? "Refund" : "Release"}`}
                    </button>
                  </div>
                )}
                {msg && <p className={`mt-3 text-sm font-bold text-center ${msg.startsWith("✅") ? "text-emerald-700" : "text-rose-700"}`}>{msg}</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
