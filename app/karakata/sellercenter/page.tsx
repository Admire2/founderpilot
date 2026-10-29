"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // ✅ Added for smart back navigation
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SellerCenter() {
  const router = useRouter(); // ✅ Initialize router
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stripeSuccess, setStripeSuccess] = useState(false);
  
  // ... (Keep all your existing state variables: shopName, email, phone, whatsapp, city, country, category, craft, title, price, desc, file, pBusy, lBusy, pMsg, lMsg, etc.) ...
  // NOTE: Since I can't see your full state list in the snippet, please ensure you keep your existing `useState` declarations exactly as they were. 
  // Just replace the `return (...)` JSX block below, and ensure `const router = useRouter();` is at the top of the component.

  // ... [KEEP YOUR EXISTING useEffect, addShop, addProduct, and connectStripe functions EXACTLY AS THEY ARE] ...

  const inp = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500";

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Nav */}
      <div className="border-b border-slate-200 bg-white px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        {/* ✅ SMART BACK BUTTON: Respects browser history */}
        <button 
          onClick={() => window.history.length > 1 ? router.back() : router.push('/karakata/build')} 
          className="text-sm font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition"
        >
          ← Back
        </button>
        <div className="flex gap-3">
          <Link href="/karakata/sellercenter/orders" className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 transition">Orders</Link>
          <Link href="/karakata/sellercenter/messages" className="rounded-lg bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-200 transition">Messages</Link>
          <Link href="/karakata/sellercenter/shipping" className="rounded-lg bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700 hover:bg-blue-200 transition">Shipping Profiles</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-slate-900">🧑‍💼 Seller Onboarding</h1>
        <p className="mt-2 text-slate-600">Launch your store in 3 simple steps. No listing fees, AI-empowered.</p>

        {/* Progress Bar */}
        <div className="mt-8 mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex flex-col items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition ${step >= s ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-300 text-slate-400"}`}>
                  {step > s ? "✓" : s}
                </div>
                <p className={`mt-2 text-xs font-bold ${step >= s ? "text-emerald-700" : "text-slate-400"}`}>
                  {s === 1 ? "Shop Profile" : s === 2 ? "First Listing" : "Get Paid"}
                </p>
              </div>
            ))}
          </div>
          <div className="relative -mt-6 mb-8">
            <div className="absolute top-5 left-0 w-full h-1 bg-slate-200 -z-10 rounded" />
            <div className="absolute top-5 left-0 h-1 bg-emerald-600 transition-all duration-500 -z-10 rounded" style={{ width: `${((step - 1) / 2) * 100}%` }} />
          </div>
        </div>

        {/* STEP 1: SHOP PROFILE */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ... [KEEP YOUR EXACT STEP 1 JSX HERE: Shop Name, Email, Phone, WhatsApp, City, Country, Category, Craft inputs] ... */}
            <div className="mt-6 flex justify-end">
              <button onClick={addShop} disabled={pBusy} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition flex items-center gap-2 shadow-sm">
                {pBusy ? "Saving..." : "Save & Continue →"}
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: FIRST LISTING */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Step 2: Add Your First Product</h2>
            <p className="text-sm text-slate-500 mb-6">Upload a photo, set your price, and go live. You can add more later.</p>

            {/* ... [KEEP YOUR EXACT STEP 2 JSX HERE: Photo, Title, Price, Description inputs] ... */}

            <div className="mt-6 flex justify-between items-center">
              <button onClick={() => setStep(1)} className="text-slate-500 font-bold hover:text-slate-800 text-sm transition">← Back</button>
              <button onClick={addProduct} disabled={lBusy} className="bg-amber-500 text-slate-900 px-8 py-3 rounded-xl font-bold hover:bg-amber-400 disabled:opacity-50 transition flex items-center gap-2 shadow-sm">
                {lBusy ? "Publishing..." : "Publish Product & Continue →"}
              </button>
            </div>

            {/* ✅ INDUSTRY STANDARD: Advanced Options for Complex Products */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Need advanced listing options?</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/karakata/studio" className="flex-1 flex items-center gap-3 p-3 rounded-lg border border-cyan-200 bg-cyan-50 hover:bg-cyan-100 transition">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <p className="text-sm font-bold text-cyan-800">AI Listing Generator</p>
                    <p className="text-[11px] text-cyan-600">Let AI write your title, description & tags (2 credits)</p>
                  </div>
                </Link>
                <Link href="/karakata/list" className="flex-1 flex items-center gap-3 p-3 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 transition">
                  <span className="text-2xl">⚙️</span>
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Advanced Variant Builder</p>
                    <p className="text-[11px] text-emerald-600">Selling multiple sizes, colors, or materials? Click here.</p>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: GET PAID */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* ... [KEEP YOUR EXACT STEP 3 JSX HERE: Stripe/Bank connection UI] ... */}
            <div className="flex justify-between items-center">
              <button onClick={() => setStep(2)} className="text-slate-500 font-bold hover:text-slate-800 text-sm transition">← Back</button>
              <Link href="/karakata/sellercenter/dashboard" className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-sm">
                Go to Seller Dashboard →
              </Link>
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">Founding sellers: 0% commission for 6 months, then 8-10% only when you sell. No subscriptions, no listing fees.</p>
      </div>
    </main>
  );
}
