import Link from "next/link";
const SERVICES = [
  { name: "List Your Product (Free)", href: "/karakata/list", cr: "FREE", desc: "Upload photo, write your own listing, publish live instantly. Zero cost, zero credits. The open marketplace floor.", tags: ["Manual Listing", "Free"] },

  { name: "KaraKata Market - the trade floor", href: "/karakata", cr: "FREE", desc: "The AI-empowered marketplace itself: storefronts, catalog, search. Buyers browse and buy; sellers list in minutes. Amazon reach, Shopify tools, near-zero cost.", tags: ["Storefronts", "Catalog", "Buy & Sell"] },
  { name: "Seller Studio - AI setup engine", href: "/karakata/studio", cr: "2 cr", desc: "One photo + rough words in - AI title, description, tags, category and benchmarked price out - publish live in one tap. No photographer, no copywriter, no $39/mo.", tags: ["Photo to Listing", "Publish"] },
  { name: "KaraKata Listing Writer", href: "/suite/commerce/listing", cr: "10 cr", desc: "Rough notes in - sales-ready listing out: title, hook, bullets, description, SEO keywords, channel tweaks.", tags: ["Listings", "SEO"] },
  { name: "KaraKata Price Strategist", href: "/suite/commerce/price", cr: "10 cr", desc: "Cost stack, break-even, good/better/best band, discount guardrails and a 2-week price test.", tags: ["Margins", "Bands"] },
  { name: "KaraKata Quote & Invoice Builder", href: "/suite/commerce/quote", cr: "10 cr", desc: "Line items in - professional quote PDF out with terms, cover note and follow-up sequence.", tags: ["Quotes", "Invoices"] },
  { name: "Launch Desk - build plan", href: "/suite/karakata/launch", cr: "10 cr", desc: "Marketplace brief in - two sides, liquidity strategy, MVP scope, monetization, trust layer, 90-day roadmap out.", tags: ["Brief", "Roadmap"] },
  { name: "Niche & Liquidity Scanner", href: "/suite/karakata/niche", cr: "10 cr", desc: "Demand read, supply read, liquidity risk score, chicken-and-egg sequence, kill signals.", tags: ["Liquidity", "Sequencing"] },
  { name: "Commission & Fee Modeler", href: "/suite/karakata/fees", cr: "10 cr", desc: "Take-rate range, fee stack, unit economics table, price ladder, leakage watch.", tags: ["Take Rate", "Unit Economics"] },
  { name: "Vendor Onboarding Kit", href: "/suite/karakata/supply", cr: "10 cr", desc: "First-100 suppliers plan, outreach script, application fields, KYC checklist, vendor scorecard.", tags: ["First 100", "KYC"] },
  { name: "Trust & Safety Blueprint", href: "/suite/karakata/trust", cr: "10 cr", desc: "Escrow flow, verification tiers, review policy, dispute SOP, fraud red flags.", tags: ["Escrow", "Disputes"] },
  { name: "Metrics Compass", href: "/suite/karakata/metrics", cr: "10 cr", desc: "North-star metric, liquidity dashboard with benchmarks, weekly ritual, stage gates.", tags: ["North Star", "Benchmarks"] }
];
export default function MarketplaceSuite() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <Link href="/suite" className="text-cyan-400 hover:underline text-sm">← Back to Suite</Link>
      <h1 className="mt-3 text-4xl font-bold">🛒 Marketplace Suite</h1>
      <p className="mt-1 text-sm text-slate-400">KaraKata - the AI-empowered marketplace. Amazon's reach + Shopify's tools + AI at every step, at near-zero cost for every seller and buyer. KaraKata means buying and selling - trade, at the speed of AI.</p>
      <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-[11px] font-bold text-amber-200">🛒 KaraKata is a commerce platform. AI tools are operational aids, not financial or legal advice. Payments and disputes follow market policies.</div>
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SERVICES.map((s) => (
          <div key={s.name} className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5">
            <div className="flex items-center justify-between">
              <p className="font-bold text-amber-200">{s.name}</p>
              <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">{s.cr}</span>
            </div>
            <p className="mt-2 text-xs text-slate-400">{s.desc}</p>
            <div className="mt-3 flex flex-wrap gap-2">{s.tags.map((t) => (<span key={t} className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-slate-300">{t}</span>))}</div>
            <Link href={s.href} className="mt-4 block rounded-lg bg-amber-500 px-4 py-2.5 text-center text-xs font-bold text-slate-950 hover:bg-amber-400">Open</Link>
          </div>
        ))}
      </div>
    </main>
  );
}
