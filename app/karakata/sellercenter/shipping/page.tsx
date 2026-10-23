"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const REGIONS = [
  { key: "domestic", label: "🇳🇬 Domestic (Nigeria)" },
  { key: "na", label: "🇺🇸 North America" },
  { key: "eu", label: "🇪🇺 Europe" },
  { key: "row", label: "🌍 Rest of World" }
];

const WEIGHT_BRACKETS = [
  { key: "0-5", label: "0 - 5 lbs" },
  { key: "5-10", label: "5.1 - 10 lbs" },
  { key: "10-20", label: "10.1 - 20 lbs" },
  { key: "20+", label: "20+ lbs" }
];

export default function ShippingProfiles() {
  const [email, setEmail] = useState("");
  const [rates, setRates] = useState<any>({});
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedEmail = localStorage.getItem("kara_seller_onboarding_email");
    if (storedEmail) {
      setEmail(storedEmail);
      loadRates(storedEmail);
    } else {
      setLoading(false);
    }
  }, []);

  const loadRates = async (userEmail: string) => {
    const { data } = await sb.from("sellers").select("shipping_rates").eq("email", userEmail).single();
    if (data?.shipping_rates) setRates(data.shipping_rates);
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
    const { error } = await sb.from("sellers").update({ shipping_rates: rates }).eq("email", email);
    setMsg(error ? "Error saving rates." : "✅ Shipping profiles saved successfully!");
    setTimeout(() => setMsg(""), 3000);
  };

  if (loading) return <div className="p-10 text-center text-slate-600">Loading shipping settings...</div>;

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="max-w-4xl mx-auto">
        <Link href="/karakata/sellercenter" className="text-sm font-bold text-emerald-700 hover:underline mb-6 inline-block">
          ← Back to Seller Center
        </Link>
        
        <h1 className="text-3xl font-bold mb-2">Shipping Profiles</h1>
        <p className="text-slate-600 mb-8">
          Choose how you want to charge for shipping in each region. 
          <span className="block mt-2 text-sm text-amber-700 bg-amber-50 p-3 rounded border border-amber-200">
            💡 <strong>Pro Tip:</strong> Use <strong>Flat Rate</strong> for simplicity, or <strong>Weight-Based</strong> to optimize packaging and protect your margins on heavier items!
          </span>
        </p>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-8">
          {REGIONS.map((region) => {
            const regionData = rates[region.key] || { method: "flat", flat_rate: "", brackets: {} };
            
            return (
              <div key={region.key} className="border-b border-slate-100 pb-6 last:border-0">
                <h2 className="text-xl font-bold mb-4">{region.label}</h2>
                
                {/* Method Selector */}
                <div className="flex gap-4 mb-4">
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

                {/* Conditional Inputs */}
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
                    ✅ Buyers in this region will see "Free Shipping" at checkout. (You will absorb the shipping cost).
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
            Save Shipping Profiles
          </button>
        </div>
      </div>
    </main>
  );
}
