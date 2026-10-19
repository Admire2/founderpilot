"use client";
import WalletBar from "@/components/WalletBar";
import { useEffect, useState } from "react";

const AFRICA = ["Nigeria","Kenya","South Africa","Ghana","Egypt","Ethiopia","Tanzania","Uganda","Rwanda","Senegal"];
const ASIA = ["China","India","Japan","South Korea","Taiwan","Vietnam","Thailand"];
const AMERICAS = ["USA","United States","Canada","Mexico","Brazil"];
const cont = (c: string) => AFRICA.indexOf(c) >= 0 ? "AF" : ASIA.indexOf(c) >= 0 ? "AS" : AMERICAS.indexOf(c) >= 0 ? "AM" : "EU";

export default function PartnersPage() {
  const [partners, setPartners] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [geo, setGeo] = useState<any>({});
  const [email, setEmail] = useState("anonymous");
  const [open, setOpen] = useState("");
  const [orderPartner, setOrderPartner] = useState("");
  const [orderItem, setOrderItem] = useState("");
  const [orderQty, setOrderQty] = useState("1");
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      try { const r = await fetch("/api/partners"); const j = await r.json(); setPartners(j.rows || []); } catch (e) {}
      try { const r = await fetch("/api/listings"); const j = await r.json(); setListings(j.rows || []); } catch (e) {}
      try { const r = await fetch("/api/geo"); setGeo(await r.json()); } catch (e) {}
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i) || "";
          if (k.startsWith("sb-") && k.endsWith("-auth-token")) {
            const j = JSON.parse(localStorage.getItem(k) || "null");
            const em = (j && j.user && j.user.email) || "";
            if (em) { setEmail(em); break; }
          }
        }
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    if (email !== "anonymous") {
      fetch("/api/order?e=" + encodeURIComponent(email)).then(r => r.json()).then(j => setOrders(j.rows || [])).catch(() => {});
    }
  }, [email]);

  const score = (p: any) => {
    if (geo.country && p.country === geo.country) return 0;
    if (geo.country && cont(p.country || "") === cont(geo.country || "")) return 1;
    if (p.country === "China") return 2;
    return 3;
  };
  const sorted = partners.slice().sort((a, b) => score(a) - score(b));
  const near = (p: any) => score(p) === 0 ? "NEAREST - same country" : score(p) === 1 ? "Same continent" : score(p) === 2 ? "China - best-price hub" : "Global";

  const placeOrder = async () => {
    if (!orderPartner || !orderItem.trim()) { alert("Choose a partner and write the item key"); return; }
    await fetch("/api/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, partner: orderPartner, item: orderItem.trim(), qty: parseInt(orderQty) || 1 }) });
    const r = await fetch("/api/order?e=" + encodeURIComponent(email));
    const j = await r.json();
    setOrders(j.rows || []);
    setOrderItem(""); 
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <WalletBar />

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold"> FounderPilot Certified Partner Network</h1>
        <p className="mt-2 text-sm text-slate-400">Your location: {(geo.city ? geo.city + ", " : "") + (geo.country || "detecting...")} — partners sorted nearest-first, then best-price hubs.</p>
        {sorted.length === 0 && <p className="mt-6 text-slate-500">Partner database is being assembled — check back soon.</p>}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {sorted.map((p: any) => {
            const ls = listings.filter((l: any) => l.partner_name === p.partner_name);
            const minP = ls.length ? Math.min.apply(null, ls.map((l: any) => Number(l.price))) : null;
            return (
              <div key={p.partner_name} className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-emerald-200">{p.partner_name}</h3>
                  <span className="text-[10px] font-bold text-cyan-300">{near(p)}</span>
                </div>
                <p className="mt-1 text-xs text-slate-400">{[p.city, p.country].filter(Boolean).join(", ")} • {p.category}</p>
                <p className="mt-1 text-[11px] text-slate-500">{p.services}</p>
                {minP !== null && <p className="mt-2 text-xs text-amber-300">From ${minP} • {ls.length} priced items</p>}
                <div className="mt-3 flex gap-2">
                  <a className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-900" href={"/api/go?p=" + encodeURIComponent(p.partner_name) + "&item=" + encodeURIComponent(p.category || "quote") + "&e=" + encodeURIComponent(email) + "&s=partners"}>Get Quote</a>
                  {ls.length > 0 && <button onClick={() => setOpen(open === p.partner_name ? "" : p.partner_name)} className="rounded-lg border border-cyan-500/40 px-3 py-1.5 text-xs font-bold text-cyan-200">Compare Prices</button>}
                </div>
                {open === p.partner_name && (
                  <table className="mt-3 w-full text-[11px]">
                    <thead><tr className="text-left text-slate-400"><th className="py-1">Item</th><th>Price</th><th>MOQ</th><th>Lead</th></tr></thead>
                    <tbody>
                      {ls.map((l: any) => (
                        <tr key={l.id} className="border-t border-white/10">
                          <td className="py-1">{l.title}</td>
                          <td className="text-amber-300">${Number(l.price).toFixed(2)}</td>
                          <td>{l.moq}</td>
                          <td>{l.lead_time_days}d</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-8 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <h3 className="font-bold text-amber-200">📦 Fulfillment Order Desk — tracked orders through FounderPilot · <a href="/suite/maxi/sourcing" className="text-cyan-300 underline">supplier not listed? Sourcing Search</a></h3>
          <p className="mt-1 text-xs text-slate-400">We route your order to the partner, track every status (requested → quoted → ordered → fulfilled), and keep the full history for both sides.</p>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
            <select value={orderPartner} onChange={(e) => setOrderPartner(e.target.value)} className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs">
              <option value="">Choose partner...</option>
              {sorted.map((p: any) => <option key={p.partner_name} value={p.partner_name}>{p.partner_name}</option>)}
            </select>
            <input value={orderItem} onChange={(e) => setOrderItem(e.target.value)} placeholder="Item key (e.g. cnc_alu_bracket)" className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs" />
            <input value={orderQty} onChange={(e) => setOrderQty(e.target.value)} placeholder="Qty" className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-xs" />
            <button onClick={placeOrder} className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-900">Request Order</button>
          </div>
          {orders.length > 0 && (
            <table className="mt-4 w-full text-[11px]">
              <thead><tr className="text-left text-slate-400"><th className="py-1">Partner</th><th>Item</th><th>Qty</th><th>Status</th><th>Updated (ET)</th></tr></thead>
              <tbody>
                {orders.map((o: any) => (
                  <tr key={o.id} className="border-t border-white/10">
                    <td className="py-1">{o.partner_name}</td>
                    <td>{o.item_key}</td>
                    <td>{o.qty}</td>
                    <td className="font-bold text-emerald-300">{o.status}</td>
                    <td>{o.updated_at_et}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </main>
  );
}

