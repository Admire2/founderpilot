"use client";

import { useState } from "react";

const CARRIERS = [
  { value: "fedex", label: "FedEx" },
  { value: "dhl", label: "DHL" },
  { value: "usps", label: "USPS" },
  { value: "ups", label: "UPS" },
  { value: "local-courier", label: "Local Courier / Hand Delivery" },
];

export default function ShipOrderModal({
  order,
  sellerId,
  onClose,
  onUpdated,
}: {
  order: any;
  sellerId: string | number;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [carrier, setCarrier] = useState("fedex");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/karakata/order/ship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          seller_id: sellerId,
          carrier,
          tracking_number: trackingNumber,
        }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType?.includes("application/json")) {
        throw new Error(`Server error (${res.status}). Check the API route and Vercel logs.`);
      }

      const data = await res.json();

      if (data.ok) {
        setMessage({ type: "success", text: "✅ Shipped! The buyer has been emailed their tracking details." });
        onUpdated();
        setTimeout(() => onClose(), 1500);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to mark as shipped." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Network error. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl">
        <h2 className="text-xl font-bold text-slate-900 mb-2">Mark Order as Shipped</h2>
        <p className="text-sm text-slate-600 mb-4">
          Order #{order.id} · ${Number(order.total_amount).toFixed(2)}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Shipping Carrier</label>
            <select
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-purple-400 focus:outline-none"
            >
              {CARRIERS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">
              Tracking Number {carrier === "local-courier" && "(Optional)"}
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="e.g., 1Z999AA10123456784"
              required={carrier !== "local-courier"}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-purple-400 focus:outline-none"
            />
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-xs text-purple-800">
            🛡️ The buyer will be notified immediately. Funds remain in escrow until they confirm receipt.
          </div>

          {message && (
            <div className={`p-3 rounded-lg text-xs ${message.type === "success" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
              {message.text}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-bold text-sm hover:bg-slate-200 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-purple-600 text-white py-2 rounded-lg font-bold text-sm hover:bg-purple-700 transition disabled:opacity-50"
            >
              {loading ? "Processing..." : "Confirm Shipment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
