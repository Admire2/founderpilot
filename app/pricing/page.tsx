"use client";
import Link from "next/link";

const LINKS = {
  proMonthly: "https://buy.stripe.com/bJe9AS41yeKP7SkeIUdEs00",
  teamMonthly: "https://buy.stripe.com/4gMbJ069G7in1tW8kwdEs01",
  proAnnual: "https://buy.stripe.com/8x228q41yfOT0pS7gsdEs05",
  teamAnnual: "https://buy.stripe.com/bJebJ069G1Y31tWcAMdEs04",
};

  const PACKS = [
    { name: "Credit Pack Starter", price: 10, credits: 150, id: "price_1UB2bVBX3gfWpU1TuJ8pFmPw" },
    { name: "Credit Pack Plus", price: 19, credits: 300, id: "price_1UB2bWBX3gfWpU1Tb2ulwp6i" },
    { name: "Credit Pack Pro", price: 59, credits: 1000, id: "price_1UB2bWBX3gfWpU1TqIVDi36g" },
    { name: "Credit Pack Studio", price: 199, credits: 4000, id: "price_1UB2bXBX3gfWpU1TPMB19spQ" }
  ];
  const buyPack = async (pk: any) => {
    let email = "";
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) { const jj = JSON.parse(localStorage.getItem(k) || "null"); email = (jj && jj.user && jj.user.email) || ""; if (email) break; } } } catch (e) {}
    const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ priceId: pk.id, email: email, pack: pk.name, credits: pk.credits }) });
    const j = await res.json().catch(() => null);
    if (j && j.url) window.location.href = j.url;
    else alert("Checkout failed: " + ((j && j.error) || "check Stripe keys"));
  };  const ENG: any = {
    maxi: { starter: "price_1UB2bNBX3gfWpU1TqPs1soRP", pro: "price_1U9ZyRBX3gfWpU1Twisvlbl6", enterprise: "price_1UB2bOBX3gfWpU1TMImiq8ul" },
    rivet: { starter: "price_1UB2bPBX3gfWpU1TkhYn2sRG", pro: "price_1UB2bPBX3gfWpU1ThUBG8I6i", enterprise: "price_1UB2bQBX3gfWpU1TStwLn4ku" },
    volt: { starter: "price_1UB2bRBX3gfWpU1TQuYmTKJa", pro: "price_1UB2bRBX3gfWpU1TItgacpgg", enterprise: "price_1UB2bSBX3gfWpU1TZ336wZYd" },
    terra: { starter: "price_1UB2bTBX3gfWpU1Tfgao8fM2", pro: "price_1UB2bTBX3gfWpU1T5fTUCOjX", enterprise: "price_1UB2bUBX3gfWpU1T2oa6nOU3" },
    studio: "price_1UB2bUBX3gfWpU1TOMs43OOE"
  };
  const checkoutPrice = async (priceId: string, pack: string, credits: number) => {
    let email = "";
    try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.indexOf("sb-") === 0 && k.indexOf("-auth-token") > 0) { const jj = JSON.parse(localStorage.getItem(k) || "null"); email = (jj && jj.user && jj.user.email) || ""; if (email) break; } } } catch (e) {}
    const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ priceId: priceId, email: email, pack: pack, credits: credits }) });
    const j = await res.json().catch(() => null);
    if (j && j.url) window.location.href = j.url;
    else alert("Checkout failed: " + ((j && j.error) || "check Stripe keys"));
  };  const manageBilling = async () => {
    const res = await fetch("/api/billing-portal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    const j = await res.json();
    if (j.url) window.open(j.url, "_blank");
    else alert("No active subscription found.");
  };
export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      tagline: "Test the waters",
      price: "$0",
      period: "forever",
      note: "",
      features: [
        "3 reports per tool",
        "All 4 AI tools included",
        "Saved report history on your device",
        "No credit card required",
      ],
      buttons: [{ label: "Start Free", href: "/validator", primary: false }],
      featured: false,
    },
    {
      name: "Pro",
      tagline: "For serious founders",
      price: "$9",
      period: "per month",
      note: "or $99/year - save 15%",
      features: [
        "1 founder seat",
        "Unlimited AI reports",
        "Priority AI speed",
        "Cloud history (with accounts)",
        "Email support",
      ],
      buttons: [
        { label: "Go Pro Annual\n(Best Value)", href: LINKS.proAnnual, primary: true },
        { label: "Go Pro Monthly", href: LINKS.proMonthly, primary: false },
      ],
      featured: true,
    },
    {
      name: "Team",
      tagline: "For founding teams",
      price: "$29",
      period: "per month",
      note: "or $299/year - save 28%",
      features: [
        "Everything in Pro",
        "Maximum of 5 team seats",
        "Shared project workspace",
        "Team report history",
        "Email support",
      ],
      buttons: [
        { label: "Start Team Annual\n(Best Value)", href: LINKS.teamAnnual, primary: true },
        { label: "Start Team Monthly", href: LINKS.teamMonthly, primary: false },
      ],
      featured: false,
    },
    {
      name: "Enterprise",
      tagline: "For organizations and large teams",
      price: "Custom",
      period: "pricing",
      note: "",
      features: [
        "More than 5 team seats",
        "Dedicated account manager",
        "Priority support with SLA",
        "Custom AI tuning for your industry",
        "Invoice-based billing",
      ],
      buttons: [{ label: "Contact Management", href: "/contact", primary: false }],
      featured: false,
    },
  ];

  return (
    <main className="w-full min-w-0 p-6 md:p-10">
      <div className="mx-auto max-w-6xl min-w-0">
        <header className="mb-10 text-center">
          <p className="text-sm uppercase tracking-[0.2em] text-cyan-400">Pricing</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Simple pricing that pays for itself</h1>
          <p className="mt-3 text-slate-400">
            One validated idea saves you months of wasted work. Start free, upgrade when you are serious.
          </p><div className="mt-6 flex flex-wrap gap-2 text-xs font-bold"><a href="#business" className="rounded-full border border-cyan-500/40 px-3 py-1 text-cyan-200">Business Suite</a><a href="#engineering" className="rounded-full border border-cyan-500/40 px-3 py-1 text-cyan-200">Engineering Suites</a><a href="#packs" className="rounded-full border border-amber-500/40 px-3 py-1 text-amber-200">One-Time Credit Packs</a></div><h2 id="business" className="mt-8 text-2xl font-bold text-cyan-300">Business Suite</h2><p className="mt-1 text-sm text-slate-400">Idea-to-plan AI tools for founders.</p></header>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 flex flex-col transition-all duration-300 ${
                plan.featured
                  ? "border-cyan-500/60 bg-cyan-500/10 shadow-lg shadow-cyan-500/10 scale-[1.02]"
                  : "border-white/10 bg-white/5"
              }`}
            >
              {plan.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-cyan-500 px-4 py-1 text-xs font-bold text-slate-950">
                  MOST POPULAR
                </div>
              )}

              <h2 className="text-lg font-semibold">{plan.name}</h2>
              <p className="text-sm text-slate-400">{plan.tagline}</p>

              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-4xl font-bold">{plan.price}</span>
                <span className="text-sm text-slate-400">{plan.period}</span>
              </div>
              {plan.note && <p className="mt-1 text-sm font-medium text-emerald-300">{plan.note}</p>}

              <ul className="mt-6 space-y-3 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm text-slate-300">
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                    {feature}
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-col gap-3">
                {plan.buttons.map((btn) => (
                  <Link
                    key={btn.label}
                    href={btn.href}
                    target={btn.href.startsWith("http") ? "_blank" : "_self"}
                    className={`whitespace-pre-line rounded-xl px-6 py-3 text-center font-semibold transition ${
                      btn.primary
                        ? "bg-cyan-500 text-slate-950 hover:bg-cyan-400"
                        : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                    }`}
                  >
                    {btn.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
          <p className="text-sm text-slate-400">
            Payments are processed securely by Stripe. Annual plans are billed once per year. Teams larger than 5 members should contact management for Enterprise pricing.
          </p>
        </div>
      </div>
                <h2 id="engineering" className="mt-14 text-2xl font-bold text-cyan-300">Engineering Suites - Maxi · Rivet · Volt · Terra</h2>
      <p className="mt-1 text-sm text-slate-400">Per-suite subscriptions with monthly credits - or bundle all four with Studio.</p>
      <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/5 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-bold text-emerald-200">Studio Bundle (All 4 Suites)</p>
            <p className="text-2xl font-bold">$599<span className="text-sm text-slate-400">/mo</span></p>
            <p className="text-xs text-slate-400">4,000 credits/mo · 3 seats · Team plan + design review · priority AI + partner shortlist</p>
          </div>
          <button onClick={() => checkoutPrice(ENG.studio, "studio_bundle", 4000)} className="rounded-lg bg-emerald-500 px-5 py-2.5 text-xs font-bold text-slate-950 hover:bg-emerald-400">Get Studio</button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        {(["maxi","rivet","volt","terra"] as any[]).map((s: any) => (
          <div key={s} className="rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
            <p className="font-bold text-cyan-200 uppercase">{s}</p>
            <p className="mt-2 text-[11px] text-slate-400">Starter · $49/mo · 150 cr</p>
            <button onClick={() => checkoutPrice(ENG[s].starter, s + "_starter", 150)} className="mt-1 w-full rounded-lg bg-cyan-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-cyan-400">Choose starter</button>
            <p className="mt-2 text-[11px] text-slate-400">Pro · $99/mo · 500 cr</p>
            <button onClick={() => checkoutPrice(ENG[s].pro, s + "_pro", 500)} className="mt-1 w-full rounded-lg bg-cyan-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-cyan-400">Choose pro</button>
            <p className="mt-2 text-[11px] text-slate-400">Enterprise · $299/mo · 2,000 cr</p>
            <button onClick={() => checkoutPrice(ENG[s].enterprise, s + "_enterprise", 2000)} className="mt-1 w-full rounded-lg bg-cyan-500 px-3 py-1.5 text-[11px] font-bold text-slate-950 hover:bg-cyan-400">Choose enterprise</button>
          </div>
        ))}
      </div>      <h2 id="packs" className="mt-14 text-2xl font-bold text-amber-300">One-Time Credit Packs</h2>
      <p className="mt-1 text-sm text-slate-400">No subscription. No expiry. Credits work across every suite - the fastest way to start.</p>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        {PACKS.map((pk: any) => (
          <div key={pk.name} className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="font-bold text-amber-200">{pk.name}</p>
            <p className="mt-1 text-3xl font-bold">${pk.price}</p>
            <p className="text-xs text-slate-400">{pk.credits} credits</p>
            <button onClick={() => buyPack(pk)} className="mt-3 w-full rounded-lg bg-amber-500 px-3 py-2 text-xs font-bold text-slate-950 hover:bg-amber-400">Buy Pack</button>
          </div>
        ))}
      </div>      <button onClick={manageBilling} className="mt-4 w-full rounded-xl border border-cyan-500/40 px-4 py-3 text-sm font-bold text-cyan-200 hover:bg-cyan-500/10">Manage Subscription / Update Card</button>
    </main>
  );
}