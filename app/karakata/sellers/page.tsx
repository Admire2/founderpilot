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
  return "*".repeat(f) + "-".repeat(5 - f);
}

export default function SellersPage() {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("rating");

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        const { data, error } = await sb
          .from("kara_sellers")
          .select("*")
          .order("avg_rating", { ascending: false });
        
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
        <p className="text-lg">Loading sellers...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="max-w-6xl mx-auto">
        <Link href="/karakata" className="text-sm font-bold text-cyan-400 hover:underline mb-6 inline-block">
          Back to market
        </Link>
        
        <h1 className="text-4xl font-bold mb-2">KaraKata Sellers</h1>
        <p className="text-slate-400 mb-6">Ranked by verified-purchase ratings. Click any seller to view reviews and contact them.</p>

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
            Showing {filteredSellers.length} of {sellers.length} sellers
          </p>
        </div>

        <Link href="/karakata/build" className="inline-block text-emerald-400 hover:underline mb-8">
          Open your own store free with AI StoreBuilder
        </Link>

        {filteredSellers.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-slate-400">No sellers found</p>
            <button 
              onClick={() => setSearchTerm("")} 
              className="mt-4 text-cyan-400 hover:underline"
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
                className="rounded-xl bg-slate-800 border border-slate-700 p-6 hover:border-emerald-500 transition block"
              >
                <h2 className="text-xl font-bold mb-2">
                  {index + 1}. {seller.shop_name || "Unknown Shop"}
                </h2>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-yellow-400 text-lg">{stars(seller.avg_rating || 0)}</span>
                  <span className="text-slate-300">
                    {(seller.avg_rating || 0).toFixed(1)} - {seller.review_count || 0} reviews
                  </span>
                </div>
                {seller.category && (
                  <p className="text-sm text-slate-400 mb-1">Category: {seller.category}</p>
                )}
                {seller.city && (
                  <p className="text-sm text-slate-400">Location: {seller.city}{seller.country ? ", " + seller.country : ""}</p>
                )}
                <p className="text-xs text-cyan-400 mt-3">Click to view reviews and contact seller ?</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
