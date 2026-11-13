"use client";

export default function KAWSPage() {
  // TODO: wire these to the REAL kara-office-suite deployment once located.
  // NOTE: Kara Office is a Vite app (separate repo), NOT a Next.js route.
  //       It will be linked via an external URL / port, not <Link href>.
  const handleLaunch = (service: string) => {
    console.log(`[KAWS] Launch requested: ${service} — target not yet wired.`);
  };

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 text-slate-900">
      <div className="max-w-5xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
            KAWS - KaraKata AI Web Services
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Advanced AI-powered enterprise tools and services to power your business,
            built for the African ecosystem and beyond.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Kara Office (real build = separate repo: kara-office-suite) */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Kara Office</h2>
            <p className="text-slate-600 mb-4">
              Sovereign, AI-native productivity suite — Kara Word, Kara Sheets, Kara Notes —
              powered by the Kara Seek agentic engine. 100% data privacy, zero third-party APIs.
            </p>
            <ul className="space-y-2 text-sm text-slate-500 mb-6">
              <li className="flex gap-2"><span className="text-green-500">✓</span> Kara Word · Kara Sheets · Kara Notes</li>
              <li className="flex gap-2"><span className="text-green-500">✓</span> Kara Seek / Kara Cloud / Kara Local (3-tier AI)</li>
              <li className="flex gap-2"><span className="text-green-500">✓</span> On-premises, offline-capable</li>
            </ul>
            <button
              onClick={() => handleLaunch("Kara Office")}
              className="w-full py-3 text-center bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition"
            >
              Open Kara Office
            </button>
          </div>

          {/* Kara Services (KAWS AI web services — NOT the Business Suite) */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Kara Services</h2>
            <p className="text-slate-600 mb-4">
              Enterprise-grade AI automation and data services — workflow optimization,
              predictive analytics, and custom integrations.
            </p>
            <ul className="space-y-2 text-sm text-slate-500 mb-6">
              <li className="flex gap-2"><span className="text-green-500">✓</span> Admire Intelligence Analytics</li>
              <li className="flex gap-2"><span className="text-green-500">✓</span> Automated Workflow Agents</li>
              <li className="flex gap-2"><span className="text-green-500">✓</span> Custom API Integrations</li>
            </ul>
            <button
              onClick={() => handleLaunch("Kara Services")}
              className="w-full py-3 text-center bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition"
            >
              Explore Kara Services
            </button>
          </div>
        </div>

        <div className="bg-slate-100 p-8 rounded-2xl border border-dashed border-slate-300 text-center">
          <h3 className="text-xl font-bold text-slate-700 mb-2">More Services Coming Soon</h3>
          <p className="text-slate-500">Additional AI web services will be added to the KAWS ecosystem shortly.</p>
        </div>
      </div>
    </main>
  );
}
