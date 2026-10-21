"use client";
import SellerRelay from "@/app/components/SellerRelay";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
export default function ProductPage() {
  const params = useParams();
  const id = String(params.id || "");
  const [item, setItem] = useState<any>(null);
  const [rel, setRel] = useState<any[]>([]);
  useEffect(() => { if (id) fetch("/api/karakata/list?id=" + id).then((r) => r.json()).then((j) => { setItem(j.item); setRel(j.related || []); }).catch(() => {}); }, [id]);
  if (!item) return (<main className="min-h-screen bg-slate-50 p-10 text-slate-900"><Link href="/karakata" className="text-sm font-bold text-emerald-700 hover:underline">← Back to KaraKata Market</Link><p className="mt-6 text-slate-500">Loading product...</p><SellerRelay />
    </main>);
  const seller = item.sellers || {};
  const wa = String(seller.whatsapp || "").replace(/[^0-9]/g, "");
  const waLink = wa ? "#relay" + wa + "?text=" + encodeURIComponent("Hi " + (seller.shop_name || "seller") + ", I want to order: " + item.title + " ($" + item.price_usd + ") from KaraKata Market.") : "";
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <Link href="/karakata" className="text-sm font-bold text-emerald-700 hover:underline">← Back to KaraKata Market</Link>
      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-2 max-w-6xl mx-auto">
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
          {item.image_url ? (<img src={item.image_url} alt={item.title} className="h-96 w-full object-cover" />) : (<div className="flex h-96 items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-8xl">📦</div>)}
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase text-slate-400">{item.category}{item.occasion && item.occasion !== "Everyday" ? " · " + item.occasion : ""}</p>
          <h1 className="mt-1 text-3xl font-bold">{item.title}</h1>
          <p className="mt-3 text-3xl font-bold text-amber-700">${Number(item.price_usd).toFixed(2)}</p>
          {item.lead_time_days && <p className="mt-1 text-sm text-slate-500">{item.lead_time_days}-day lead time</p>}
          <p className="mt-4 text-sm leading-relaxed text-slate-700">{item.description}</p>
          <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4">
            <p className="text-sm font-bold">Sold by {seller.shop_name || "KaraKata seller"}{seller.city ? " · " + seller.city : ""}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {waLink && (<a href={waLink} target="_blank" rel="noreferrer" className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-400">💬 Order via WhatsApp</a>)}
              "Contact via relay form ↓"
              <Link href="/karakata/request" className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-bold text-slate-700 hover:border-amber-400">📋 Request similar</Link>
            </div>
          </div>
          <p className="mt-4 text-[11px] text-slate-400">KaraKata relays every buyer-seller message and holds payments in escrow until delivery is confirmed. Direct phone and email contact are never shared.</p>
        </div>
      </div>
      {rel.length > 0 && (
        <section className="mt-10 max-w-6xl mx-auto">
          <h2 className="text-xl font-bold">More in {item.category}</h2>
          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            {rel.map((r: any) => (
              <Link key={r.id} href={"/karakata/p/" + r.id} className="rounded-xl border border-slate-200 bg-white p-3 hover:shadow-md transition">
                <div className="aspect-square rounded-lg bg-slate-100">{r.image_url ? (<img src={r.image_url} alt={r.title} className="h-full w-full rounded-lg object-cover" />) : (<div className="flex h-full items-center justify-center text-5xl">📦</div>)}</div>
                <p className="mt-2 line-clamp-1 text-sm font-bold">{r.title}</p>
                <p className="text-sm font-bold text-amber-700">${Number(r.price_usd).toFixed(2)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    <SellerRelay />
    </main>
  );
}