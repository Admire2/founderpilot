"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
const COD_MARKETS = ["Nigeria", "Kenya", "Ghana", "India", "UAE", "Saudi Arabia"];
const brandOf = (n: string) => /^4/.test(n) ? "VISA" : /^(5[1-5]|2[2-7])/.test(n) ? "Mastercard" : /^3[47]/.test(n) ? "Amex" : /^(6011|65)/.test(n) ? "Discover" : "";
const luhn = (n: string) => { let s = 0, d = false; for (let i = n.length - 1; i >= 0; i--) { let x = Number(n[i]); if (d) { x *= 2; if (x > 9) x -= 9; } s += x; d = !d; } return n.length >= 13 && s % 10 === 0; };
export default function Checkout() {
  const [cart, setCart] = useState<any[]>([]);
  const [listings, setListings] = useState<any[]>([]);
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); const [addr1, setAddr1] = useState(""); const [addr2, setAddr2] = useState(""); const [city, setCity] = useState(""); const [stateP, setStateP] = useState(""); const [zip, setZip] = useState(""); const [country, setCountry] = useState("Nigeria"); useEffect(() => { try { if (new URLSearchParams(window.location.search).get("success") === "1") { localStorage.setItem("kara_cart", "[]"); setCart([]); } } catch (e) {} }, []); useEffect(() => { const z = (zip || "").trim(); const st = (stateP || "").trim(); const US = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"]; const su = st.toUpperCase(); let d = ""; if (/^\d{5}(-\d{4})?$/.test(z) && (US.includes(su) || /georgia|california|texas|florida|new york|illinois|ohio|arizona|washington|virginia|maryland|jersey|michigan|pennsylvania|carolina|tennessee|indiana|missouri|wisconsin|minnesota|colorado|alabama|louisiana|kentucky|oregon|oklahoma|connecticut|utah|iowa|nevada|arkansas|mississippi|kansas|nebraska|idaho|hawaii|maine|hampshire|montana|rhode island|delaware|dakota|alaska|vermont|wyoming/i.test(st))) d = "United States"; else if (/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(z)) d = "United Kingdom"; else if (/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(z)) d = "Canada"; else if (/^\d{6}$/.test(z)) d = "Nigeria"; if (d) setCountry(d); }, [zip, stateP]); // AUTO-DETECT country
  const [method, setMethod] = useState("card");
  const [shippingMethod, setShippingMethod] = useState("standard");
  const [cnum, setCnum] = useState(""); const [cname, setCname] = useState(""); const [cexp, setCexp] = useState(""); const [ccvc, setCcvc] = useState("");
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState("");
  // Local Currency Converter (Phase 1: Fixed Rates, Phase 2: Live API)
  const CURRENCY_MAP: Record<string, { symbol: string; rate: number; name: string }> = {
    "Nigeria": { symbol: "?", rate: 1500, name: "Naira" },
    "Kenya": { symbol: "KSh", rate: 130, name: "Shilling" },
    "Ghana": { symbol: "?", rate: 15, name: "Cedi" },
    "South Africa": { symbol: "R", rate: 19, name: "Rand" },
    "United States": { symbol: "$", rate: 1, name: "USD" },
    "United Kingdom": { symbol: "�", rate: 0.79, name: "GBP" },
  };

  const getLocalCurrency = (usdAmount: number, countryCode: string) => {
    const currency = CURRENCY_MAP[countryCode] || CURRENCY_MAP["United States"];
    const localAmount = (usdAmount * currency.rate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return { symbol: currency.symbol, amount: localAmount, name: currency.name };
  };

  useEffect(() => {
    try { const raw = localStorage.getItem("kara_cart") || "[]"; const arr = JSON.parse(raw); setCart(Array.isArray(arr) ? (() => { const mm: Record<string, any> = {}; arr.forEach((x: any) => { const rid = x.id != null ? x.id : (x.listing_id != null ? x.listing_id : (x.slug || x.key || x.title)); const k = String(rid); const price = x.price_usd != null ? x.price_usd : (x.price != null ? x.price : (x.it && x.it.price_usd)); const it = x.it || { id: rid, title: x.title, price_usd: price, seller_id: x.seller_id, category: x.category, image_url: x.image_url }; if (mm[k]) { mm[k].qty = (mm[k].qty || 1) + (x.qty || 1); } else { mm[k] = { ...x, id: rid, qty: x.qty || 1, it: { ...x.it, title: it.title, price_usd: price, price: price, seller_id: it.seller_id }, title: it.title, price_usd: price, price: price }; } }); return Object.values(mm); })() : []); } catch (e) {}
    
    try { localStorage.removeItem("karakata_cart"); } catch (e) {}
    fetch("/api/karakata/list").then((r) => r.json()).then((j) => setListings(j.items || [])).catch(() => {});
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) { const j = JSON.parse(localStorage.getItem(k) || "null"); if (j && j.user && j.user.email) setEmail(j.user.email); } } } catch (e) {}
  }, []);
  const items = cart.map((c) => ({ ...c, it: listings.find((l: any) => String(l.id) === String(c.id)) || c.it })).filter((x) => x.it);
  const total = items.reduce((a, x) => a + Number(x.it.price_usd || 0) * x.qty, 0);
  // Dynamic shipping based on seller's rates and buyer's country
  const firstItem = items[0]?.it || {};
  const sellerCountry = (firstItem.seller_country || "Nigeria").toLowerCase();
  const buyerCountry = country.toLowerCase();
  const isDomestic = buyerCountry === sellerCountry;
  
  // Use seller-defined rates, fallback to 5/25 if not set
  const domesticRate = Number(firstItem.domestic_shipping) || 5.00;
  const intlRate = Number(firstItem.international_shipping) || 25.00;
  
  const shippingCost = items.length > 0 ? (isDomestic ? domesticRate : intlRate) : 0;
  const shippingLabel = items.length > 0 ? (isDomestic ? `Domestic (${sellerCountry})` : "International") : "None";
  const finalTotal = total + shippingCost;
  const setQty = (id: any, q: number) => { const nx = q < 1 ? cart.filter((c) => String(c.id) !== String(id)) : cart.map((c) => (String(c.id) === String(id) ? { ...c, qty: q } : c)); setCart(nx); localStorage.setItem("kara_cart", JSON.stringify(nx)); };
  const rm = (id: any) => { const i = cart.findIndex((c) => String(c.id) === String(id)); if (i < 0) return; const nx = [...cart]; nx.splice(i, 1); setCart(nx); localStorage.setItem("kara_cart", JSON.stringify(nx)); };
  const digits = cnum.replace(/\D/g, "");
  const brand = brandOf(digits);
  const pay = async () => {
    setMsg(""); setBusy(true);
    if (!name.trim() || !email.trim() || !addr1.trim() || !city.trim()) { setMsg(!name.trim() ? "Full name is required." : !email.trim() ? "Email is required." : !addr1.trim() ? "Street address is required." : "City is required."); setBusy(false); return; }
    if (items.length === 0) { setMsg("Your cart is empty."); setBusy(false); return; }
    if (method === "card") {
      if (!luhn(digits)) { setMsg("That card number fails validation - check the digits (Visa/Mastercard/Amex/Discover)."); setBusy(false); return; }
      if (!/^\d{2}\/\d{2}$/.test(cexp)) { setMsg("Expiry must be MM/YY."); setBusy(false); return; }
      const mm = Number(cexp.slice(0, 2)); const yy = Number(cexp.slice(3));
      if (mm < 1 || mm > 12 || yy < 26 || (yy === 26 && mm < 9)) { setMsg("Card looks expired."); setBusy(false); return; }
      if (ccvc.replace(/\D/g, "").length < 3) { setMsg("CVC must be 3-4 digits."); setBusy(false); return; }
    }
    if (method === "cod" && COD_MARKETS.indexOf(country) < 0) { setMsg("Pay-on-delivery is available in: " + COD_MARKETS.join(", ") + ". Choose card or PayPal for " + country + "."); setBusy(false); return; }
    const pstat = method === "cod" || method === "bank" ? "pay_at_fulfillment" : "pending_gateway";
    try {
      const first = items[0];
      if (method === "card") { const pr = await fetch("/api/karakata/pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: items, email: email, name: name, phone: phone, address: [addr1, addr2, city, stateP, zip, country].filter((x) => String(x).trim()).join(", "), origin: window.location.origin }) }); const pj = await pr.json(); if (pj && pj.url) { window.location.href = pj.url; return; } setMsg(pj && pj.error ? String(pj.error) : "Stripe session failed - use Pay now with Stripe above."); return; } const r = await fetch("/api/karakata/order", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: items.map((x) => ({ id: x.id, listing_id: x.id, seller_id: x.it.seller_id, qty: x.qty, unit_price: x.it.price_usd, price_usd: x.it.price_usd, title: x.it.title })), listing_id: first.id, seller_id: first.it.seller_id, qty: first.qty, unit_price: first.it.price_usd, total: finalTotal, shipping_method: shippingLabel, shipping_cost: shippingCost, buyer_email: email, buyer_name: name, buyer_phone: phone, address: [addr1, addr2, city, stateP, zip, country].filter((x) => String(x).trim()).join(", "), payment_method: method === "card" ? ("card:" + brand + ":" + digits.slice(-4)) : method, payment_status: pstat, note: "Items: " + items.map((x) => x.it.title + " x" + x.qty).join("; ") + " | Payment: " + method + " (" + pstat + ")" }) });
      const j = await r.json();
      if (j.ok) { localStorage.setItem("kara_cart", "[]"); setCart([]); setDone(String(j.id || j.order_id || "")); }
      else setMsg(j.error || "Order failed.");
    } catch (e) { setMsg("Connection error."); }
    setBusy(false);
  };
  const inp = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900";
  const lbl = "text-[11px] font-bold text-slate-600";
  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <Link href="/karakata" className="text-sm font-bold text-emerald-700 hover:underline">← Continue shopping</Link>
      <h1 className="mt-3 text-3xl font-bold"> Checkout</h1>{done && (<div className="mt-4 rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900"><p className="text-base font-bold">✅ Order #{done} placed successfully.</p><p className="mt-1">Payment: {method === "card" ? "reserved - card rails charge at launch, held in escrow on activation" : method}. Tunde will email every update (accepted, shipped, delivered) to {email}.</p><p className="mt-1 text-xs text-emerald-800">Want the live charge right now? Use the green Pay-with-Stripe-Escrow button above before the 24h reservation expires.</p></div>)}
      <div className="mt-3 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-xs font-bold text-teal-800">🔒 Card & PayPal payments are held in ESCROW until you confirm delivery. Sellers see the money, never touch it early. <Link href="/karakata/express" className="ml-2 inline-block rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500">Pay now with Stripe →</Link></div>
      {done ? (
        <div className="mt-6 rounded-xl border border-emerald-300 bg-emerald-50 p-8 text-center">
          <p className="text-2xl font-bold text-emerald-700">Order placed{done ? " #" + done : ""}!</p>
          <p className="mt-2 text-sm text-slate-600">Tunde (your order agent) will email every update: accepted → shipped → delivered. The seller has been notified now.</p>
          <Link href="/karakata" className="mt-4 inline-block rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white">Back to market</Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="font-bold"><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white align-middle">1</span>Your items <button type="button" onClick={() => { setCart([]); localStorage.setItem("kara_cart", "[]"); }} className="ml-3 text-xs font-bold text-rose-600 underline">Empty cart</button></p>
            {typeof window !== "undefined" && new URLSearchParams(window.location.search).get("success") === "1" && (<div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 p-4"><p className="font-bold text-emerald-900">✅ Payment received - order #{new URLSearchParams(window.location.search).get("order")}</p><p className="mt-1 text-sm text-emerald-800">Your money is held in ESCROW. Tunde will email you when the seller accepts, ships and delivers. After you confirm delivery, the payout lands in the seller&apos;s bank.</p></div>)} {items.length === 0 && <p className="mt-3 text-sm text-slate-500">Cart is empty - <Link className="text-emerald-700 underline" href="/karakata">browse the market</Link>.</p>}
            {items.map((x) => (
              <div key={x.id} className="mt-3 flex items-center gap-3 border-b border-slate-100 pb-3">
                <div className="h-12 w-12 rounded bg-slate-100 text-center text-2xl leading-12">{x.it.image_url ? <img src={x.it.image_url} className="h-12 w-12 rounded object-cover" alt="" /> : "📦"}</div>
                <div className="flex-1"><p className="text-sm font-bold">{x.it.title}</p><p className="text-[10px] uppercase text-slate-400">{x.it.category}</p></div>
                <div className="flex items-center gap-2"><button onClick={() => setQty(x.id, x.qty - 1)} className="h-6 w-6 rounded bg-slate-200 font-bold">-</button><span className="text-sm font-bold">{x.qty}</span><button onClick={() => setQty(x.id, x.qty + 1)} className="h-6 w-6 rounded bg-slate-200 font-bold">+</button></div>
                <p className="w-20 text-right text-sm font-bold">${(Number(x.it.price_usd) * x.qty).toFixed(2)}</p>
                <button onClick={() => rm(x.id)} className="text-xs text-rose-500 underline">remove</button>
              </div>
            ))}
            <div className="mt-4 space-y-2 border-t border-slate-200 pt-3">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span>Shipping ({shippingMethod === "express" ? "Express" : "Standard"})</span><span>${shippingCost.toFixed(2)}</span></div>
            <div className="flex justify-between text-lg font-bold border-t border-slate-200 pt-2"><span>Total</span><span className="text-amber-700">${finalTotal.toFixed(2)}</span></div>
          </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="font-bold"><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white align-middle">2</span>Delivery address</p>
            <p className={"mt-3 " + lbl}>Full name</p><input value={name} onChange={(e) => setName(e.target.value)} className={"mt-1 " + inp} />
            <p className={"mt-2 " + lbl}>Email</p><input value={email} onChange={(e) => setEmail(e.target.value)} className={"mt-1 " + inp} />
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div><p className={lbl}>Phone / WhatsApp</p><input value={phone} onChange={(e) => setPhone(e.target.value)} className={"mt-1 " + inp} /></div>
              <div><p className={lbl}>Country</p><select value={country} onChange={(e) => setCountry(e.target.value)} className={"mt-1 " + inp}>
<option>Nigeria</option>
<option>Ghana</option>
<option>Kenya</option>
<option>South Africa</option>
<option>United States</option>
<option>United Kingdom</option>
<option>Canada</option>
<option>Australia</option>
<option>Ireland</option>
<option>Germany</option>
<option>France</option>
<option>Netherlands</option>
<option>Spain</option>
<option>Italy</option>
<option>Portugal</option>
<option>Sweden</option>
<option>Norway</option>
<option>Denmark</option>
<option>Finland</option>
<option>Poland</option>
<option>Ukraine</option>
<option>Turkey</option>
<option>United Arab Emirates</option>
<option>Saudi Arabia</option>
<option>Qatar</option>
<option>Kuwait</option>
<option>Bahrain</option>
<option>Oman</option>
<option>Jordan</option>
<option>Lebanon</option>
<option>Egypt</option>
<option>Morocco</option>
<option>Algeria</option>
<option>Tunisia</option>
<option>Libya</option>
<option>Sudan</option>
<option>Ethiopia</option>
<option>Uganda</option>
<option>Tanzania</option>
<option>Rwanda</option>
<option>Senegal</option>
<option>Cote d'Ivoire</option>
<option>Cameroon</option>
<option>Zambia</option>
<option>Zimbabwe</option>
<option>Botswana</option>
<option>Namibia</option>
<option>Mozambique</option>
<option>Angola</option>
<option>Malawi</option>
<option>Lesotho</option>
<option>Eswatini</option>
<option>Mauritius</option>
<option>Seychelles</option>
<option>Gambia</option>
<option>Sierra Leone</option>
<option>Liberia</option>
<option>Togo</option>
<option>Benin</option>
<option>Burkina Faso</option>
<option>Mali</option>
<option>Niger</option>
<option>Chad</option>
<option>Guinea</option>
<option>Gabon</option>
<option>Congo</option>
<option>DR Congo</option>
<option>Madagascar</option>
<option>India</option>
<option>Pakistan</option>
<option>Bangladesh</option>
<option>China</option>
<option>Japan</option>
<option>South Korea</option>
<option>Singapore</option>
<option>Malaysia</option>
<option>Philippines</option>
<option>Indonesia</option>
<option>Vietnam</option>
<option>Thailand</option>
<option>Brazil</option>
<option>Mexico</option>
<option>Argentina</option>
<option>Chile</option>
<option>Colombia</option>
<option>Peru</option>
<option>New Zealand</option>
<option>Other</option>
</select></div>
            </div>
            <p className={"mt-2 " + lbl}>Street address</p><input value={addr1} onChange={(e) => setAddr1(e.target.value)} className={"mt-1 " + inp} placeholder="123 Market St" /><p className={"mt-2 " + lbl}>Apt, suite, unit (optional)</p><input value={addr2} onChange={(e) => setAddr2(e.target.value)} className={"mt-1 " + inp} /><div className="mt-2 grid grid-cols-2 gap-3"><div><p className={lbl}>City</p><input value={city} onChange={(e) => setCity(e.target.value)} className={"mt-1 " + inp} /></div><div><p className={lbl}>State / Province</p><input value={stateP} onChange={(e) => setStateP(e.target.value)} className={"mt-1 " + inp} /></div></div><p className={"mt-2 " + lbl}>Postal code</p><input value={zip} onChange={(e) => setZip(e.target.value)} className={"mt-1 " + inp} />
            <p className={"mt-4 " + lbl}><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white align-middle">3</span>Shipping Method</p>
          <div className="mt-2 space-y-2">
            {["standard", "express"].map((opt) => (
              <label key={opt} className={"flex items-center justify-between rounded-lg border-2 p-3 cursor-pointer transition " + (shippingMethod === opt ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-300")}>
                <div className="flex items-center gap-3">
                  <input type="radio" name="shipping" checked={shippingMethod === opt} onChange={() => setShippingMethod(opt)} className="h-4 w-4 text-emerald-600" />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{opt === "standard" ? "Standard Delivery (3-5 days)" : "Express Delivery (1-2 days)"}</p>
                    <p className="text-[10px] text-slate-500">{opt === "standard" ? "Reliable partner logistics" : "Priority handling & tracking"}</p>
                  </div>
                </div>
                <span className="text-sm font-bold text-slate-900">${opt === "express" ? "15.00" : "5.00"}</span>
              </label>
            ))}
          </div>

          <p className={"mt-4 " + lbl}><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white align-middle">4</span>Payment</p><div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 p-3"><p className="text-sm font-bold text-emerald-900">Recommended - Pay now with Stripe (live escrow)</p><p className="mt-1 text-[11px] text-emerald-800">Amazon/Shopify-grade hosted checkout: cards, wallets, 3-D Secure. Money held in escrow until you confirm delivery.</p><Link href="/karakata/express" className="mt-2 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500">Pay securely with Stripe →</Link></div>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {[{ k: "card", t: "💳 Card", s: "Visa · Mastercard · Amex · Discover" }, { k: "paypal", t: "🅿️ PayPal", s: "Buyer protection included" }, { k: "cod", t: "🚚 Pay on delivery", s: "Select markets only" }, { k: "bank", t: "🏦 Bank transfer", s: "Orders $500+ / B2B" }].map((m) => (
                <button key={m.k} onClick={() => setMethod(m.k)} className={"rounded-lg border-2 p-2 text-left text-xs font-bold " + (method === m.k ? "border-emerald-500 bg-emerald-50" : "border-slate-200 hover:border-emerald-300")}>
                  <p>{m.t}</p><p className="font-normal text-slate-500">{m.s}</p>
                </button>
              ))}
            </div>
            {method === "card" && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className={lbl}>Card number {brand && <span className="ml-1 rounded bg-slate-900 px-1.5 py-0.5 text-[9px] font-bold text-white">{brand}</span>}</p>
                <input value={cnum} onChange={(e) => setCnum(e.target.value.replace(/[^\d ]/g, "").replace(/(\d{4})(?=\d)/g, "$1 ").slice(0, 19))} className={"mt-1 " + inp} placeholder="4242 4242 4242 4242" inputMode="numeric" />
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <div className="col-span-3"><p className={lbl}>Name on card</p><input value={cname} onChange={(e) => setCname(e.target.value)} className={"mt-1 " + inp} /></div>
                  <div><p className={lbl}>Expiry</p><input value={cexp} onChange={(e) => setCexp(e.target.value.replace(/[^\d]/g, "").slice(0, 4).replace(/(\d{2})(?=\d)/, "$1/"))} className={"mt-1 " + inp} placeholder="MM/YY" /></div>
                  <div><p className={lbl}>CVC</p><input value={ccvc} onChange={(e) => setCcvc(e.target.value.replace(/[^\d]/g, "").slice(0, 4))} className={"mt-1 " + inp} placeholder="123" /></div>
                </div>
                <p className="mt-2 text-[10px] text-slate-500">Card rails activate with Stripe at launch; until then card orders are reserved 24h as payment-pending and held in escrow on activation. Test with 4242 4242 4242 4242.</p>
              </div>
            )}
            {method === "paypal" && (<p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600">PayPal Smart Button activates when the gateway client-ID lands; your order is placed as payment-pending and PayPal completes it on activation.</p>)}
            {method === "cod" && (<p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-800">Available in: {COD_MARKETS.join(", ")}. Cash or POS on delivery - exactly how Amazon runs India/UAE and Jumia runs Africa.</p>)}
            {method === "bank" && (<p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-[11px] text-slate-600">For orders $500+ and B2B. Account details are emailed immediately after ordering; goods ship on cleared funds.</p>)}
            <button onClick={pay} disabled={busy} className="mt-4 w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50">{busy ? "Placing order..." : "Place Order - $" + total.toFixed(2)}</button>
            {msg && <p className="mt-2 text-xs font-bold text-rose-600">{msg}</p>}
          </div>
        </div>
      )}
    </main>
  );
}
