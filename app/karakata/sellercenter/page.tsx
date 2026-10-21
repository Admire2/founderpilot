"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const CATS = ["Jewelry & Gems", "Fashion & Clothing", "Shoes & Leather", "Electronics", "Electrical & Solar", "Home & Kitchen", "Groceries & Consumables", "Beauty & Personal Care", "Health & Wellness", "Baby & Kids", "Sports & Outdoors", "Artisan Services", "Vehicles & Auto Parts", "Other"];
const OCC = ["Everyday", "Summer", "Winter", "Holiday", "School", "Wedding", "Festive"];

export default function SellerCenter() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [stripeSuccess, setStripeSuccess] = useState(false);
  
  // Profile State
  const [shop, setShop] = useState(""); const [email, setEmail] = useState("");
  const [phone, setPhone] = useState(""); const [wa, setWa] = useState("");
  const [city, setCity] = useState(""); const [country, setCountry] = useState("");
  const [cat, setCat] = useState(CATS[0]); const [craft, setCraft] = useState("");
  const [pMsg, setPMsg] = useState(""); const [pBusy, setPBusy] = useState(false);
  const [cInv, setCInv] = useState(false); const [cFun, setCFun] = useState(false); const [cBi, setCBi] = useState(false);

  // Product State
  const [title, setTitle] = useState(""); const [pcat, setPcat] = useState(CATS[0]);
  const [price, setPrice] = useState(""); const [lead, setLead] = useState("7");
  const [occ, setOcc] = useState("Everyday"); const [desc, setDesc] = useState("");
  const [file, setFile] = useState<any>(null);
  const [lMsg, setLMsg] = useState(""); const [lBusy, setLBusy] = useState(false);

  // SMART ONBOARDING DETECTION: Check database on load
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      try {
        // 1. Check for Stripe redirect success
        const params = new URLSearchParams(window.location.search);
        if (params.get('connect') === 'done') {
          setStripeSuccess(true);
        }

        // 2. FIRST: Check if we explicitly saved the onboarding email
        let userEmail = localStorage.getItem("kara_seller_onboarding_email");
        
        // 3. FALLBACK: Get email from Supabase localStorage if not explicitly saved
        if (!userEmail) {
          try {
            for (let i = 0; i < localStorage.length; i++) {
              const k = localStorage.key(i) || "";
              if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) {
                const j = JSON.parse(localStorage.getItem(k) || "null");
                if (j && j.user && j.user.email) {
                  userEmail = j.user.email;
                  break;
                }
              }
            }
          } catch (e) {}
        }
        
        // If still no email, just show Step 1
        if (!userEmail) { 
          setLoading(false); 
          return; 
        }

        // 4. Check if seller profile exists for this specific email
        const profileRes = await fetch(`/api/karakata/aje?action=report&email=${encodeURIComponent(userEmail)}`);
        const profileData = await profileRes.json();

        if (profileData.ok && profileData.seller) {
          // Profile exists, populate fields with REAL database data
          setShop(profileData.seller.shop_name || "");
          setEmail(profileData.seller.email || userEmail);
          setPhone(profileData.seller.phone || "");
          setWa(profileData.seller.whatsapp || "");
          setCity(profileData.seller.city || "");
          setCountry(profileData.seller.country || "");
          setCat(profileData.seller.category || CATS[0]);
          setCraft(profileData.seller.craft || "");

          // 5. Check if they have any listings to determine the step
          if (profileData.listings && profileData.listings.length > 0) {
            setStep(3); // Has product, skip to Step 3
          } else {
            setStep(2); // Has profile but no product, go to Step 2
          }
        }
      } catch (error) {
        console.error("Error checking onboarding status:", error);
      }
      setLoading(false);
    };

    checkOnboardingStatus();
  }, []);

  const saveProfile = async () => {
    if (!shop.trim() || !email.trim()) { setPMsg("Shop name and email are required."); return; }
    setPBusy(true); setPMsg("");
    try {
      const r = await fetch("/api/karakata/apply", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, shop_name: shop, category: cat, country, city, craft, phone, whatsapp: wa }) });
      await fetch("/api/karakata/aje", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "consent", email, consent_inventory: cInv, consent_funding: cFun, consent_bi: cBi }) });
      const j = await r.json();
      setPMsg(j.ok ? "Profile saved! Kara has queued your welcome email." : (j.error || "Failed."));
      
      // 👇 CRITICAL FIX: Explicitly remember the email for page reloads
      if (j.ok) {
        localStorage.setItem("kara_seller_onboarding_email", email);
        setTimeout(() => setStep(2), 1500); // AUTO-ADVANCE ON SUCCESS
      }
    } catch (e) { setPMsg("Connection error."); }
    setPBusy(false);
  };

  const addProduct = async () => {
    if (!title.trim() || !desc.trim() || !price.trim()) { setLMsg("Title, description and price are required."); return; }
    setLBusy(true); setLMsg("");
    let url = "";
    try { if (file) { const path = "list-" + Date.now() + "-" + file.name; const up = await sb.storage.from("kara").upload(path, file, { upsert: true }); if (!up.error) url = sb.storage.from("kara").getPublicUrl(path).data.publicUrl; } } catch (e) {}
    try {
      const r = await fetch("/api/karakata/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, title, category: pcat, description: desc, price_usd: price, lead_time_days: lead, image_url: url, occasion: occ }) });
      const j = await r.json();
      setLMsg(j.ok ? "Product LIVE on KaraKata Market!" : (j.error || "Failed."));
      
      // 👇 CRITICAL FIX: Explicitly remember the email here too, just in case
      if (j.ok) {
        localStorage.setItem("kara_seller_onboarding_email", email);
        setTimeout(() => setStep(3), 1500); // AUTO-ADVANCE ON SUCCESS
      }
    } catch (e) { setLMsg("Connection error."); }
    setLBusy(false);
  };

  const inp = "w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none transition";
  const lbl = "text-xs font-bold text-slate-600 mb-1 block";

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-600 font-bold animate-pulse">Loading your seller dashboard...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Top Nav */}
      <div className="border-b border-slate-200 bg-white px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <Link href="/karakata" className="text-sm font-bold text-emerald-700 hover:underline flex items-center gap-1">← Back to Market</Link>
        <div className="flex gap-3">
          <Link href="/karakata/sellercenter/orders" className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 transition">Orders</Link>
          <Link href="/karakata/sellercenter/messages" className="rounded-lg bg-emerald-100 px-4 py-2 text-sm font-bold text-emerald-700 hover:bg-emerald-200 transition">Messages</Link>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-slate-900">🧑‍💼 Seller Onboarding</h1>
        <p className="mt-2 text-slate-600">Launch your store in 3 simple steps. No listing fees, AI-empowered.</p>

        {/* Progress Bar */}
        <div className="mt-8 flex items-center justify-between mb-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm border-2 transition ${step >= s ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-300 text-slate-400"}`}>
                {step > s ? "✓" : s}
              </div>
              <p className={`mt-2 text-xs font-bold ${step >= s ? "text-emerald-700" : "text-slate-400"}`}>
                {s === 1 ? "Shop Profile" : s === 2 ? "First Listing" : "Get Paid"}
              </p>
            </div>
          ))}
        </div>
        <div className="relative -mt-6 mb-8">
          <div className="absolute top-5 left-0 w-full h-1 bg-slate-200 -z-10 rounded" />
          <div className="absolute top-5 left-0 h-1 bg-emerald-600 transition-all duration-500 -z-10 rounded" style={{ width: `${((step - 1) / 2) * 100}%` }} />
        </div>

        {/* STEP 1: SHOP PROFILE */}
        {step === 1 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900">Step 1: Your Shop Profile</h2>
                <p className="text-sm text-slate-500 mt-1">Tell us about your business so buyers can find you.</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 w-full md:w-72 shrink-0">
                <p className="text-xs font-bold text-amber-800 mb-2">💰 Fee War Calculator</p>
                <p className="text-[11px] text-amber-700 leading-relaxed">On $1,000/mo sales, you keep up to <span className="font-bold text-emerald-700">$900</span> with KaraKata vs <span className="font-bold text-rose-600">$550-$700</span> on Amazon.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div><label className={lbl}>Shop / Business Name *</label><input value={shop} onChange={(e) => setShop(e.target.value)} className={inp} placeholder="e.g., Adire & Gold Atelier" /></div>
              <div><label className={lbl}>Email *</label><input value={email} onChange={(e) => setEmail(e.target.value)} className={inp} placeholder="you@shop.com" /></div>
              <div><label className={lbl}>Phone</label><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inp} placeholder="+234..." /></div>
              <div><label className={lbl}>WhatsApp (Private - Support & Payouts)</label><input value={wa} onChange={(e) => setWa(e.target.value)} className={inp} placeholder="+234..." /></div>
              <div><label className={lbl}>City</label><input value={city} onChange={(e) => setCity(e.target.value)} className={inp} placeholder="Lagos" /></div>
              <div><label className={lbl}>Country</label><input value={country} onChange={(e) => setCountry(e.target.value)} className={inp} placeholder="Nigeria" /></div>
              <div className="md:col-span-2"><label className={lbl}>Main Category</label><select value={cat} onChange={(e) => setCat(e.target.value)} className={inp}>{CATS.map((c) => (<option key={c}>{c}</option>))}</select></div>
              <div className="md:col-span-2"><label className={lbl}>What you sell / Your craft</label><textarea value={craft} onChange={(e) => setCraft(e.target.value)} rows={3} className={inp} placeholder="Handwoven adire, beaded jewelry, event photography..." /></div>
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs font-bold text-slate-700 mb-3">Optional Growth Program (Revocable anytime)</p>
              <label className="flex items-center gap-3 text-sm text-slate-600 mb-2 cursor-pointer"><input type="checkbox" checked={cInv} onChange={(e) => setCInv(e.target.checked)} className="rounded text-emerald-600 focus:ring-emerald-500" /> Share inventory data for my free BI dashboard</label>
              <label className="flex items-center gap-3 text-sm text-slate-600 mb-2 cursor-pointer"><input type="checkbox" checked={cBi} onChange={(e) => setCBi(e.target.checked)} className="rounded text-emerald-600 focus:ring-emerald-500" /> Email me monthly BI reports & profit tips</label>
              <label className="flex items-center gap-3 text-sm text-slate-600 cursor-pointer"><input type="checkbox" checked={cFun} onChange={(e) => setCFun(e.target.checked)} className="rounded text-emerald-600 focus:ring-emerald-500" /> Consider me for OPTIONAL expansion-funding offers</label>
            </div>

            <div className="mt-6 flex justify-end">
              <button onClick={saveProfile} disabled={pBusy} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition flex items-center gap-2 shadow-sm">
                {pBusy ? "Saving..." : "Save & Continue →"}
              </button>
            </div>
            {pMsg && <p className="mt-3 text-center text-sm font-bold text-emerald-700">{pMsg}</p>}
          </div>
        )}

        {/* STEP 2: FIRST LISTING */}
        {step === 2 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Step 2: Add Your First Product</h2>
            <p className="text-sm text-slate-500 mb-6">Upload a photo, set your price, and go live. You can add more later.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2">
                <label className={lbl}>Product Photo</label>
                <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="mt-1 block w-full text-sm text-slate-500 file:mr-4 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2.5 file:text-sm file:font-bold file:text-emerald-700 hover:file:bg-emerald-100 transition cursor-pointer" />
              </div>
              <div className="md:col-span-2"><label className={lbl}>Product Title *</label><input value={title} onChange={(e) => setTitle(e.target.value)} className={inp} placeholder="e.g., Handmade Adire Scarf - Indigo" /></div>
              <div><label className={lbl}>Category</label><select value={pcat} onChange={(e) => setPcat(e.target.value)} className={inp}>{CATS.map((c) => (<option key={c}>{c}</option>))}</select></div>
              <div><label className={lbl}>Season / Occasion</label><select value={occ} onChange={(e) => setOcc(e.target.value)} className={inp}>{OCC.map((o) => (<option key={o}>{o}</option>))}</select></div>
              <div><label className={lbl}>Price (USD) *</label><input value={price} onChange={(e) => setPrice(e.target.value)} className={inp} placeholder="45" /></div>
              <div><label className={lbl}>Lead Time (Days)</label><input value={lead} onChange={(e) => setLead(e.target.value)} className={inp} placeholder="7" /></div>
              <div className="md:col-span-2"><label className={lbl}>Description *</label><textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={4} className={inp} placeholder="Materials, sizes, colors, what makes it special..." /></div>
            </div>

            <div className="mt-6 flex justify-between items-center">
              <button onClick={() => setStep(1)} className="text-slate-500 font-bold hover:text-slate-800 text-sm transition">← Back</button>
              <button onClick={addProduct} disabled={lBusy} className="bg-amber-500 text-slate-900 px-8 py-3 rounded-xl font-bold hover:bg-amber-400 disabled:opacity-50 transition flex items-center gap-2 shadow-sm">
                {lBusy ? "Publishing..." : "Publish Product & Continue →"}
              </button>
            </div>
            {lMsg && <p className="mt-3 text-center text-sm font-bold text-emerald-700">{lMsg}</p>}
            
            <div className="mt-6 pt-6 border-t border-slate-100 text-center">
              <p className="text-xs text-slate-500 mb-2">Prefer AI to write your listings?</p>
              <Link href="/karakata/studio" className="text-sm font-bold text-cyan-700 hover:underline transition">Open Seller Studio (AI Generator) →</Link>
              <br />
              <Link href="/karakata/auto" className="text-sm font-bold text-emerald-700 hover:underline mt-2 inline-block transition">🚗 Selling a vehicle? Open the Auto Desk →</Link>
            </div>
          </div>
        )}

        {/* STEP 3: GET PAID */}
        {step === 3 && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {stripeSuccess && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm font-bold text-center animate-in fade-in slide-in-from-top-2">
                ✅ Bank account connected successfully! You are ready to receive payouts.
              </div>
            )}
            <h2 className="text-xl font-bold text-slate-900 mb-1">Step 3: Connect Your Bank</h2>
            <p className="text-sm text-slate-500 mb-6">Link your account to receive real money. Delivered orders auto-pay into your bank.</p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-6">
              <div className="flex items-start gap-4">
                <div className="bg-emerald-100 p-3 rounded-full text-2xl shrink-0">🏦</div>
                <div>
                  <h3 className="font-bold text-emerald-900">Stripe Connect</h3>
                  <p className="text-sm text-emerald-800 mt-1">Secure, global payouts. Founding sellers get <span className="font-bold">0% fees for 6 months</span>, then just 8%.</p>
                </div>
              </div>
              
              <div id="stripe_connect" className="mt-4" />
              <button onClick={async () => {
                const el = document.getElementById("stripe_connect");
                if (el) el.innerHTML = "<p class='text-sm text-emerald-700 font-bold mt-2'>Creating your secure Connect account...</p>";
                try {
                  const r = await fetch("/api/karakata/connect/onboard", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
                  const j = await r.json();
                  if (j.ok && j.url) { window.location.href = j.url; }
                  else if (el) el.innerHTML = "<p class='text-sm font-bold text-rose-600 mt-2'>" + (j.error || "Failed") + "</p>";
                } catch (e) { if (el) el.innerHTML = "<p class='text-sm font-bold text-rose-600 mt-2'>Connection error</p>"; }
              }} className="mt-4 w-full md:w-auto bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition shadow-sm">
                Connect your bank (Stripe-hosted) →
              </button>
              <div id="connect_status" className="mt-3 text-sm text-slate-600 font-medium" />
              
              <script dangerouslySetInnerHTML={{ __html: `
                (async () => {
                  try {
                    const getEmail = () => { try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) { const j = JSON.parse(localStorage.getItem(k) || "null"); if (j && j.user && j.user.email) return j.user.email; } } } catch (e) {} return ""; };
                    const email = getEmail();
                    if (!email) return;
                    const r = await fetch("/api/karakata/connect/account?email=" + encodeURIComponent(email));
                    const j = await r.json();
                    const el = document.getElementById("connect_status");
                    if (!j.ok || !j.stripe_account) { if (el) el.innerHTML = "Status: Not connected yet."; return; }
                    const chips = [];
                    if (j.charges_enabled) chips.push("<span class='inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-xs font-bold mr-2'>Charges ✅</span>");
                    if (j.payouts_enabled) chips.push("<span class='inline-flex items-center rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-0.5 text-xs font-bold mr-2'>Payouts ✅</span>");
                    if (chips.length === 0) chips.push("<span class='inline-flex items-center rounded-full bg-amber-100 text-amber-800 px-2.5 py-0.5 text-xs font-bold mr-2'>KYC Pending ⏳</span>");
                    if (el) el.innerHTML = "Account (" + j.stripe_account + "):<br/>" + chips.join(" ");
                  } catch (e) {}
                })();
              `}} />
            </div>

            <div className="flex justify-between items-center">
              <button onClick={() => setStep(2)} className="text-slate-500 font-bold hover:text-slate-800 text-sm transition">← Back</button>
              <Link href="/karakata/sellercenter" className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-sm">
                Go to Seller Dashboard →
              </Link>
            </div>
          </div>
        )}

        <p className="mt-8 text-center text-xs text-slate-400">Founding sellers: 0% commission for 6 months, then 8-10% only when you sell. No subscriptions, no listing fees.</p>
      </div>
    </main>
  );
}
