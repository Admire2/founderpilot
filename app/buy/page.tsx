"use client";
import { useState } from "react";

const PRICES = {
  maxi: {
    starter: { monthly: "price_1UB2bNBX3gfWpU1TqPs1soRP", yearly: "price_1UB2bNBX3gfWpU1T3yOIhkvD" },
    pro: { monthly: "price_1U9ZyRBX3gfWpU1Twisvlbl6", yearly: "price_1UB2bOBX3gfWpU1TfDhwZFpp" },
    enterprise: { monthly: "price_1UB2bOBX3gfWpU1TMImiq8ul", yearly: "price_1UB2bOBX3gfWpU1TW6oOIOuP" }
  },
  rivet: {
    starter: { monthly: "price_1UB2bPBX3gfWpU1TkhYn2sRG", yearly: "price_1UB2bPBX3gfWpU1TIskBBVXx" },
    pro: { monthly: "price_1UB2bPBX3gfWpU1ThUBG8I6i", yearly: "price_1UB2bQBX3gfWpU1TYvMZic2y" },
    enterprise: { monthly: "price_1UB2bQBX3gfWpU1TStwLn4ku", yearly: "price_1UB2bQBX3gfWpU1T3lpNcHxt" }
  },
  volt: {
    starter: { monthly: "price_1UB2bRBX3gfWpU1TQuYmTKJa", yearly: "price_1UB2bRBX3gfWpU1TbI81kZbj" },
    pro: { monthly: "price_1UB2bRBX3gfWpU1TItgacpgg", yearly: "price_1UB2bRBX3gfWpU1T015fJZfs" },
    enterprise: { monthly: "price_1UB2bSBX3gfWpU1TZ336wZYd", yearly: "price_1UB2bSBX3gfWpU1Tur9SVQTN" }
  },
  terra: {
    starter: { monthly: "price_1UB2bTBX3gfWpU1Tfgao8fM2", yearly: "price_1UB2bTBX3gfWpU1TspHFdk5z" },
    pro: { monthly: "price_1UB2bTBX3gfWpU1T5fTUCOjX", yearly: "price_1UB2bTBX3gfWpU1Td1qTSZMV" },
    enterprise: { monthly: "price_1UB2bUBX3gfWpU1TsuV705zH", yearly: "price_1UB2bUBX3gfWpU1T2oa6nOU3" }
  },
  studio: {
    all: { monthly: "price_1UB2bUBX3gfWpU1TOMs43OOE", yearly: "price_1UB2bVBX3gfWpU1TJneEVnuZ" }
  }
};

const PACKS = [
  { name: "Credit Pack Starter", price: 10, credits: 150, id: "price_1UB2bVBX3gfWpU1TuJ8pFmPw" },
  { name: "Credit Pack Plus", price: 19, credits: 300, id: "price_1UB2bWBX3gfWpU1Tb2ulwp6i" },
  { name: "Credit Pack Pro", price: 59, credits: 1000, id: "price_1UB2bWBX3gfWpU1TqIVDi36g" },
  { name: "Credit Pack Studio", price: 199, credits: 4000, id: "price_1UB2bXBX3gfWpU1TPMB19spQ" }
];

export default function Buy() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  
  const checkout = async (priceId: string, pack?: string, credits?: number) => { let email = ""; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) { const jj = JSON.parse(localStorage.getItem(k) || "null"); email = (jj && jj.user && jj.user.email) || ""; if (email) break; } } } catch (e) {}
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceId: priceId, email: email, pack: pack || "", credits: credits || 0 })
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else alert("Checkout failed - check Stripe keys");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Choose Your Engineering Suite</h1>
        <p className="text-slate-400 mb-8">70-96% cheaper than every competitor. Cancel anytime.</p>
        
        <div className="flex gap-4 mb-8">
          <button onClick={() => setBilling("monthly")} className={billing === "monthly" ? "bg-emerald-500 text-slate-950 px-4 py-2 rounded-lg font-bold" : "bg-slate-800 px-4 py-2 rounded-lg"}>Monthly</button>
          <button onClick={() => setBilling("yearly")} className={billing === "yearly" ? "bg-emerald-500 text-slate-950 px-4 py-2 rounded-lg font-bold" : "bg-slate-800 px-4 py-2 rounded-lg"}>Yearly (save 0%)</button>
        </div>

        {/* Studio Bundle */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">🎯 Studio Bundle (All 4 Suites)</h2>
          <div className="grid md:grid-cols-1 gap-6">
            <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border-2 border-emerald-500 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-2">Studio</h3>
              <p className="text-3xl font-bold mb-4">{billing === "monthly" ? "$599/mo" : "$7,188/yr"}</p>
              <ul className="text-sm text-slate-300 mb-6 space-y-2">
                <li>✓ All 4 suites: Maxi + Rivet + Volt + Terra</li>
                <li>✓ 4,000 credits/month</li>
                <li>✓ Team Plan + Design Review</li>
                <li>✓ 3 seats included</li>
                <li>✓ Priority AI + partner shortlist</li>
              </ul>
              <button onClick={() => checkout(billing === "monthly" ? PRICES.studio.all.monthly : PRICES.studio.all.yearly)} className="w-full bg-emerald-500 text-slate-950 py-3 rounded-lg font-bold hover:bg-emerald-400">Get Studio</button>
            </div>
          </div>
        </div>

        {/* Individual Suites */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Individual Suites</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {(["maxi", "rivet", "volt", "terra"] as const).map((suite) => (
              <div key={suite} className="bg-slate-900 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 capitalize">{suite}</h3>
                {(["starter", "pro", "enterprise"] as const).map((tier) => (
                  <div key={tier} className="mb-4 pb-4 border-b border-slate-800 last:border-0">
                    <p className="font-bold capitalize">{tier}</p>
                    <p className="text-2xl font-bold my-2">
                      {billing === "monthly" ? (tier === "starter" ? "$49" : tier === "pro" ? "$99" : "$299") : (tier === "starter" ? "$588" : tier === "pro" ? "$1,188" : "$3,588")}
                      <span className="text-sm text-slate-400">{billing === "monthly" ? "/mo" : "/yr"}</span>
                    </p>
                    <p className="text-xs text-slate-400 mb-2">
                      {tier === "starter" ? "150 credits/mo" : tier === "pro" ? "500 credits/mo" : "2,000 credits/mo"}
                    </p>
                    <button onClick={() => checkout(billing === "monthly" ? PRICES[suite][tier].monthly : PRICES[suite][tier].yearly)} className="w-full bg-cyan-500 text-slate-950 py-2 rounded-lg font-bold hover:bg-cyan-400 text-sm">Choose {tier}</button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Credit Packs */}
        <div>
          <h2 className="text-2xl font-bold mb-4">One-Time Credit Packs</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {PACKS.map((pack) => (
              <div key={pack.id} className="bg-slate-900 rounded-xl p-6">
                <h3 className="font-bold mb-2">{pack.name}</h3>
                <p className="text-3xl font-bold mb-2">${pack.price}</p>
                <p className="text-sm text-slate-400 mb-4">{pack.credits} credits</p>
                <button onClick={() => checkout(pack.id, pack.name, pack.credits)} className="w-full bg-amber-500 text-slate-950 py-2 rounded-lg font-bold hover:bg-amber-400">Buy Pack</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}