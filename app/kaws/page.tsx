import Link from "next/link";

const products = [
  { id: "kara_rep", name: "Kara AI Sales Rep", desc: "24/7 inbound call answering, lead qualification, and boss nudging.", icon: "📞", price: "$149/mo" },
  { id: "kara_scout", name: "Kara Scout", desc: "AI deal finder. Finds off-market properties and analyzes deal potential.", icon: "🕵️", price: "$149/mo" },
  { id: "kara_investor", name: "Kara Investor", desc: "Voice-enabled deal analyzer. Calculates ARV, rehab costs, and ROI.", icon: "📊", price: "$99/mo" },
  { id: "kara_caller", name: "Kara Caller", desc: "Outbound AI prospector. Calls absentee owners and logs responses.", icon: "📲", price: "$299/mo" },
  { id: "kara_auction", name: "Kara Auction", desc: "Monitors foreclosure auctions and alerts on matching criteria.", icon: "🔨", price: "$199/mo" }
];

const tiers = [
  { name: "Starter", price: "$149", desc: "For solo investors & new agents", features: ["Kara Sales Rep", "Kara CRM", "50 AI Calls/mo"] },
  { name: "Pro", price: "$399", desc: "For active investors & small teams", features: ["Everything in Starter", "+ Kara Scout & Investor", "500 AI Calls/mo", "Kara Auction Monitoring"], highlight: true },
  { name: "Enterprise", price: "$999", desc: "For brokerages & investment firms", features: ["Everything in Pro", "+ Kara Caller (Unlimited)", "White-label Branding", "API Access"] }
];

export default function KawsPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="text-sm font-bold tracking-widest text-indigo-400 uppercase mb-4">KaraKata AI Web Services (KAWS)</div>
        <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">The AI Operating System for Real Estate</h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto">Stop paying for static databases and manual prospecting. KAWS provides intelligent AI agents that find deals, analyze ARV, call owners, and close leads 24/7.</p>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-3xl font-bold mb-8 text-center">The KAWS Product Suite</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {products.map(p => (
            <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-indigo-500 transition">
              <div className="text-4xl mb-4">{p.icon}</div>
              <h3 className="text-xl font-bold mb-2">{p.name}</h3>
              <p className="text-slate-400 text-sm mb-4">{p.desc}</p>
              <div className="text-indigo-400 font-bold">{p.price}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-3xl font-bold mb-12 text-center">Simple, Transparent Pricing</h2>
        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map(t => (
            <div key={t.name} className={`rounded-2xl p-8 border ${t.highlight ? "bg-indigo-900/20 border-indigo-500 scale-105 shadow-2xl shadow-indigo-900/50" : "bg-slate-900 border-slate-800"}`}>
              <h3 className="text-2xl font-bold">{t.name}</h3>
              <div className="text-4xl font-bold my-4">{t.price}<span className="text-lg text-slate-400 font-normal">/mo</span></div>
              <p className="text-slate-400 mb-6">{t.desc}</p>
              <ul className="space-y-3 mb-8">
                {t.features.map(f => (
                  <li key={f} className="flex items-center text-sm">
                    <span className="text-emerald-400 mr-2">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/onboard" className={`block text-center py-3 rounded-lg font-semibold ${t.highlight ? "bg-indigo-600 hover:bg-indigo-500 text-white" : "bg-slate-800 hover:bg-slate-700 text-white"}`}>
                Get Started
              </Link>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}