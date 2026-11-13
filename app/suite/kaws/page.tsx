export default function KAWSPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 text-slate-900">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
            KAWS - KaraKata AI Web Services
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Advanced AI-powered enterprise tools and services to power your business, 
            built for the African ecosystem and beyond.
          </p>
        </div>

        {/* Vision Statement */}
        <div className="bg-blue-50 border border-blue-200 p-8 rounded-2xl text-center">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">The Future of Sovereign Productivity</h2>
          <p className="text-blue-800 max-w-3xl mx-auto">
            Kara Office (our AI-native alternative to traditional office suites) and advanced Kara Services 
            are currently in active development. Our focus right now is on perfecting the core KaraKata 
            Marketplace, Admire Intelligence, and our global supply chain infrastructure. 
            These enterprise tools will be rolled out in Phase 2.
          </p>
        </div>

        {/* Placeholder Cards */}
        <div className="grid md:grid-cols-2 gap-8 opacity-75">
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-700 mb-2">Kara Office</h2>
            <p className="text-slate-500 mb-4">
              Sovereign, AI-native productivity suite (Kara Word, Sheets, Notes) powered by the Kara Seek agentic engine. 
            </p>
            <button disabled className="w-full py-3 text-center bg-slate-200 text-slate-500 font-bold rounded-lg cursor-not-allowed">
              Coming in Phase 2
            </button>
          </div>

          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-700 mb-2">Kara Services</h2>
            <p className="text-slate-500 mb-4">
              Enterprise-grade AI automation, Admire Intelligence analytics, and custom workflow integrations.
            </p>
            <button disabled className="w-full py-3 text-center bg-slate-200 text-slate-500 font-bold rounded-lg cursor-not-allowed">
              Coming in Phase 2
            </button>
          </div>
        </div>

      </div>
    </main>
  );
}
