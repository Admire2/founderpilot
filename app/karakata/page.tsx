"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { MASTER_CATEGORIES, CATEGORY_SUBS } from "@/lib/categories";

const TAXONOMY = MASTER_CATEGORIES.map((name) => ({
  name,
  icon: name === "Jewelry & Gems" ? "💍" : name === "Home & Kitchen" ? "🏠" : name === "Artisan Services" ? "🛠️" : "",
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
  const [cat, setCat] = useState<string | null>(null);
  const [sub, setSub] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [cartCount, setCartCount] = useState(0);
  
  const left = useCountdown();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const query = params.get("q");
      if (query) {
        setTerm(query);
        setQ(query);
      }
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
        const { data } = await sb.from("kara_listings").select("*, sellers:seller_id(shop_name)");
        const live = (data || []).filter((l: any) => !l.status || l.status === "active");
        const seen = new Set<string>();
        const uniq = live.filter((l: any) => {
          const k = String(l.title || "").toLowerCase() + "|" + String(l.seller_id || 0);
          if (seen.has(k)) return false;
          seen.add(k);
          return true;
        });
        setItems(uniq);
      } catch (e) {}
      try {
        setCartCount(JSON.parse(localStorage.getItem("kara_cart") || "[]").reduce((a: number, c: any) => a + (c.qty || 1), 0));
      } catch (e) {}
    })();
  }, []);

  const priceOf = (l: any) => Number(l.price_usd != null ? l.price_usd : l.price) || 0;
  const imgFor = (l: any) =>
    l.image_url
      ? l.image_url
      : "https://image.pollinations.ai/prompt/" +
        encodeURIComponent("professional product photo of " + String(l.title || "product")) +
        "?width=800&height=600&seed=" +
        String(l.id) +
        "&nologo=true";
  const norm = (s: any) => String(s || "").toLowerCase();

  const filtered = items.filter(
    (l: any) =>
      (!cat || l.category === cat) &&
      (!sub || l.subcategory === sub) &&
      (!term ||
        norm(l.title).includes(norm(term)) ||
        norm(l.category).includes(norm(term)) ||
        norm(l.sellers?.shop_name).includes(norm(term)))
  );

  const deals = filtered.filter((l: any) => Number(l.compare_at_usd) > priceOf(l));
  const activeSubs = cat ? ((TAXONOMY.find((t: any) => t.name === cat) || { subs: [] }).subs as string[]) : [];

  const add = (l: any) => {
    const p = priceOf(l);
    const item = {
      id: l.id,
      listing_id: l.id,
      title: l.title,
      price_usd: p,
      price: p,
      image_url: l.image_url,
      seller_id: l.seller_id,
      qty: 1,
      it: { title: l.title, price_usd: p, price: p, image_url: l.image_url, seller_id: l.seller_id }
    };
    const cart = JSON.parse(localStorage.getItem("kara_cart") || "[]");
    const ex = cart.find((c: any) => String(c.id) === String(l.id));
    if (ex) {
      ex.qty = (ex.qty || 1) + 1;
    } else {
      cart.push(item);
    }
    localStorage.setItem("kara_cart", JSON.stringify(cart));
    setCartCount(cart.reduce((a: number, c: any) => a + (c.qty || 1), 0));
  };

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-2">
          <button
            onClick={() => {
              setCat(null);
              setSub(null);
            }}
            className={"whitespace-nowrap rounded-full px-4 py-1 text-sm font-bold " + (!cat ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200")}
          >
            All
          </button>
          {TAXONOMY.map((t: any) => (
            <button
              key={t.name}
              onClick={() => {
                setCat(cat === t.name ? null : t.name);
                setSub(null);
              }}
              className={"whitespace-nowrap rounded-full px-4 py-1 text-sm font-bold " + (cat === t.name ? "bg-slate-900 text-white" : "bg-slate-100 hover:bg-slate-200")}
            >
              {t.icon} {t.name}
            </button>
          ))}
        </div>
      </div>

      {cat && activeSubs.length > 0 && (
        <div className="border-b border-slate-200 bg-slate-50">
          <div className="mx-auto flex max-w-7xl flex-wrap gap-2 px-4 py-2">
            <button
              onClick={() => setSub(null)}
              className={"rounded-full px-3 py-1 text-xs font-bold " + (!sub ? "bg-amber-400 text-slate-900" : "bg-white border border-slate-300 hover:border-amber-400")}
            >
              All in {cat}
            </button>
            {activeSubs.map((s: string) => (
              <button
                key={s}
                onClick={() => setSub(sub === s ? null : s)}
                className={"rounded-full px-3 py-1 text-xs font-bold " + (sub === s ? "bg-amber-400 text-slate-900" : "bg-white border border-slate-300 hover:border-amber-400")}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mx-auto max-w-7xl px-4">
        <div className="mt-4 rounded-lg bg-gradient-to-r from-amber-500 to-red-600 p-4 text-white">
          <p className="text-lg font-bold">
            KaraKata Haul — Today only! Ends in <span className="font-mono">{left}</span>
          </p>
          <p className="text-sm">Escrow-protected payments · Verified-purchase reviews · Free AI storefront builder</p>
        </div>

        {deals.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-bold">⚡ Rolling deals — ends in {left}</h2>
            <div className="mt-3 flex gap-4 overflow-x-auto pb-3">
              {deals.map((l: any) => {
                const p = priceOf(l);
                const pct = Math.round((1 - p / Number(l.compare_at_usd)) * 100);
                return (
                  <div key={l.id} className="w-56 shrink-0 rounded-lg border border-slate-200 p-3 shadow-sm">
                    <img
                      src={imgFor(l)}
                      alt=""
                      onError={(e: any) => {
                        const t = e.currentTarget;
                        if (!t.dataset.fb) {
                          t.dataset.fb = "1";
                          t.src =
                            "https://image.pollinations.ai/prompt/" +
                            encodeURIComponent("professional product photo of " + String(l.title || "product")) +
                            "?width=800&height=600&seed=" +
                            String(l.id) +
                            "&nologo=true";
                        }
                      }}
                      className="h-32 w-full rounded object-cover"
                    />
                    <p className="mt-2 text-xs font-bold text-red-600">
                      {pct}% off <span className="rounded bg-red-600 px-1 py-0.5 text-[10px] text-white">Limited time deal</span>
                    </p>
                    <p className="mt-1 text-lg font-bold">${p.toFixed(2)}</p>
                    <p className="text-xs text-slate-500">
                      Typical: <span className="line-through">${Number(l.compare_at_usd).toFixed(2)}</span>
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs">{l.title}</p>
                    <button onClick={() => add(l)} className="mt-2 w-full rounded-full bg-amber-400 py-1 text-xs font-bold hover:bg-amber-300">
                      Add to cart
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold">
              {cat ? cat : "All products & services"}
              {sub ? " · " + sub : ""}
              {term ? " · search: " + term : ""}{" "}
              <span className="text-sm font-normal text-slate-500">({filtered.length} results)</span>
            </h2>
            {(cat || sub || term) && (
              <button
                onClick={() => {
                  setCat(null);
                  setSub(null);
                  setTerm("");
                  setQ("");
                }}
                className="rounded-full border border-slate-300 px-3 py-1 text-xs font-bold hover:border-red-400 hover:text-red-600"
              >
                ✕ Clear filters
              </button>
            )}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {filtered.map((l: any) => (
              <div key={l.id} className="rounded-lg border border-slate-200 p-3 shadow-sm hover:shadow-md">
                <img
                  src={imgFor(l)}
                  alt=""
                  onError={(e: any) => {
                    const t = e.currentTarget;
                    if (!t.dataset.fb) {
                      t.dataset.fb = "1";
                      t.src =
                        "https://image.pollinations.ai/prompt/" +
                        encodeURIComponent("professional product photo of " + String(l.title || "product")) +
                        "?width=800&height=600&seed=" +
                        String(l.id) +
                        "&nologo=true";
                    }
                  }}
                  className="h-40 w-full rounded object-cover"
                />
                <p className="mt-2 text-lg font-bold">${priceOf(l).toFixed(2)}</p>
                <p className="mt-1 line-clamp-2 text-sm">{l.title}</p>
                <p className="mt-1 text-xs text-slate-500">
                  {l.category || "Uncategorized"}
                  {l.subcategory ? " · " + l.subcategory : ""}
                </p>
                <button onClick={() => add(l)} className="mt-2 w-full rounded-full bg-amber-400 py-1.5 text-sm font-bold hover:bg-amber-300">
                  Add to cart
                </button>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-2 rounded-lg border-2 border-dashed border-slate-300 p-8 text-center md:col-span-4">
                <p className="font-bold">Nothing matches yet.</p>
                <p className="mt-1 text-sm text-slate-500">
                  {term ? "No products or services match " + term + "." : "Be the first seller here."}
                </p>
                <Link href="/karakata/build" className="mt-3 inline-block rounded-lg bg-amber-400 px-5 py-2 font-bold text-slate-900 hover:bg-amber-300">
                  🏗️ Build my store free
                </Link>
              </div>
            )}
          </div>
        </section>

        <footer className="mt-10 border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          <p>
            Selling on Amazon, Etsy or Shopify?{" "}
            <Link className="text-emerald-600 underline" href="/karakata/build">
              Photograph your shop - KaraKata builds your storefront free
            </Link>
          </p>
        </footer>
      </div>
    </main>
  );
}
