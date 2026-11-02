"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

function getStatusBadge(status: string) {
  switch (status?.toLowerCase()) {
    case "delivered": case "completed":
      return { bg: "bg-emerald-100", text: "text-emerald-800", border: "border-emerald-200", label: "✅ Delivered" };
    case "shipped":
      return { bg: "bg-blue-100", text: "text-blue-800", border: "border-blue-200", label: "🚚 Shipped" };
    case "escrow_active": case "paid": case "placed":
      return { bg: "bg-amber-100", text: "text-amber-800", border: "border-amber-200", label: "⏳ Processing" };
    case "refunded": case "cancelled": case "canceled":
      return { bg: "bg-rose-100", text: "text-rose-800", border: "border-rose-200", label: "❌ Cancelled/Refunded" };
    case "dispute_open":
      return { bg: "bg-orange-100", text: "text-orange-800", border: "border-orange-200", label: "⚠️ Dispute Open" };
    default:
      return { bg: "bg-slate-100", text: "text-slate-800", border: "border-slate-200", label: status?.toUpperCase() || "Unknown" };
  }
}

function OrderDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("orderId") || searchParams.get("id");
  const email = searchParams.get("email");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id || !email) {
      setError("Missing order ID or email. Please use the link from your confirmation email.");
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      try {
        // ✅ SECURE & QUOTA-FRIENDLY: Requires BOTH order ID and buyer email to view
        const { data, error: fetchError } = await sb
          .from("kara_orders")
          .select("*")
          .eq("id", id)
          .eq("buyer_email", email)
          .single();

        if (fetchError || !data) {
          setError("Order not found or you do not have permission to view it.");
        } else {
          setOrder(data);
        }
      } catch (err) {
        setError("An error occurred while loading your order.");
      }
      setLoading(false);
    };

    fetchOrder();
  }, [id, email]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600 font-bold animate-pulse">Loading order details...</p>
      </main>
    );
  }

  if (error || !order) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center max-w-md w-full">
          <div className="text-4xl mb-4">🔒</div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <Link href="/karakata" className="inline-block bg-emerald-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-emerald-700 transition">
            Return to Marketplace
          </Link>
        </div>
      </main>
    );
  }

  const statusInfo = getStatusBadge(order.status);
  const items = Array.isArray(order.items) ? order.items : (order.items ? [order.items] : []);
  const orderDate = new Date(order.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  return (
    <main className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link href="/account/orders" className="text-sm font-bold text-emerald-700 hover:underline mb-4 inline-block">
            ← Back to Your Orders
          </Link>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Order Details</h1>
              <p className="text-sm text-slate-500 mt-1">
                Order placed on {orderDate} • Order #<span className="font-mono font-bold text-slate-700">{order.code || String(order.id).slice(0, 8).toUpperCase()}</span>
              </p>
            </div>
            <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold border ${statusInfo.bg} ${statusInfo.text} ${statusInfo.border}`}>
              {statusInfo.label}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Items & Shipping */}
          <div className="lg:col-span-2 space-y-6">
            {/* Items List */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Items in this order</h2>
              <div className="space-y-4">
                {items.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4 pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                    <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center text-2xl flex-shrink-0">
                      📦
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900">{item.title || "Product"}</h3>
                      <p className="text-sm text-slate-500 mt-1">Qty: {item.qty || 1} • ${Number(item.unit_price || item.price_usd || 0).toFixed(2)} each</p>
                      <Link href={`/karakata/sellers/${item.seller_id}`} className="text-xs font-bold text-emerald-700 hover:underline mt-2 inline-block">
                        Sold by: Store #{item.seller_id}
                      </Link>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-slate-900">${Number((item.unit_price || item.price_usd || 0) * (item.qty || 1)).toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            {order.address && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-2">Shipping Address</h2>
                <p className="text-slate-700 whitespace-pre-line">{order.address}</p>
              </div>
            )}
          </div>

          {/* Right Column: Summary & Actions */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Items:</span>
                  <span className="font-medium text-slate-900">${Number(order.total_amount || order.total || 0).toFixed(2)}</span>
                </div>
                {order.shipping_cost && Number(order.shipping_cost) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-slate-600">Shipping:</span>
                    <span className="font-medium text-slate-900">${Number(order.shipping_cost).toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-slate-200 pt-3 flex justify-between">
                  <span className="font-bold text-slate-900">Total:</span>
                  <span className="font-bold text-xl text-slate-900">${Number(order.total_amount || order.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Tracking & Actions */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              {order.tracking_number ? (
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">🚚 Tracking Information</h3>
                  <p className="text-sm text-slate-600 mb-3">Carrier: {order.carrier || "Standard"}</p>
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <p className="text-xs text-slate-500 uppercase font-bold">Tracking Number</p>
                    <p className="font-mono font-bold text-slate-900">{order.tracking_number}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm font-bold text-amber-900">⏳ Awaiting Shipment</p>
                  <p className="text-xs text-amber-700 mt-1">The seller is preparing your order. You will receive an email with tracking info once it ships.</p>
                </div>
              )}

              <div className="space-y-3 pt-2">
                {order.status === "delivered" || order.status === "completed" ? (
                  <Link href={`/karakata/review?orderId=${order.id}`} className="block w-full text-center bg-amber-500 text-white py-3 rounded-lg font-bold hover:bg-amber-600 transition">
                    ⭐ Leave a Review
                  </Link>
                ) : null}
                
                {(order.status === "shipped" || order.status === "escrow_active") && (
                  <Link href={`/karakata/track?orderId=${order.id}&email=${encodeURIComponent(email)}`} className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">
                    📍 Track Package
                  </Link>
                )}

                <Link href="/karakata" className="block w-full text-center bg-slate-100 text-slate-700 py-3 rounded-lg font-bold hover:bg-slate-200 transition">
                  Continue Shopping
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="animate-pulse">Loading...</p></div>}>
      <OrderDetailContent />
    </Suspense>
  );
}
