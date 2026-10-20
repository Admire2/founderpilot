"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function BuildStoreChoicePage() {
  const router = useRouter();

  const handleAIBuild = () => {
    // Navigate to AI builder with a flag
    router.push('/karakata/build/ai?mode=new');
  };

  const handleManualBuild = () => {
    // Go to seller center for manual building
    router.push('/karakata/sellercenter');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <Link href="/karakata" className="text-cyan-400 hover:underline text-sm mb-4 inline-block">
        ← Back to KaraKata Market
      </Link>

      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-3 text-amber-400">
          🏪 Build Your KaraKata Store
        </h1>
        <p className="text-center text-slate-300 mb-12 text-lg">
          Choose how you want to create your storefront - both options are free
        </p>

        {/* Two Options Side by Side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* LEFT: AI Store Builder */}
          <div className="bg-gradient-to-br from-cyan-900/40 to-blue-900/40 rounded-2xl p-8 border-2 border-cyan-500/40 hover:border-cyan-400 transition-all hover:scale-105">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🤖</div>
              <h2 className="text-2xl font-bold text-cyan-400 mb-2">AI Store Builder</h2>
              <p className="text-sm text-slate-300">Let Kara AI design your store automatically</p>
            </div>

            <ul className="space-y-3 mb-8 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">✓</span>
                <span>Tell Kara what you sell in plain English</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">✓</span>
                <span>AI generates store name, tagline & description</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">✓</span>
                <span>Auto-suggests products, prices & categories</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">✓</span>
                <span>Sets up your theme & branding</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400">✓</span>
                <span>Takes 2 minutes - you review & approve</span>
              </li>
            </ul>

            <button 
              onClick={handleAIBuild}
              className="w-full bg-cyan-500 text-slate-900 py-3 rounded-xl font-bold text-lg hover:bg-cyan-400 transition shadow-lg shadow-cyan-500/20"
            >
              ✨ Build with AI (Free)
            </button>

            <p className="text-center text-xs text-slate-400 mt-3">
              Powered by Qwen AI
            </p>
          </div>

          {/* RIGHT: Build Manually */}
          <div className="bg-gradient-to-br from-amber-900/40 to-orange-900/40 rounded-2xl p-8 border-2 border-amber-500/40 hover:border-amber-400 transition-all hover:scale-105">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🛠️</div>
              <h2 className="text-2xl font-bold text-amber-400 mb-2">Build It Yourself</h2>
              <p className="text-sm text-slate-300">Full control - add products one by one</p>
            </div>

            <ul className="space-y-3 mb-8 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-amber-400">✓</span>
                <span>Complete creative control</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">✓</span>
                <span>Add products at your own pace</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">✓</span>
                <span>Upload photos, set prices manually</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">✓</span>
                <span>Customize every detail</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400">✓</span>
                <span>Perfect if you already have inventory</span>
              </li>
            </ul>

            <button 
              onClick={handleManualBuild}
              className="w-full bg-amber-500 text-slate-900 py-3 rounded-xl font-bold text-lg hover:bg-amber-400 transition shadow-lg shadow-amber-500/20"
            >
               Build Manually (Free)
            </button>

            <p className="text-center text-xs text-slate-400 mt-3">
              Go to Seller Center
            </p>
          </div>
        </div>

        {/* Bottom Benefits */}
        <div className="mt-12 bg-slate-900/50 rounded-xl p-6 border border-slate-800">
          <h3 className="text-lg font-bold text-center mb-4">🎁 All Founding Sellers Get:</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm text-slate-300">
            <div>
              <div className="text-emerald-400 font-bold text-lg">0%</div>
              <div>Commission (6 months)</div>
            </div>
            <div>
              <div className="text-emerald-400 font-bold text-lg">Free</div>
              <div>AI Store Builder</div>
            </div>
            <div>
              <div className="text-emerald-400 font-bold text-lg">Free</div>
              <div>BI Dashboard</div>
            </div>
            <div>
              <div className="text-emerald-400 font-bold text-lg">Free</div>
              <div>Escrow Protection</div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 text-center text-slate-400 text-sm">
          <p>Not sure which to choose?</p>
          <Link href="/karakata/sellers" className="text-cyan-400 hover:underline">
            Browse existing stores for inspiration →
          </Link>
        </div>
      </div>
    </div>
  );
}
