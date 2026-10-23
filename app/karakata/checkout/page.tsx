"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Read cart from localStorage on client-side mount
    const savedCart = localStorage.getItem("kara_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
    setLoading(false);
  }, []);

  // Calculate totals dynamically
  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) || Number(item.price_usd) || 0) * (item.qty || 1), 0);
  const escrowFee = subtotal * 0.05; // 5% Smart Escrow Buffer
  const total = subtotal + escrowFee;

  const handleCheckout = async () => {
    setProcessing(true);
    try {
      // We will wire this to the order API in Step 2
      const response = await fetch("/api/karakata/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cart, total, escrowFee }),
      });
      
      const data = await response.json();
      
      if (data.ok && data.url) {
        // Redirect to Stripe Checkout
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to initialize checkout. Please try again.");
        setProcessing(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("A network error occurred. Please try again.");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600 font-bold animate-pulse">Loading your secure checkout...</p>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">Your cart is empty</h1>
        <p className="text-slate-600 mb-8">Looks like you haven't added any amazing products yet.</p>
        <Link href="/karakata" className="bg-amber-400 text-slate-900 px-8 py-3 rounded-xl font-bold hover:bg-amber-300 transition">
          Continue Shopping
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <Link href="/karakata" className="text-sm font-bold text-emerald-700 hover:underline mb-6 inline-block">
          ← Continue Shopping
        </Link>

        <h1 className="text-3xl font-bold text-slate-900 mb-8">Secure Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: Order Summary */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Order Summary ({cart.length} items)</h2>
              <div className="space-y-4">
                {cart.map((item, index) => (
                  <div key={index} className="flex gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <img 
                      src={item.image_url || "https://via.placeholder.com/80"} 
                      alt={item.title} 
                      className="w-20 h-20 rounded-lg object-cover bg-slate-100"
                    />
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900">{item.title}</h3>
                      <p className="text-sm text-slate-500">Qty: {item.qty || 1}</p>
                      <p className="text-sm font-bold text-emerald-700 mt-1">
                        ${(Number(item.price) || Number(item.price_usd) || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Escrow Protection Badge */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="text-2xl">🛡️</div>
              <div>
                <h3 className="font-bold text-emerald-900">KaraKata Buyer Protection</h3>
                <p className="text-sm text-emerald-800 mt-1">
                  Your payment is protected by our Smart Escrow system. Funds are held securely until you confirm the product matches the description. 
                  <span className="font-bold"> 0% risk to you.</span>
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT: Payment Details */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-6">
              <h2 className="text-xl font-bold mb-6">Payment Details</h2>
              
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between">
                  <span className="text-slate-600">Subtotal</span>
                  <span className="font-bold">${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center group relative">
                  <div className="flex items-center gap-1 text-slate-600 cursor-help">
                    <span>Smart Escrow Buffer (5%)</span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">?</span>
                    <div className="absolute bottom-full right-0 mb-2 w-64 bg-slate-900 text-white text-xs p-3 rounded-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                      This 5% fee is held securely by KaraKata and released to the seller only after you confirm satisfactory delivery.
                    </div>
                  </div>
                  <span className="font-bold text-emerald-700">${escrowFee.toFixed(2)}</span>
                </div>
                <div className="border-t border-slate-200 pt-3 flex justify-between text-lg">
                  <span className="font-bold text-slate-900">Total Due</span>
                  <span className="font-bold text-slate-900">${total.toFixed(2)}</span>
                </div>
              </div>

              <button 
                onClick={handleCheckout}
                disabled={processing}
                className="w-full bg-amber-400 text-slate-900 py-4 rounded-xl font-bold text-lg hover:bg-amber-300 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                {processing ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Proceed to Secure Payment →"
                )}
              </button>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                <span>256-bit SSL Encrypted Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
