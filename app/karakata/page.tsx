"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MASTER_CATEGORIES, CATEGORY_SUBS } from "@/lib/categories";

const TAXONOMY = MASTER_CATEGORIES.map((name) => ({
  name,
  icon: name === "Jewelry & Gems" ? "💍" : name === "Home & Kitchen" ? "🏠" : name === "Artisan Services" ? "🛠️" : "📦",
  subs: CATEGORY_SUBS[name] || []
}));

function useCountdown() {
  const [left, setLeft] = useState("00:00:00");
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const end = new Date(now);
      end.setHours(24, 0, 0, 0);
      const s = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
      setLeft(
        String(Math.floor(s / 3600)).padStart(2, "0") +
          ":" +
          String(Math.floor((s % 3600) / 60)).padStart(2, "0") +
          ":" +
          String(s % 60).padStart(2, "0")
      );
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);
  return left;
}

export default function Market() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [cat, setCat] = useState<string | null>(null);
  const [sub, setSub] = useState<string | null>(null);
  const [term, setTerm] = useState("");
  
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState("newest");
  
  const [cart, setCart] = useState<any[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [addedId, setAddedId] = useState<string | number | null>(null);
  
  const left = useCountdown();

  const syncCart = () => {
    try {
      const saved = JSON.parse(localStorage.getItem("kara_cart") || "[]");
      setCart(saved);
      setCartCount(saved.reduce((a: number, c: any) => a + (c.qty || 1), 0));
    } catch (e) {
      setCart([]);
      setCartCount(0);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const query = params.get("q");
      if (query) setTerm(query);
      syncCart();
      window.addEventListener("storage", syncCart);
      window.addEventListener("focus", syncCart);
      return () => {
        window.removeEventListener("storage", syncCart);
        window.removeEventListener("focus", syncCart);
      };
    }
  }, []);

  useEffect(() => {
    const fetchMarketplace = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (term) params.append("q", term);
        if (cat) params.append("category", cat);
        if (sub) params.append("subcategory", sub);
        if (minPrice) params.append("minPrice", minPrice);
        if (maxPrice) params.append("maxPrice", maxPrice);
        if (minRating > 0) params.append("minRating", String(minRating));
        params.append("sortBy", sortBy);
        params.append("limit", "50");

        const res = await fetch(`/api/karakata/search?${params.toString()}`);
        const data = await res.json();
        
        if (data.ok && data.data) {
          setItems(data.data);
        } else {
          setItems([]);
        }
      } catch (e) {
        console.error("Failed to fetch marketplace:", e);
        setItems([]);
      }
      setLoading(false);
    };

    const timer = setTimeout(fetchMarketplace, 300);
    return () => clearTimeout(timer);
  }, [term, cat, sub, minPrice, maxPrice, minRating, sortBy]);

  const priceOf = (l: any) => Number(l.price_usd != null ? l.price_usd : l.price) || 0;
  const imgFor = (l: any) =>
    l.image_url
      ? l.image_url
      : "https://image.pollinations.ai/prompt/" +
        encodeURIComponent("professional product photo of " + String(l.title || "product")) +
        "?width=800&height=600&seed=" +
        String(l.id) +
        "&nologo=true";

  const deals = (items || []).filter((l: any) => Number(l.compare_at_usd) > priceOf(l));
  const activeSubs = cat ? ((TAXONOMY.find((t: any) => t.name === cat) || { subs: [] }).subs as string[]) : [];

  const add = (l: any) => {
    const stock = l.inventory_count ?? 10;
    const currentQty = cart.find((c) => String(c.id) === String(l.id))?.qty || 0;

    if (stock <= 0) {
      alert("Sorry, this item is currently out of stock.");
      return;
    }
    if (currentQty >= stock) {
      alert(`Sorry, you already have the maximum available stock (${stock}) in your cart!`);
      return;
    }

    const p = priceOf(l);
    const newCart = [...cart];
    const ex = newCart.find((c) => String(c.id) === String(l.id));
    
    if (ex) {
      ex.qty = currentQty + 1;
    } else {
      newCart.push({
        id: l.id,
        listing_id: l.id,
        title: l.title,
        price_usd: p,
        price: p,
        image_url: l.image_url,
        seller_id: l.seller_id,
        qty: 1,
        it: { title: l.title, price_usd: p, price: p, image_url: l.image_url, seller_id: l.seller_id }
      });
    }
    
    setCart(newCart);
    setCartCount(newCart.reduce((a, c) => a + (c.qty || 1), 0));
    localStorage.setItem("kara_cart", JSON.stringify(newCart));
    window.dispatchEvent(new Event("kara_cart_updated"));
    
    setAddedId(l.id);
    setTimeout(() => setAddedId(null), 2000);
  };

  const getCartQty = (itemId: string | number) => {
    const item = cart.find((c) => String(c.id) === String(itemId));
    return item ? (item.qty || 1) : 0;
  };

  const clearAllFilters = () => {
    setCat(null);
    setSub(null);
    setTerm("");
    setMinPrice("");
    setMaxPrice("");
    setMinRating(0);
    setSortBy("newest");
  };

  const hasActiveFilters = cat || sub || term || minPrice || maxPrice || minRating > 0 || sortBy !== "newest";

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="border-b border-slate-200 bg-white sticky top-0 z-20 shadow-sm">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 scrollbar-hide">
          <button onClick={() => { setCat(null); setSub(null); }} className={"whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold transition " + (!cat ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700")}>All</button>
          {TAXONOMY.map((t: any) => (
            <button key={t.name} onClick={() => { setCat(cat === t.name ? null : t.name); setSub(null); }} className={"whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-bold transition " + (cat === t.name ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700")}>{t.icon} {t.name}</button>
          ))}
        </div>
      </div>

      {cat && activeSubs.length > 0 && (
        <div className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 py-2">
            <button onClick={() => setSub(null)} className={"rounded-full px-3 py-1 text-xs font-bold transition " + (!sub ? "bg-amber-400 text-slate-900" : "bg-white border border-slate-300 hover:border-amber-400 text-slate-700")}>All in {cat}</button>
            {activeSubs.map((s: string) => (<button key={s} onClick={() => setSub(sub === s ? null : s)} className={"rounded-full px-3 py-1 text-xs font-bold transition " + (sub === s ? "bg-amber-400 text-slate-900" : "bg-white border border-slate-300 hover:border-amber-400 text-slate-700")}>{s}</button>))}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4">
        
        {/* ✅ UPDATED HERO BANNER: Original Colors Restored */}
        <div className="mt-6 rounded-xl bg-gradient-to-r from-amber-500 to-red-600 p-6 text-white shadow-lg">
          <p className="text-xl font-bold">KaraKata Marketplace: Phase 1 Seller Onboarding</p>
          <p className="text-sm mt-1 opacity-90">Join the waitlist to secure your spot among the first 1,000 sovereign merchants.</p>
        </div>

        <div className="mt-6 bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <div className="relative w-full lg:w-1/3">
              <input
                type="text"
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Search products, sellers, or categories..."
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 pl-10 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 transition"
              />
              <svg className="absolute left-3 top-3 h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>

            <div className="flex flex-wrap gap-3 w-full lg:w-auto items-center">
              <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-300 px-3 py-2">
                <span className="text-xs font-bold text-slate-600">Price:</span>
                <input type="number" placeholder="Min" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-16 rounded border border-slate-200 px-2 py-1 text-xs focus:border-amber-400 focus:outline-none" />
                <span className="text-slate-400">-</span>
                <input type="number" placeholder="Max" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-16 rounded border border-slate-200 px-2 py-1 text-xs focus:border-amber-400 focus:outline-none" />
              </div>

              <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-300 px-3 py-2">
                <span className="text-xs font-bold text-slate-600">Rating:</span>
                <select value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="rounded border border-slate-200 px-2 py-1 text-xs focus:border-amber-400 focus:outline-none bg-transparent cursor-pointer">
                  <option value={0}>Any</option>
                  <option value={4}>4+ Stars</option>
                  <option value={4.5}>4.5+ Stars</option>
                </select>
              </div>

              <div className="flex items-center gap-2 bg-white rounded-lg border border-slate-300 px-3 py-2">
                <span className="text-xs font-bold text-slate-600">Sort:</span>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="rounded border border-slate-200 px-2 py-1 text-xs focus:border-amber-400 focus:outline-none bg-transparent cursor-pointer">
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="best_selling">Best Selling</option>
                </select>
              </div>
              
              {hasActiveFilters && (
                <button onClick={clearAllFilters} className="text-xs font-bold text-red-600 hover:text-red-800 hover:underline px-2 py-2 transition">
                  ✕ Clear All
                </button>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="mt-12 text-center py-12">
            <p className="text-slate-500 animate-pulse font-bold">Loading amazing products...</p>
          </div>
        ) : (
          <>
            {deals.length > 0 && (
              <section className="mt-8">
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <span className="text-red-600">🔥</span> Rolling deals — ends in {left}
                </h2>
                <div className="mt-4 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                  {deals.slice(0, 10).map((l: any) => {
                    const p = priceOf(l);
                    const pct = Math.round((1 - p / Number(l.compare_at_usd)) * 100);
                    const stock = l.inventory_count ?? 10;
                    const cartQty = getCartQty(l.id);
                    const isAdded = addedId === l.id;
                    const isOutOfStock = stock <= 0;
                    const isMaxedOut = cartQty >= stock;

                    return (
                      <div key={l.id} className="w-60 shrink-0 rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-md transition-all flex flex-col">
                        <Link href={`/karakata/product/${l.id}`} className="block flex-1">
                          <div className="relative">
                            <img src={imgFor(l)} alt="" onError={(e: any) => { const t = e.currentTarget; if (!t.dataset.fb) { t.dataset.fb = "1"; t.src = "https://image.pollinations.ai/prompt/" + encodeURIComponent("professional product photo of " + String(l.title || "product")) + "?width=800&height=600&seed=" + String(l.id) + "&nologo=true"; } }} className="h-40 w-full rounded-lg object-cover" />
                            <span className="absolute top-2 left-2 rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">{pct}% off</span>
                          </div>
                          <p className="mt-3 text-lg font-bold text-slate-900">${p.toFixed(2)}</p>
                          <p className="text-xs text-slate-500">Typical: <span className="line-through">${Number(l.compare_at_usd).toFixed(2)}</span></p>
                          <p className="mt-2 line-clamp-2 text-sm font-medium text-slate-700 hover:text-amber-600 transition">{l.title}</p>
                        </Link>
                        
                        <div className="mt-3">
                          {isOutOfStock ? (
                            <button disabled className="w-full rounded-lg py-2 text-xs font-bold bg-slate-100 text-slate-400 cursor-not-allowed">Out of Stock</button>
                          ) : isMaxedOut ? (
                            <button disabled className="w-full rounded-lg py-2 text-xs font-bold bg-slate-100 text-slate-400 cursor-not-allowed">Max Limit Reached</button>
                          ) : (
                            <button onClick={() => add(l)} className={`w-full rounded-lg py-2 text-xs font-bold transition-all duration-300 ${isAdded ? "bg-emerald-500 text-white" : "bg-amber-400 text-slate-900 hover:bg-amber-300"}`}>{isAdded ? "Added to Cart ✅" : `Add to cart`}</button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="mt-8 mb-12">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className="text-lg font-bold text-slate-900">
                  {cat ? cat : "All products & services"}
                  {sub ? <span className="text-slate-500 font-normal"> · {sub}</span> : ""}
                  {term ? <span className="text-slate-500 font-normal"> · search: "{term}"</span> : ""}
                  <span className="ml-2 text-sm font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{items.length} results</span>
                </h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {items.map((l: any) => {
                  const stock = l.inventory_count ?? 10;
                  const cartQty = getCartQty(l.id);
                  const isAdded = addedId === l.id;
                  const isOutOfStock = stock <= 0;
                  const isMaxedOut = cartQty >= stock;

                  return (
                    <div key={l.id} className="group rounded-xl border border-slate-200 bg-white p-3 shadow-sm hover:shadow-lg hover:border-amber-300 transition-all flex flex-col">
                      <Link href={`/karakata/product/${l.id}`} className="block flex-1">
                        <div className="relative overflow-hidden rounded-lg">
                          <img src={imgFor(l)} alt="" onError={(e: any) => { const t = e.currentTarget; if (!t.dataset.fb) { t.dataset.fb = "1"; t.src = "https://image.pollinations.ai/prompt/" + encodeURIComponent("professional product photo of " + String(l.title || "product")) + "?width=800&height=600&seed=" + String(l.id) + "&nologo=true"; } }} className="h-48 w-full rounded-lg object-cover group-hover:scale-105 transition-transform duration-300" />
                          {l.rating && l.rating >= 4.5 && (
                            <span className="absolute top-2 right-2 bg-amber-400 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">★ {l.rating}</span>
                          )}
                        </div>
                        <p className="mt-3 text-lg font-bold text-slate-900">${priceOf(l).toFixed(2)}</p>
                        <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-700 group-hover:text-amber-600 transition">{l.title}</p>
                        <p className="mt-1 text-xs text-slate-500">{l.category || "Uncategorized"}{l.subcategory ? " · " + l.subcategory : ""}</p>
                        {l.sellers?.shop_name && <p className="mt-1 text-[10px] text-slate-400">Sold by: {l.sellers.shop_name}</p>}
                      </Link>
                      
                      <div className="mt-3">
                        {isOutOfStock ? (
                          <button disabled className="w-full rounded-lg py-2 text-sm font-bold bg-slate-100 text-slate-400 cursor-not-allowed">Out of Stock</button>
                        ) : isMaxedOut ? (
                          <button disabled className="w-full rounded-lg py-2 text-sm font-bold bg-slate-100 text-slate-400 cursor-not-allowed">Max Limit Reached</button>
                        ) : (
                          <button onClick={() => add(l)} className={`w-full rounded-lg py-2 text-sm font-bold transition-all duration-300 ${isAdded ? "bg-emerald-500 text-white" : "bg-amber-400 text-slate-900 hover:bg-amber-300"}`}>{isAdded ? "Added to Cart ✅" : `Add to cart`}</button>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {items.length === 0 && (
                  <div className="col-span-2 md:col-span-4 rounded-xl border-2 border-dashed border-slate-300 p-12 text-center bg-slate-50">
                    <p className="text-xl font-bold text-slate-700">Nothing matches your filters.</p>
                    <p className="mt-2 text-sm text-slate-500">{term ? `No products or services match "${term}".` : "Try adjusting your price range or category."}</p>
                    <button onClick={clearAllFilters} className="mt-4 inline-block rounded-lg bg-amber-400 px-6 py-2.5 font-bold text-slate-900 hover:bg-amber-300 transition">Clear All Filters</button>
                  </div>
                )}
              </div>
            </section>
          </>
        )}

        <footer className="mt-10 border-t border-slate-200 py-6 text-center text-xs text-slate-500">
          <p>Selling on Amazon, Etsy or Shopify? <Link className="text-emerald-600 font-bold underline hover:text-emerald-700" href="/karakata/build">Photograph your shop - KaraKata builds your storefront free</Link></p>
        </footer>
      </div>
    </main>
  );
}