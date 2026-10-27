"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SellerStorefront() {
  const params = useParams();
  const sellerId = params.id as string;

  const [seller, setSeller] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // ✅ FIX 1: Removed Number() so it searches by the exact UUID string
        const { data: sellerData } = await sb
          .from("sellers")
          .select("*")
          .eq("id", sellerId)
          .single();

        // ✅ FIX 2: Removed Number() and added .or() to catch 'active' OR null statuses
        const { data: productsData } = await sb
          .from("kara_listings")
          .select("*, sellers:seller_id(shop_name)")
          .eq("seller_id", sellerId)
          .or("status.eq.active,status.is.null")
          .order("created_at", { ascending: false });

        if (sellerData) setSeller(sellerData);
        if (productsData) setProducts(productsData);
      } catch (err) {
        console.error("Error fetching storefront data:", err);
      }
      setLoading(false);
    };
    fetchData();
  }, [sellerId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="animate-pulse font-bold text-slate-600">Loading storefront...</p></div>;
  if (!seller) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="font-bold text-slate-600">Seller not found.</p></div>;

  const imgFor = (l: any) =>
    l.image_url || l.images?.[0]
      ? (l.images?.[0] || l.image_url)
      : `https://image.pollinations.ai/prompt/${encodeURIComponent("professional product photo of " + String(l.title || "product"))}?width=800&height=600&seed=${String(l.id)}&nologo=true`;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Header / Banner */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Link href="/karakata/sellers" className="text-sm font-bold text-emerald-700 hover:underline mb-6 inline-block">← Back to Seller Directory</Link>
          
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-purple-100 flex items-center justify-center text-4xl font-bold text-purple-700 border-4 border-white shadow-sm">
              {seller.shop_name?.charAt(0).toUpperCase() || "S"}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900">{seller.shop_name}</h1>
              <p className="text-slate-600 mt-1 flex items-center gap-1">📍 {seller.city || "Unknown"}, {seller.country || "Unknown"}</p>
              <p className="text-sm text-slate-500 mt-2 max-w-2xl">{seller.craft || "Professional seller on KaraKata"}</p>
              <div className="flex gap-2 mt-3">
                <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
                  ⭐ {(seller.avg_rating || 5.0).toFixed(1)} Rating
                </span>
                <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                  🛡️ Verified Seller
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold text-slate-900 mb-6">Products from this Seller ({products.length})</h2>
        
        {products.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
            <p className="text-slate-500 font-bold">This seller hasn't listed any active products yet.</p>
            <Link href="/karakata" className="mt-4 inline-block text-purple-600 font-bold hover:underline">Browse the main market →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((l: any) => {
              const price = Number(l.price_usd || l.price || 0);
              const stock = l.inventory_count ?? 10;
              return (
                <Link key={l.id} href={`/karakata/product/${l.id}`} className="group rounded-lg border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition-all">
                  <div className="aspect-square rounded-lg overflow-hidden bg-slate-50 mb-3">
                    <img src={imgFor(l)} alt={l.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <p className="text-lg font-bold text-slate-900">${price.toFixed(2)}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-700 group-hover:text-purple-700 transition">{l.title}</p>
                  <p className="mt-1 text-xs text-slate-500">{l.category}</p>
                  <p className="mt-2 text-xs font-bold text-emerald-600">{stock > 0 ? `${stock} in stock` : "Out of stock"}</p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
