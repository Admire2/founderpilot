"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const COUNTRIES = [
  "Nigeria", "Ghana", "Kenya", "South Africa", "United States", "United Kingdom", 
  "Canada", "India", "China", "United Arab Emirates", "Australia", "Germany", 
  "France", "Brazil", "Mexico", "Other"
];

const WEIGHT_BRACKETS = [
  { key: "0-5", label: "0 - 5 lbs (Standard Package)" },
  { key: "5-10", label: "5.1 - 10 lbs (Medium Box)" },
  { key: "10-20", label: "10.1 - 20 lbs (Large Box)" },
  { key: "20+", label: "20+ lbs (Freight/Heavy)" }
];

export default function ShippingProfiles() {
  const [email, setEmail] = useState("");
  const [rates, setRates] = useState<any>({});
  const [domesticCountry, setDomesticCountry] = useState("Nigeria");
  const [customCountry, setCustomCountry] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedEmail = localStorage.getItem("kara_seller_onboarding_email");
    if (storedEmail) {
      // Clean the email to prevent hidden space mismatches
      const cleanEmail = storedEmail.trim().toLowerCase();
      setEmail(cleanEmail);
      loadRates(cleanEmail);
    } else {
      setLoading(false);
    }
  }, []);

  const loadRates = async (userEmail: string) => {
    console.log("🔍 Fetching rates for email:", userEmail);
    const { data, error } = await sb.from("sellers").select("shipping_rates, country").eq("email", userEmail).single();
    
    if (error) {
      console.error("❌ Supabase Fetch Error:", error);
    }
    
    if (data) {
      setRates(data.shipping_rates || {});
      if (data.shipping_rates?.domestic_country) {
        setDomesticCountry(data.shipping_rates.domestic_country);
      } else if (data.country) {
        setDomesticCountry(data.country);
      }
    }
    setLoading(false);
  };

  const updateMethod = (region: string, method: string) => {
    setRates((prev: any) => {
      const regionData = prev[region] || {};
      return { ...prev, [region]: { ...regionData, method } };
    });
  };

  const updateRate = (region: string, key: string, value: string) => {
    setRates((prev: any) => {
      const regionData = prev[region] || {};
      return { ...prev, [region]: { ...regionData, [key]: value } };
    });
  };

  const saveRates = async () => {
    if (!email) return;
    setMsg("Saving...");
    
    // ✅ If "Other" is selected, use the custom typed country. Otherwise, use the dropdown value.
    const finalCountry = domesticCountry === "Other" ? customCountry.trim() : domesticCountry;
    
    const ratesToSave = { ...rates, domestic_country: finalCountry };
    
    console.log("📤 Attempting to save to Supabase:", { email, ratesToSave });

    const { data, error } = await sb.from("sellers").update({ shipping_rates: ratesToSave }).eq("email", email).select();
    
    if (error) {
      console.error("❌ Supabase Update Error:", error);
      setMsg(`Error: ${error.message}`);
    } else {
      console.log("✅ Supabase Update Success:", data);
      setMsg("✅ Shipping profiles saved successfully!");
    }
    
    setTimeout(() => setMsg(""), 4000);
  };

  if (loading) return <div className="p-10 text-center text-slate-600">Loading shipping settings...</div>;

  const REGIONS = [
    { key: "domestic", label: `🏠 Domestic (${domesticCountry === "Other" ? (customCountry || "Custom") : domesticCountry})` },
    { key: "africa", label: "🌍 Africa (Cross-border)" },
    { key: "asia", label: "🌏 Asia" },
    { key: "na", label: "🇺🇸 North America (USA, Canada, Mexico)" },
    { key: "eu", label: "🇪🇺 Europe" },
    { key: "row", label: "🌐 Rest of World" }
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="max-w-4xl mx-auto">
        <Link href="/karakata/sellercenter" className="text-sm font-bold text-emerald-700 hover:underline mb-6 inline-block">
          ← Back to Seller Center
        </Link>
        
        <h1 className="text-3xl font-bold mb-2">Global Shipping Profiles</h1>
        <p className="text-slate-600 mb-6">Set your shipping rates by region and weight bracket.</p>

        <div className="mb-8 p-5 bg-blue-50 border border-blue-200 rounded-xl">
          <label className="text-sm font-bold text-blue-900 mb-2 block">📍 Your Domestic Country</label>
          <select 
            value={domesticCountry} 
            onChange={(e) => setDomesticCountry(e.target.value)}
            className="w-full md:w-1/2 rounded-lg border border-blue-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition"
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          
          {/* ✅ DYNAMIC "OTHER" INPUT */}
          {domesticCountry === "Other" && (
            <div className="mt-3">
              <input
                type="text"
                value={customCountry}
                onChange={(e) => setCustomCountry(e.target.value)}
                placeholder="Please type your country name (e.g., Argentina, Japan)"
                className="w-full md:w-1/2 rounded-lg border border-blue-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition"
              />
            </div>
          )}

          <p className="text-xs text-blue-700 mt-2">
            Pre-filled from your shop profile. Buyers from this country will see these "Domestic" rates.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-8">
          {REGIONS.map((region) => {
            const regionData = rates[region.key] || { method: "flat", flat_rate: "", brackets: {} };
            
            return (
              <div key={region.key} className="border-b border-slate-100 pb-6 last:border-0">
                <h2 className="text-xl font-bold mb-4">{region.label}</h2>
                
                <div className="flex flex-wrap gap-4 mb-4">
                  {["flat", "weight", "free"].map((m) => (
                    <label key={m} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name={`method-${region.key}`}
                        checked={regionData.method === m}
                        onChange={() => updateMethod(region.key, m)}
                        className="text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm font-medium capitalize text-slate-700">
                        {m === "flat" ? "Flat Rate" : m === "weight" ? "Weight-Based" : "Free Shipping"}
                      </span>
                    </label>
                  ))}
                </div>

                {regionData.method === "flat" && (
                  <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg w-48">
                    <span className="text-slate-500 text-sm font-bold">$</span>
                    <input
                      type="number"
                      value={regionData.flat_rate || ""}
                      onChange={(e) => updateRate(region.key, "flat_rate", e.target.value)}
                      className="w-full bg-transparent border-b border-slate-300 focus:border-emerald-500 focus:outline-none py-1"
                      placeholder="0.00"
                    />
                  </div>
                )}

                {regionData.method === "weight" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {WEIGHT_BRACKETS.map((bracket) => (
                      <div key={bracket.key} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg">
                        <span className="text-sm font-medium text-slate-700">{bracket.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 text-sm font-bold">$</span>
                          <input
                            type="number"
                            value={regionData.brackets?.[bracket.key] || ""}
                            onChange={(e) => {
                              const newBrackets = { ...(regionData.brackets || {}), [bracket.key]: e.target.value };
                              updateRate(region.key, "brackets", newBrackets);
                            }}
                            className="w-20 rounded border border-slate-300 px-2 py-1 text-right focus:border-emerald-500 focus:outline-none"
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {regionData.method === "free" && (
                  <p className="text-sm text-emerald-700 bg-emerald-50 p-3 rounded-lg border border-emerald-200">
                    ✅ Buyers in this region will see "Free Shipping" at checkout.
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-end items-center gap-4">
          {msg && <span className={`font-bold ${msg.includes("✅") ? "text-emerald-600" : "text-rose-600"}`}>{msg}</span>}
          <button 
            onClick={saveRates}
            className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-sm"
          >
            Save Global Shipping Profiles
          </button>
        </div>
      </div>
    </main>
  );
}
