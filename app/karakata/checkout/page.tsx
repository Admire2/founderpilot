"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const COUNTRIES = [
  "Nigeria", "Ghana", "Kenya", "South Africa", 
  "United States", "Canada", "United Kingdom", "Germany", "France", 
  "China", "India", "United Arab Emirates", "Australia", "Brazil", "Other"
];

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  
  // ✅ INDUSTRY STANDARD: Guest Contact Info State
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [createAccount, setCreateAccount] = useState(true); // Pre-checked for higher conversion
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  const [shippingCountry, setShippingCountry] = useState("Nigeria");
  const [shippingCost, setShippingCost] = useState(0);
  const [sellerData, setSellerData] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      // ✅ Check if user is logged in
      const { data: { session } } = await sb.auth.getSession();
      if (session?.user?.email) {
        setIsLoggedIn(true);
        setBuyerEmail(session.user.email); // Auto-fill email!
      }

      const savedCart = localStorage.getItem("kara_cart");
      if (savedCart) {
        try {
          const parsedCart = JSON.parse(savedCart);
          setCart(parsedCart);
          if (parsedCart.length > 0 && parsedCart[0].seller_id) {
            fetchSellerShipping(parsedCart[0].seller_id, parsedCart);
          }
        } catch (e) {
          console.error("Failed to parse cart", e);
        }
      }
      setLoading(false);
    };
    init();
  }, []);

  const fetchSellerShipping = async (sellerId: number | string, currentCart: any[]) => {
    try {
      const { data, error } = await sb.from("sellers").select("id, email, shipping_rates, country").eq("id", sellerId).single();
      if (data) {
        setSellerData(data);
        calculateShipping(data, shippingCountry, currentCart);
      }
    } catch (e) {
      console.error("Error fetching seller shipping", e);
    }
  };

  const calculateShipping = (data: any, country: string, currentCart: any[]) => {
    const rates = data.shipping_rates || {};
    const domesticCountry = (rates.domestic_country || data.country || "Nigeria").toLowerCase();
    const targetCountry = country.toLowerCase();
    
    let region = "row";
    if (targetCountry === domesticCountry) region = "domestic";
    else if (["nigeria", "ghana", "kenya", "south africa", "egypt", "tanzania", "rwanda"].includes(targetCountry)) region = "africa";
    else if (["united states", "canada", "mexico"].includes(targetCountry)) region = "na";
    else if (["united kingdom", "germany", "france", "spain", "italy", "netherlands"].includes(targetCountry)) region = "eu";
    else if (["china", "india", "japan", "united arab emirates", "singapore"].includes(targetCountry)) region = "asia";

    const regionRates = rates[region] || { method: "flat", flat_rate: "0" };
    let cost = 0;

    if (regionRates.method === "free") cost = 0;
    else if (regionRates.method === "flat") cost = Number(regionRates.flat_rate) || 0;
    else if (regionRates.method === "weight") {
      const totalWeight = currentCart.reduce((sum, item) => sum + (Number(item.weight_lbs) || 5) * (item.qty || 1), 0);
      let bracket = "0-5";
      if (totalWeight > 20) bracket = "20+";
      else if (totalWeight > 10) bracket = "10-20";
      else if (totalWeight > 5) bracket = "5-10";
      cost = Number(regionRates.brackets?.[bracket]) || 0;
    }
    setShippingCost(cost);
  };

  const handleCountryChange = (country: string) => {
    setShippingCountry(country);
    if (sellerData && cart.length > 0) calculateShipping(sellerData, country, cart);
  };

  const updateQty = (itemId: string | number, change: number) => {
    const updatedCart = cart.map(item => {
      if (String(item.id) === String(itemId)) {
        const newQty = Math.max(1, (item.qty || 1) + change);
        return { ...item, qty: newQty };
      }
      return item;
    });
    setCart(updatedCart);
    localStorage.setItem("kara_cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("kara_cart_updated"));
    if (sellerData) calculateShipping(sellerData, shippingCountry, updatedCart);
  };

  const removeFromCart = (itemId: string | number) => {
    const updatedCart = cart.filter((item) => String(item.id) !== String(itemId));
    setCart(updatedCart);
    localStorage.setItem("kara_cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("kara_cart_updated"));
    if (updatedCart.length > 0 && sellerData) {
      calculateShipping(sellerData, shippingCountry, updatedCart);
    } else if (updatedCart.length === 0) {
      setShippingCost(0);
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) || Number(item.price_usd) || 0) * (item.qty || 1), 0);
  const grandTotal = subtotal + shippingCost;
  const escrowFee = grandTotal * 0.05; 
  const finalTotal = grandTotal + escrowFee;

  const handleCheckout = async () => {
    // ✅ INDUSTRY STANDARD: Block transaction if no valid email is provided
    if (!buyerEmail || !buyerEmail.includes("@")) {
      alert("⚠️ Please provide a valid email address to receive your order confirmation and tracking updates.");
      return; // 🛑 STOP: Do not proceed to payment
    }

    setProcessing(true);
    try {
      const response = await fetch("/api/karakata/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          cart, subtotal, shippingCost, shippingCountry, grandTotal, escrowFee, 
          seller_id: cart[0]?.seller_id,
          buyer_email: buyerEmail.trim().toLowerCase(),
          buyer_phone: buyerPhone.trim(),
          create_account: createAccount && !isLoggedIn // Pass flag to create account post-purchase
        }),
      });
      const data = await response.json();
      if (data.ok && data.url) {
        // ✅ MAGIC TRICK: Save email to session storage for post-purchase account creation
        if (!isLoggedIn) {
          sessionStorage.setItem("kara_guest_checkout_email", buyerEmail);
        }
        window.location.href = data.url;
      } else {
        alert(data.error || "Failed to initialize checkout.");
        setProcessing(false);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      alert("A network error occurred.");
      setProcessing(false);
    }
  };

  if (loading) return <main className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-600 font-bold animate-pulse">Loading...</p></main>;
  if (cart.length === 0) return (
    <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">Your cart is empty</h1>
      <Link href="/karakata" className="bg-amber-400 text-slate-900 px-8 py-3 rounded-xl font-bold hover:bg-amber-300 transition">Continue Shopping</Link>
    </main>
  );

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <Link href="/karakata" className="text-sm font-bold text-emerald-700 hover:underline mb-6 inline-block">← Continue Shopping</Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-8">Secure Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN: Order Summary */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h2 className="text-xl font-bold mb-4">Order Summary ({cart.length} items)</h2>
              <div className="space-y-4">
                {cart.map((item, index) => (
                  <div key={index} className="flex gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                    <img src={item.image_url || "https://via.placeholder.com/80"} alt={item.title} className="w-20 h-20 rounded-lg object-cover bg-slate-100" />
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900">{item.title}</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 transition">-</button>
                        <span className="text-sm font-bold text-slate-900 w-4 text-center">{item.qty || 1}</span>
                        <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 transition">+</button>
                      </div>
                      <p className="text-sm font-bold text-emerald-700 mt-1">${(Number(item.price) || Number(item.price_usd) || 0).toFixed(2)}</p>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-3 py-1 rounded-lg text-sm font-bold transition self-start">Remove</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
              <div className="text-2xl">🛡️</div>
              <div>
                <h3 className="font-bold text-emerald-900">KaraKata Buyer Protection</h3>
                <p className="text-sm text-emerald-800 mt-1">Your payment is protected by our Smart Escrow system. Funds are held securely until you confirm the product matches the description. <span className="font-bold">0% risk to you.</span></p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Contact & Payment */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sticky top-6">
              
              {/* ✅ INDUSTRY STANDARD: Step 1 - Contact Information */}
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">1</span>
                Contact Information
              </h2>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">
                    Email Address <span className="text-rose-500">*</span>
                    {isLoggedIn && <span className="ml-2 text-emerald-600 font-normal">(Logged in)</span>}
                  </label>
                  <input 
                    type="email" 
                    value={buyerEmail}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="you@example.com" 
                    className={`w-full rounded-lg border px-3 py-2 text-sm text-slate-900 focus:outline-none transition ${
                      isLoggedIn ? "bg-emerald-50 border-emerald-300 text-emerald-900" : "bg-white border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    }`}
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">We'll send your order confirmation and tracking updates here.</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Phone Number (Optional)</label>
                  <input 
                    type="tel" 
                    value={buyerPhone}
                    onChange={(e) => setBuyerPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000" 
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition"
                  />
                  <p className="text-xs text-slate-500 mt-1">For SMS delivery updates.</p>
                </div>

                {/* ✅ INDUSTRY STANDARD: Guest Account Creation Prompt */}
                {!isLoggedIn && (
                  <label className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-100 transition">
                    <input 
                      type="checkbox" 
                      checked={createAccount} 
                      onChange={(e) => setCreateAccount(e.target.checked)} 
                      className="mt-1 rounded text-emerald-600 focus:ring-emerald-500" 
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-800">Create a free KaraKata account</p>
                      <p className="text-xs text-slate-500">Save your info for faster checkout next time. We'll send a secure link to set a password after your order.</p>
                    </div>
                  </label>
                )}

                <div className="pt-2">
                  <label className="text-xs font-bold text-slate-600 mb-1 block">Shipping Destination</label>
                  <select value={shippingCountry} onChange={(e) => handleCountryChange(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition">
                    {COUNTRIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
              </div>

              {/* ✅ INDUSTRY STANDARD: Step 2 - Payment Details */}
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-700 w-6 h-6 rounded-full flex items-center justify-center text-xs">2</span>
                Payment Details
              </h2>
              <div className="space-y-3 text-sm mb-6">
                <div className="flex justify-between border-t border-slate-100 pt-3"><span className="text-slate-600">Subtotal</span><span className="font-bold">${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-slate-600">Shipping</span><span className="font-bold text-emerald-700">${shippingCost.toFixed(2)}</span></div>
                
                <div className="flex justify-between items-center group relative">
                  <div className="flex items-center gap-1 text-slate-600 cursor-help">
                    <span>Smart Escrow Buffer (5%)</span>
                    <svg className="w-4 h-4 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="absolute bottom-full right-0 mb-2 w-64 bg-slate-900 text-white text-xs p-3 rounded-lg opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">This 5% fee is held securely by KaraKata and released to the seller only after you confirm satisfactory delivery.</div>
                  </div>
                  <span className="font-bold text-emerald-700">${escrowFee.toFixed(2)}</span>
                </div>
                
                <div className="border-t border-slate-200 pt-3 flex justify-between text-lg"><span className="font-bold text-slate-900">Total Due</span><span className="font-bold text-slate-900">${finalTotal.toFixed(2)}</span></div>
              </div>

              <button onClick={handleCheckout} disabled={processing} className="w-full bg-amber-400 text-slate-900 py-4 rounded-xl font-bold text-lg hover:bg-amber-300 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm">
                {processing ? "Processing..." : "Proceed to Secure Payment →"}
              </button>
              
              {!isLoggedIn && (
                <div className="mt-4 text-center">
                  <Link href="/auth?callbackUrl=/karakata/checkout" className="text-xs font-bold text-cyan-600 hover:underline">
                    Already have an account? Sign in for faster checkout →
                  </Link>
                </div>
              )}
              
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/></svg>
                <span>256-bit SSL Encrypted Checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
