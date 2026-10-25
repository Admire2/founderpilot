"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function SuccessPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // ✅ 1. CLEAR THE CART FROM LOCALSTORAGE AFTER SUCCESSFUL PAYMENT
    localStorage.removeItem("kara_cart");
    
    // ✅ 2. SHOUT to the browser to update the header badge to 0 instantly
    window.dispatchEvent(new Event("kara_cart_updated"));

    // ✅ 3. Get session_id from URL safely on the client side (No build errors!)
    const params = new URLSearchParams(window.location.search);
    setSessionId(params.get("session_id"));
  }, []);

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 max-w-md w-full">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Order Confirmed! 🎉</h1>
        <p className="text-slate-600 mb-6">
          Thank you for your purchase. Your payment is securely held in <span className="font-bold text-emerald-700">KaraKata Smart Escrow</span> and will be released to the seller only after you confirm satisfactory delivery.
        </p>
        
        {sessionId && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 mb-6 text-xs text-slate-500 font-mono break-all">
            Transaction ID: {sessionId}
          </div>
        )}

        <div className="space-y-3">
          <Link 
            href="/karakata" 
            className="block w-full bg-amber-400 text-slate-900 py-3 rounded-xl font-bold hover:bg-amber-300 transition"
          >
            Continue Shopping
          </Link>
          <Link 
            href="/karakata/sellercenter/orders" 
            className="block w-full bg-white border border-slate-300 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition"
          >
            View Order Status
          </Link>
        </div>
      </div>
    </main>
  );
}