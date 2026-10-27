"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function ShipOrderModal({ 
  order, 
  sellerId, 
  onClose, 
  onUpdated 
}: { 
  order: any; 
  sellerId: string | number; 
  onClose: () => void; 
  onUpdated: () => void; 
}) {
  const [carrier, setCarrier] = useState("fedex");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [customCarrierName, setCustomCarrierName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    // Determine the final carrier string to save
    let finalCarrier = carrier;
    let finalTracking = trackingNumber.trim();

    if (carrier === "custom-local") {
      if (!customCarrierName.trim()) {
        setError("Please enter the name of the local courier (e.g., GIG Logistics).");
        setLoading(false);
        return;
      }
      if (!finalTracking) {
        setError("Please enter the Waybill Number or Tracking URL.");
        setLoading(false);
        return;
      }
      finalCarrier = customCarrierName.trim();
    } else {
      if (finalTracking.length < 5) {
        setError("Please enter a valid tracking number (at least 5 characters).");
        setLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/karakata/order/ship", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          order_id: order.id,
          seller_id: sellerId,
          carrier: finalCarrier,
          tracking_number: finalTracking,
        }),
      });

      const data = await res.json();

      if (data.ok) {
        setSuccess("✅ Order marked as shipped! Buyer has been notified.");
        setTimeout(() => {
          onUpdated();
        }, 1500);
      } else {
        setError(data.error || "Failed to update shipping status.");
      }
    } catch (err: any) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-slate-900">📦 Mark as Shipped</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-slate-600 mb-6">
          Order <span className="font-mono font-bold text-slate-900">#{String(order.id).slice(0, 8)}</span>
          <br />
          Enter the carrier and tracking details to notify the buyer and start the delivery timeline.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 font-medium">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Carrier Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Shipping Carrier</label>
            <select 
              value={carrier} 
              onChange={(e) => {
                setCarrier(e.target.value);
                setTrackingNumber(""); // Reset tracking when carrier changes
                setCustomCarrierName("");
              }} 
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition"
            >
              <option value="fedex">FedEx</option>
              <option value="ups">UPS</option>
              <option value="usps">USPS</option>
              <option value="dhl">DHL Express</option>
              <option value="custom-local">🌍 Custom / Local Courier (e.g., GIG Logistics, Sendy)</option>
            </select>
          </div>

          {/* ✅ CONDITIONAL: Custom Local Courier Fields */}
          {carrier === "custom-local" && (
            <div className="space-y-4 p-4 bg-amber-50 border border-amber-200 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1">Local Carrier Name</label>
                <input 
                  type="text"
                  value={customCarrierName}
                  onChange={(e) => setCustomCarrierName(e.target.value)}
                  placeholder="e.g., GIG Logistics, Red Star Express, Sendy"
                  className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-amber-900 mb-1">Waybill Number or Tracking URL</label>
                <input 
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="e.g., GIG123456789 or https://giglogistics.com/track..."
                  className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none transition"
                />
                <p className="text-xs text-amber-700 mt-1">
                  💡 The buyer will see this exact name and be able to click the link/number to track on the carrier's website.
                </p>
              </div>
            </div>
          )}

          {/* Standard Carrier Tracking Input */}
          {carrier !== "custom-local" && (
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Tracking Number</label>
              <input 
                type="text"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder={`Enter ${carrier.toUpperCase()} tracking number`}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 focus:outline-none transition"
              />
              <p className="text-xs text-slate-500 mt-1">
                Real-time tracking updates will be automatically synced for major carriers.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button 
              type="button" 
              onClick={onClose} 
              disabled={loading}
              className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || !!success}
              className="flex-1 bg-purple-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-purple-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                "Confirm Shipment"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
