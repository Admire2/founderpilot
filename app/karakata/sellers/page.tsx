"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function stars(n: number) {
  const f = Math.round(n);
  return "★".repeat(f) + "☆".repeat(5 - f);
}

export default function SellersPage() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("rating");

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        // ✅ QUOTA-FRIENDLY & SECURE: Only fetch exactly what the UI needs, and ONLY approved, real sellers
        const { data, error } = await sb
          .from("sellers")
          .select("id, shop_name, category, city, country, avg_rating, review_count")
          .eq("status", "approved")      // MUST be approved by Admin
          .eq("is_demo", false)           // MUST NOT be a placeholder
          .order("avg_rating", { ascending: false })
          .limit(100);                    // Protects your Supabase quota
        
        if (data) setSellers(data);
        if (error) console.error("Error fetching sellers:", error);
      } catch (err) {
        console.error("Failed to fetch sellers:", err);
      }
      setLoading(false);
    };
    fetchSellers();
  }, []);

  const filteredSellers = sellers
    .filter(s => 
      (s.shop_name || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
      (s.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.city || "").toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === "alphabetical") {
        return (a.shop_name || "").localeCompare(b.shop_name || "");
      }
      return (b.avg_rating || 0) - (a.avg_rating || 0);
    });

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white flex items-center justify-center">
        <p className="text-lg animate-pulse">Loading verified sellers...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="max-w-6xl mx-auto">
        <Link href="/karakata" className="text-sm font-bold text-cyan-400 hover:underline mb-6 inline-block">
          ← Back to market
        </Link>
        
        <h1 className="text-4xl font-bold mb-2">KaraKata Verified Sellers</h1>
        <p className="text-slate-400 mb-6">Ranked by verified-purchase ratings. Click any seller to view their storefront.</p>

        <div className="mb-8 space-y-4">
          <div className="flex gap-4 flex-col md:flex-row">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search sellers by name, category, or city..."
              className="flex-1 rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none"
            />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg bg-slate-800 border border-slate-700 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none"
            >
              <option value="rating">Sort: Top Rated</option>
              <option value="alphabetical">Sort: A-Z</option>
            </select>
          </div>
          <p className="text-sm text-slate-400">
            Showing {filteredSellers.length} verified sellers
          </p>
        </div>

        <Link href="/karakata/build" className="inline-block text-emerald-400 hover:underline mb-8 font-bold">
          🚀 Open your own store free with AI StoreBuilder
        </Link>

        {filteredSellers.length === 0 ? (
          <div className="text-center py-12 bg-slate-900 rounded-xl border border-slate-800">
            <p className="text-xl text-slate-400 mb-2">No verified sellers found</p>
            <p className="text-sm text-slate-500 mb-4">Be the first to apply and get approved!</p>
            <button 
              onClick={() => setSearchTerm("")} 
              className="text-cyan-400 hover:underline font-bold"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredSellers.map((seller, index) => (
              <Link 
                key={seller.id} 
                href={`/karakata/sellers/${seller.id}`}
                className="rounded-xl bg-slate-800 border border-slate-700 p-6 hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10 transition-all block group"
              >
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-xl font-bold text-white group-hover:text-emerald-400 transition">
                    {index + 1}. {seller.shop_name || "Unknown Shop"}
                  </h2>
                  <span className="bg-slate-700 text-emerald-400 text-xs font-bold px-2 py-1 rounded">Verified</span>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-yellow-400 text-lg tracking-widest">{stars(seller.avg_rating || 0)}</span>
                  <span className="text-slate-300 text-sm">
                    {(seller.avg_rating || 0).toFixed(1)} ({seller.review_count || 0} reviews)
                  </span>
                </div>
                
                <div className="space-y-1">
                  {seller.category && (
                    <p className="text-sm text-slate-400">🏷️ <span className="text-slate-300">{seller.category}</span></p>
                  )}
                  {(seller.city || seller.country) && (
                    <p className="text-sm text-slate-400">📍 <span className="text-slate-300">{seller.city}{seller.country ? ", " + seller.country : ""}</span></p>
                  )}
                </div>
                
                <p className="text-xs text-cyan-400 mt-4 font-bold group-hover:translate-x-1 transition-transform">Click to view storefront →</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
