"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SuccessPage() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [claimEmail, setClaimEmail] = useState("");
  const [claimPassword, setClaimPassword] = useState("");
  const [claiming, setClaiming] = useState(false);
  const [claimMsg, setClaimMsg] = useState("");

  useEffect(() => {
    // ✅ 1. CLEAR THE CART FROM LOCALSTORAGE AFTER SUCCESSFUL PAYMENT
    localStorage.removeItem("kara_cart");
    sessionStorage.removeItem("kara_guest_checkout_email"); // Clean up session storage
    
    // ✅ 2. SHOUT to the browser to update the header badge to 0 instantly
    window.dispatchEvent(new Event("kara_cart_updated"));

    // ✅ 3. Get session_id from URL safely on the client side
    const params = new URLSearchParams(window.location.search);
    setSessionId(params.get("session_id"));

    // ✅ 4. Check if user is logged in (Guest Detection)
    const checkAuth = async () => {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) {
        setIsGuest(true);
        // Try to pre-fill from session storage if checkout saved it
        const savedEmail = sessionStorage.getItem("kara_guest_checkout_email");
        if (savedEmail) setClaimEmail(savedEmail);
      }
    };
    checkAuth();
  }, []);

  const handleClaimOrder = async () => {
    if (!claimEmail || !claimEmail.includes("@") || claimPassword.length < 6) {
      setClaimMsg("⚠️ Please enter a valid email and a password (min 6 chars).");
      return;
    }
    setClaiming(true);
    setClaimMsg("");

    try {
      // ✅ Sign up the guest user instantly
      const { error } = await sb.auth.signUp({
        email: claimEmail.trim().toLowerCase(),
        password: claimPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/karakata/track`,
        }
      });

      if (error) {
        setClaimMsg(`⚠️ ${error.message}`);
      } else {
        setClaimMsg("✅ Account created! Please check your email to verify and track your order.");
        setIsGuest(false); // Hide the form after success
      }
    } catch (err) {
      setClaimMsg("⚠️ An unexpected error occurred.");
    }
    setClaiming(false);
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 max-w-lg w-full">
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

        {/* ✅ INDUSTRY STANDARD: Post-Purchase Guest Verification */}
        {isGuest ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 text-left">
            <h3 className="font-bold text-amber-900 mb-2 flex items-center gap-2">
              📦 Claim This Order
            </h3>
            <p className="text-sm text-amber-800 mb-4">
              Enter the email you used at checkout to create a free account. This lets you track this order, manage returns, and checkout faster next time.
            </p>
            <div className="space-y-3">
              <input 
                type="email" 
                value={claimEmail}
                onChange={(e) => setClaimEmail(e.target.value)}
                placeholder="Email used at checkout" 
                className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
              <input 
                type="password" 
                value={claimPassword}
                onChange={(e) => setClaimPassword(e.target.value)}
                placeholder="Create a password (min 6 chars)" 
                className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 focus:outline-none"
              />
              <button 
                onClick={handleClaimOrder} 
                disabled={claiming}
                className="w-full bg-amber-500 text-slate-900 py-2.5 rounded-lg font-bold hover:bg-amber-400 transition disabled:opacity-50"
              >
                {claiming ? "Creating Account..." : "Create Account & Claim Order"}
              </button>
              {claimMsg && <p className="text-xs font-bold text-center text-amber-900">{claimMsg}</p>}
            </div>
          </div>
        ) : (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-bold text-emerald-800 flex items-center gap-2">
              ✅ This order is already saved to your account!
            </p>
          </div>
        )}

        <div className="space-y-3">
          <Link 
            href="/karakata/track" 
            className="block w-full bg-emerald-600 text-white py-3 rounded-xl font-bold hover:bg-emerald-700 transition text-center"
          >
            Track Your Order
          </Link>
          <Link 
            href="/karakata" 
            className="block w-full bg-white border border-slate-300 text-slate-700 py-3 rounded-xl font-bold hover:bg-slate-50 transition text-center"
          >
            Continue Shopping
          </Link>
          <p className="text-xs text-slate-500 mt-4">
            💡 A payment receipt has been sent to the email address provided at checkout.
          </p>
        </div>
      </div>
    </main>
  );
}
