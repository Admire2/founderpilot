"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
export default function Express() {
  const [items, setItems] = useState<any[]>([]);
  const [name, setName] = useState(""); const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [addr1, setAddr1] = useState("");
  const [addr2, setAddr2] = useState("");
  const [city, setCity] = useState("");
  const [stateP, setStateP] = useState("");
  const [zip, setZip] = useState("");
  const [country, setCountry] = useState("Nigeria");

  useEffect(() => {
    const z = (zip || "").trim();
    const st = (stateP || "").trim();
    const US = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];
    const su = st.toUpperCase();
    let d = "";
    if (/^\d{5}(-\d{4})?$/.test(z) && (US.includes(su) || /georgia|california|texas|florida|new york|illinois|ohio|arizona|washington|virginia|maryland|jersey|michigan|pennsylvania|carolina|tennessee|indiana|missouri|wisconsin|minnesota|colorado|alabama|louisiana|kentucky|oregon|oklahoma|connecticut|utah|iowa|nevada|arkansas|mississippi|kansas|nebraska|idaho|hawaii|maine|hampshire|montana|rhode island|delaware|dakota|alaska|vermont|wyoming/i.test(st))) d = "United States";
    else if (/^[A-Z]{1,2}\d[A-Z\d]?\s?\d[A-Z]{2}$/i.test(z)) d = "United Kingdom";
    else if (/^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(z)) d = "Canada";
    else if (/^\d{6}$/.test(z)) d = "Nigeria";
    if (d) setCountry(d);
  }, [zip, stateP]);

  const address = [addr1, addr2, city, stateP, zip, country].filter((x) => String(x).trim()).join(", ");
  const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  useEffect(() => { try { setItems(((JSON.parse(localStorage.getItem("kara_cart") || "[]")) as any[]).map((c: any) => ({ ...c, id: c.id != null ? c.id : (c.listing_id != null ? c.listing_id : (c.slug || c.key || c.title)), price_usd: (c.price_usd != null ? c.price_usd : (c.price != null ? c.price : (c.it && (c.it.price_usd != null ? c.it.price_usd : c.it.price)))), price: (c.price_usd != null ? c.price_usd : (c.price != null ? c.price : (c.it && (c.it.price_usd != null ? c.it.price_usd : c.it.price)))), title: c.title || (c.it && c.it.title), it: { title: c.title || (c.it && c.it.title), price_usd: (c.price_usd != null ? c.price_usd : (c.price != null ? c.price : (c.it && (c.it.price_usd != null ? c.it.price_usd : c.it.price)))), price: (c.price_usd != null ? c.price_usd : (c.price != null ? c.price : (c.it && (c.it.price_usd != null ? c.it.price_usd : c.it.price)))), seller_id: c.seller_id || (c.it && c.it.seller_id) }, seller_id: c.seller_id || (c.it && c.it.seller_id) }))); const k = localStorage.getItem("sb-auth-email"); if (k) setEmail(k); } catch (e) {} }, []);
  const total = items.reduce((a, it) => a + Number(it.price || 0) * Number(it.qty || 1), 0);
  const pay = async () => {
    if (!items.length) { setMsg("Cart is empty - add items from the market first."); return; }
    if (!email || !name || !address) { setMsg("Fill name, email and delivery address."); return; }
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/karakata/pay", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: items, email: email, name: name, phone: phone, address: address, origin: window.location.origin }) });
      const j = await r.json();
      if (j.ok && j.url) { window.location.href = j.url; } else { setMsg(j.error || "Payment session failed."); setBusy(false); }
    } catch (e) { setMsg("Network error - try again."); setBusy(false); }
  };
  const inp = "w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-white";
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <Link href="/karakata" className="text-sm font-bold text-cyan-400 hover:underline">← Back to market</Link>
      <h1 className="mt-3 text-3xl font-bold">💳 Stripe Express Checkout</h1>
      <p className="mt-1 text-sm text-slate-400">Card payments are held in ESCROW until you confirm delivery. Founding sellers keep 100% - KaraKata's 8% begins after their 6-month founding window.</p>
      <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm font-bold text-cyan-200">Your order ({items.length} lines)</p>
          {items.length === 0 && (<p className="mt-2 text-xs text-slate-500">Cart empty - <Link className="text-cyan-300 underline" href="/karakata">browse the market</Link>.</p>)}
          <div className="mt-3 space-y-2">
            {items.map((it, i) => (<div key={i} className="flex justify-between text-xs text-slate-300"><span>{it.qty} × {it.title}</span><span>${(Number(it.price || 0) * Number(it.qty || 1)).toFixed(2)}</span></div>))}
          </div>
          <p className="mt-3 border-t border-white/10 pt-2 text-sm font-bold text-emerald-300">Total ${total.toFixed(2)}</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <p className="mb-2 text-sm font-bold text-cyan-200">Delivery details</p>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inp} placeholder="Full name" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} className={inp + " mt-2"} placeholder="Email" />
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inp + " mt-2"} placeholder="Phone / WhatsApp" />
          <input value={addr1} onChange={(e) => setAddr1(e.target.value)} className={inp + " mt-2"} placeholder="Street address" /><input value={addr2} onChange={(e) => setAddr2(e.target.value)} className={inp + " mt-2"} placeholder="Apt, suite, unit (optional)" /><div className="mt-2 grid grid-cols-2 gap-2"><input value={city} onChange={(e) => setCity(e.target.value)} className={inp} placeholder="City" /><input value={stateP} onChange={(e) => setStateP(e.target.value)} className={inp} placeholder="State / Province" /></div><div className="mt-2 grid grid-cols-2 gap-2"><input value={zip} onChange={(e) => setZip(e.target.value)} className={inp} placeholder="Postal code" /><select value={country} onChange={(e) => setCountry(e.target.value)} className={inp}><option>Nigeria</option><option>Ghana</option><option>Kenya</option><option>South Africa</option><option>United Kingdom</option><option>United States</option><option>Canada</option><option>Ireland</option><option>Germany</option><option>France</option><option>Netherlands</option><option>Spain</option><option>Italy</option><option>Portugal</option><option>Sweden</option><option>Poland</option><option>Turkey</option><option>United Arab Emirates</option><option>Saudi Arabia</option><option>Qatar</option><option>Kuwait</option><option>Egypt</option><option>Morocco</option><option>Algeria</option><option>Tunisia</option><option>Libya</option><option>Sudan</option><option>Ethiopia</option><option>Uganda</option><option>Tanzania</option><option>Rwanda</option><option>Senegal</option><option>Cameroon</option><option>Zambia</option><option>Zimbabwe</option><option>Botswana</option><option>Namibia</option><option>Mozambique</option><option>Angola</option><option>Malawi</option><option>Mauritius</option><option>Seychelles</option><option>Gambia</option><option>Sierra Leone</option><option>Liberia</option><option>Togo</option><option>Benin</option><option>Mali</option><option>Niger</option><option>Chad</option><option>Guinea</option><option>Gabon</option><option>Congo</option><option>DR Congo</option><option>Madagascar</option><option>India</option><option>Pakistan</option><option>Bangladesh</option><option>China</option><option>Japan</option><option>South Korea</option><option>Singapore</option><option>Malaysia</option><option>Philippines</option><option>Indonesia</option><option>Vietnam</option><option>Thailand</option><option>Brazil</option><option>Mexico</option><option>Argentina</option><option>Chile</option><option>Colombia</option><option>Peru</option><option>Australia</option><option>New Zealand</option><option>Other</option></select></div>
          <button onClick={pay} disabled={busy} className="mt-3 w-full rounded-lg bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50">{busy ? "Opening Stripe..." : "Pay securely with Stripe →"}</button>
          {msg && (<p className="mt-2 text-xs font-bold text-amber-300">{msg}</p>)}
        </div>
      </div>
    </main>
  );
}
