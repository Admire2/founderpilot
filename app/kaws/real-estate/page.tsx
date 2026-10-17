import Link from "next/link";

const tools = [
  { name: "Kara Scout", href: "/kaws/scout", icon: "🕵️", status: "LIVE", desc: "Say your buy-box in plain language. Kara pulls county records, filters absentee owners, skip-traces at $0.09/lead.", beats: "Replaces PropStream + DealMachine" },
  { name: "Kara Leaderboard", href: "/kaws/leaderboard", icon: "", status: "LIVE", desc: "Live leaderboard of underpriced and overpriced properties.", beats: "The viral NYC leaderboard tool" },
  { name: "Kara Map", href: "/kaws/map", icon: "🗺️", status: "LIVE", desc: "Interactive deal map scored by transit, schools, amenities.", beats: "Replaces spreadsheet comps" },
  { name: "Kara Investor", href: "/kaws/investor", icon: "📊", status: "LIVE", desc: "Voice-enabled deal analyzer: ARV, rehab budget, rental yield.", beats: "Replaces spreadsheets + HouseCanary" },
  { name: "Kara Caller", href: "/kaws/caller", icon: "📲", status: "LIVE ENGINE", desc: "Upload 100 absentee owners. Kara calls every one while you sleep.", beats: "Replaces Retell AI" },
  { name: "Kara Negotiator", href: "/kaws/negotiator", icon: "🤝", status: "LIVE", desc: "Drafts offers and counter-offers, then negotiates terms.", beats: "The AI COO negotiator" },
  { name: "Kara Scriptwriter", href: "/kaws/scriptwriter", icon: "✍️", status: "LIVE", desc: "Writes per-lead call scripts and email outreach.", beats: "Replaces manual copywriting" },
  { name: "Kara Auction", href: "/kaws/auction", icon: "🔨", status: "LIVE", desc: "Watches sheriff sales and alerts you when a deal matches.", beats: "Replaces manual monitoring" },
  { name: "Kara CRM", href: "/kaws/crm", icon: "️", status: "LIVE", desc: "Every call becomes a structured intake form with a completeness score.", beats: "Replaces Follow Up Boss" },
  { name: "Kara Vision", href: "/kaws/vision", icon: "👁️", status: "LIVE", desc: "Send a photo: Kara grades condition, estimates rehab and stages virtually.", beats: "Replaces Restb.ai" },
  { name: "Kara Reader", href: "/kaws/reader", icon: "📄", status: "LIVE", desc: "Drop an OM or lease: Kara extracts financials and flags risks.", beats: "Replaces V7 Labs" },
  { name: "Kara Nurture", href: "/kaws/nurture", icon: "💬", status: "LIVE", desc: "Automated SMS/email drip keeps leads warm.", beats: "Replaces Structurely" },
  { name: "Kara Valuate", href: "/kaws/valuate", icon: "🎁", status: "LIVE", desc: "Free public tool: instant AI estimate for homeowners.", beats: "The Zillow lead magnet" },
  { name: "Kara Autopilot", href: "/kaws/autopilot", icon: "🛰️", status: "LIVE", desc: "Your AI COO: nightly autonomous workflows.", beats: "The autonomous layer" },
  { name: "Kara Coordinator", href: "/kaws/coordinator", icon: "📋", status: "LIVE", desc: "Generate professional closing timelines instantly.", beats: "Replaces ListedKit" },
  { name: "Kara Contract Review", href: "/kaws/contract", icon: "⚖️", status: "LIVE", desc: "Paste contract text to flag missing clauses.", beats: "Replaces Spellbook" },
  { name: "Kara MCP Server", href: "/kaws/mcp", icon: "🔌", status: "LIVE", desc: "Exposes Kara tools to Claude Desktop and Cursor.", beats: "The open-standard connector" },
  { name: "Kara Mobile DFD", href: "/kaws/mobile-dfd", icon: "", status: "LIVE", desc: "Driving for Dollars: Snap photos, auto-add to Scout.", beats: "Replaces DealMachine" },
  { name: "Kara Sentinel", href: "/kaws/sentinel", icon: "👁️", status: "LIVE", desc: "Real-time health monitoring for 150+ concurrent voice agents.", beats: "Enterprise uptime monitoring" },
  { name: "Kara Lifeline & Downsize", href: "/kaws/lifeline", icon: "️", status: "LIVE", desc: "Pre-foreclosure rescue and downsizing intervention. Empathetic AI outreach.", beats: "Replaces cold-calling vultures" }
];

export default function RealEstateSuitePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <header className="max-w-6xl mx-auto px-6 py-14">
        <div className="text-sm font-bold tracking-widest text-indigo-400 uppercase mb-3">KAWS Member 02</div>
        <h1 className="text-4xl font-bold mb-4">KAWS Real Estate Suite</h1>
        <p className="text-lg text-slate-400 max-w-3xl">Twenty AI agents that cover the whole deal cycle: find it, rank it, map it, analyze it, call the owner, negotiate, watch the auction, and never drop the follow-up.</p>
      </header>

      <section className="max-w-6xl mx-auto px-6 pb-8 grid md:grid-cols-2 gap-5">
        <div className="rounded-xl border border-emerald-700 bg-emerald-900/20 p-6">
          <div className="text-xs font-bold tracking-widest text-emerald-400 uppercase mb-2">Track 1</div>
          <h3 className="text-xl font-bold mb-2">Licensed Real Estate Agent</h3>
          <p className="text-sm text-slate-300 mb-4">You hold a state license. Unlock MLS live data, full CMA reports, IDX website search, listing marketing, and transaction coordination.</p>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>✅ 600+ MLSs live across US & Canada</li>
            <li>✅ Full CMA with MLS comps</li>
            <li>✅ IDX search on your website</li>
            <li>✅ Transaction coordination & Contract review</li>
          </ul>
        </div>
        <div className="rounded-xl border border-amber-700 bg-amber-900/20 p-6">
          <div className="text-xs font-bold tracking-widest text-amber-400 uppercase mb-2">Track 2</div>
          <h3 className="text-xl font-bold mb-2">💼 Unlicensed Real Estate Investor</h3>
          <p className="text-sm text-slate-300 mb-4">No license needed. Use public records, skip tracing, driving for dollars, auction monitoring, and wholesale deal analysis.</p>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>✅ County records + skip tracing</li>
            <li>✅ Wholesale / fix-and-flip analysis</li>
            <li>✅ Auction + pre-foreclosure alerts</li>
            <li>✅ Driving for Dollars mobile app</li>
          </ul>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-16 grid md:grid-cols-2 gap-5">
        {tools.map((t) => (
          <Link 
            key={t.name} 
            href={t.href} 
            className="block bg-slate-900 border border-slate-800 rounded-xl p-6 hover:border-indigo-500 hover:bg-slate-800/50 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl group-hover:scale-110 transition-transform">{t.icon}</span>
                <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition-colors">{t.name}</h3>
              </div>
              <span className={"text-xs px-2 py-1 rounded " + (t.status.includes("LIVE") ? "bg-emerald-900 text-emerald-300" : "bg-amber-900 text-amber-300")}>{t.status}</span>
            </div>
            <p className="text-sm text-slate-300 mb-3">{t.desc}</p>
            <p className="text-xs text-slate-500 italic">{t.beats}</p>
          </Link>
        ))}
        
        <Link href="/onboard" className="block bg-indigo-900/20 border border-indigo-700 rounded-xl p-6 flex flex-col justify-center hover:bg-indigo-900/30 transition cursor-pointer md:col-span-2">
          <h3 className="text-lg font-bold mb-2 text-indigo-300 text-center">Want Kara on your phones today?</h3>
          <p className="text-sm text-slate-300 mb-4 text-center">The AI Sales Rep is live now for all 12 industries - including brokerages, wholesalers and property managers.</p>
          <span className="text-center py-3 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-500 text-white">Launch My AI Sales Rep →</span>
        </Link>
      </section>
    </main>
  );
}