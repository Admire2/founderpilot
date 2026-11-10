import Link from "next/link";

export default function AffiliateProgramPage() {
  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 text-slate-900">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
            The KaraKata Affiliate Program
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Partner with the future of secure, escrow-backed e-commerce. Earn generous commissions by promoting our marketplace to buyers and sellers.
          </p>
          <Link 
            href="/partners/join" 
            className="inline-block mt-4 px-8 py-3 bg-purple-600 text-white font-bold rounded-lg hover:bg-purple-700 transition shadow-lg shadow-purple-200"
          >
            Apply to Become an Affiliate →
          </Link>
        </div>

        {/* Commission Structure */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">💰 Commission Structure</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="py-3 px-4 text-sm font-bold text-slate-500 uppercase">Tier</th>
                  <th className="py-3 px-4 text-sm font-bold text-slate-500 uppercase">Commission Rate</th>
                  <th className="py-3 px-4 text-sm font-bold text-slate-500 uppercase">Eligibility</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-4 px-4 font-bold text-purple-700">🌟 Founding Ambassador</td>
                  <td className="py-4 px-4 font-bold text-slate-900">5.0%</td>
                  <td className="py-4 px-4 text-slate-600">First 500 affiliates or first 6 months of launch.</td>
                </tr>
                <tr>
                  <td className="py-4 px-4 font-bold text-slate-700">👤 Standard Affiliate</td>
                  <td className="py-4 px-4 font-bold text-slate-900">2.5%</td>
                  <td className="py-4 px-4 text-slate-600">All affiliates joining after the Founding phase.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-500 mt-4">*Note: Commission is calculated on the total order amount (including shipping), before taxes.</p>
        </section>

        {/* Hybrid Payout Model */}
        <section>
          <h2 className="text-2xl font-bold text-slate-900 mb-6">💳 Hybrid Payout Model</h2>
          <p className="text-slate-600 mb-6">
            To protect our platform from return fraud, we use a <strong>60-day clearing period</strong> for all sales. Once cleared, choose your reward:
          </p>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* Credits Option */}
            <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-2xl border-2 border-purple-200 shadow-sm relative">
              <div className="absolute top-4 right-4 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">RECOMMENDED</div>
              <h3 className="text-xl font-bold text-purple-700 mb-2">Option A: Platform Credits</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> <strong>20% Bonus</strong> on your base commission!</li>
                <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> Instantly available after 60-day hold.</li>
                <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> <strong>$0 Minimum</strong> withdrawal.</li>
                <li className="flex gap-2"><span className="text-green-500 font-bold">✓</span> Spend on KaraKata products or seller tools.</li>
              </ul>
            </div>

            {/* Cash Option */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="text-xl font-bold text-slate-700 mb-2">Option B: Cash (Bank/PayPal)</h3>
              <ul className="space-y-3 text-slate-700">
                <li className="flex gap-2"><span className="text-slate-400 font-bold">•</span> Base commission rate only (No bonus).</li>
                <li className="flex gap-2"><span className="text-slate-400 font-bold">•</span> <strong>90-day total hold</strong> (60-day return + 30-day processing).</li>
                <li className="flex gap-2"><span className="text-slate-400 font-bold">•</span> <strong>$100.00 Minimum</strong> withdrawal threshold.</li>
                <li className="flex gap-2"><span className="text-slate-400 font-bold">•</span> Best for professional marketers requiring fiat.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* How to Register & Track */}
        <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">📝 How to Join & Track</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-lg text-slate-900 mb-3">Registration Steps</h3>
              <ol className="space-y-3 text-slate-600 list-decimal list-inside">
                <li><strong>Apply:</strong> Fill out the short form at the <Link href="/partners/join" className="text-purple-600 underline">Partner Portal</Link>.</li>
                <li><strong>Approval:</strong> Reviewed within 24–48 hours.</li>
                <li><strong>Get Link:</strong> Receive your unique referral URL.</li>
                <li><strong>Promote:</strong> Share on your blog, social media, or YouTube.</li>
              </ol>
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 mb-3">Your Dashboard</h3>
              <p className="text-slate-600 mb-3">Once logged in, you get real-time visibility:</p>
              <ul className="space-y-2 text-slate-600 text-sm">
                <li>📈 <strong>Performance:</strong> Clicks, conversions, and sales.</li>
                <li>💵 <strong>Earnings:</strong> Pending vs. Available funds.</li>
                <li>🎯 <strong>Payout Center:</strong> Toggle between Credits and Cash.</li>
                <li>🔗 <strong>Link Generator:</strong> Create custom product links.</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer Note */}
        <div className="text-center text-xs text-slate-500 pt-8 border-t border-slate-200">
          <p>Questions? Contact our Affiliate Support team at affiliates@karakata.com</p>
        </div>

      </div>
    </main>
  );
}
