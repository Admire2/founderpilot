"use client";

import { useState } from "react";
import Link from "next/link";

export default function TrackOrderPage() {
  const [email, setEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
  };

  return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 max-w-md w-full">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Track Your Order</h1>
        <p className="text-slate-600 mb-6 text-sm">
          Enter the email address or Order ID you used at checkout to view your current order status.
        </p>

        <form onSubmit={handleSearch} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-600 mb-1">Order ID (Optional)</label>
            <input 
              type="text" 
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="e.g., cs_test_..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-400 focus:outline-none"
            />
          </div>
          <button 
            type="submit" 
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition"
          >
            Track Order
          </button>
        </form>

        {searched && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-left">
            <p className="text-sm font-bold text-amber-900 mb-1">🔍 Search Demo</p>
            <p className="text-xs text-amber-800">
              In the next update, this will connect to the database and show: <br/>
              <strong>Status:</strong> Paid & Held in Escrow <br/>
              <strong>Next Step:</strong> Seller is preparing your shipment.
            </p>
          </div>
        )}

        <Link href="/karakata" className="block mt-6 text-sm font-bold text-emerald-700 hover:underline">
          ← Return to Market
        </Link>
      </div>
    </main>
  );
}
