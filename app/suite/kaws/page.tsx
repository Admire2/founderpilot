import Link from "next/link";

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
            Advanced AI-powered enterprise tools and services to power your business, built for the African ecosystem and beyond.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          
          {/* Kara Office */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Kara Office</h2>
            <p className="text-slate-600 mb-4">
              A fully white-labeled, AI-enhanced enterprise office suite. Seamlessly create, edit, and collaborate on documents, spreadsheets, and presentations.
            </p>
            <ul className="space-y-2 text-sm text-slate-500 mb-6">
              <li className="flex gap-2"><span className="text-green-500">✓</span> AI Document Summarization</li>
              <li className="flex gap-2"><span className="text-green-500">✓</span> Smart Spreadsheet Analytics</li>
              <li className="flex gap-2"><span className="text-green-500">✓</span> Offline & Cloud Sync</li>
            </ul>
            {/* ✅ WIRED TO YOUR EXISTING OFFICE SUITE */}
            <Link href="/suite/office" className="block w-full py-3 text-center bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition">
              Open Kara Office
            </Link>
          </div>

          {/* Kara Services */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Kara Services</h2>
            <p className="text-slate-600 mb-4">
              Enterprise-grade AI automation and data services. From workflow optimization to predictive analytics, scale your operations effortlessly.
            </p>
            <ul className="space-y-2 text-sm text-slate-500 mb-6">
              <li className="flex gap-2"><span className="text-green-500">✓</span> Admire Intelligence Analytics</li>
              <li className="flex gap-2"><span className="text-green-500">✓</span> Automated Workflow Agents</li>
              <li className="flex gap-2"><span className="text-green-500">✓</span> Custom API Integrations</li>
            </ul>
            {/* ✅ WIRED TO YOUR EXISTING BUSINESS SUITE */}
            <Link href="/suite/business" className="block w-full py-3 text-center bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition">
              Explore Kara Services
            </Link>
          </div>

        </div>

        {/* Coming Soon Section */}
        <div className="bg-slate-100 p-8 rounded-2xl border border-dashed border-slate-300 text-center">
          <h3 className="text-xl font-bold text-slate-700 mb-2">More Services Coming Soon</h3>
          <p className="text-slate-500">Additional AI web services, including specialized industry tools, will be added to the KAWS ecosystem shortly.</p>
        </div>

      </div>
    </main>
  );
}
