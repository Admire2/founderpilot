import Link from "next/link";

const suites = [
  { name: "Business Suite", path: "/suite/business", icon: "??", color: "bg-blue-600", desc: "Your daily operating system for files, documents, and growth." },
  { name: "Engineering Suite", path: "/suite/engineering", icon: "??", color: "bg-yellow-600", desc: "Advanced engineering tools and AI assistants." },
  { name: "Healthcare Suite", path: "/suite/healthcare", icon: "??", color: "bg-red-600", desc: "AI-driven health diagnostics, medical records, and wellness tracking." },
  { name: "KaraKata Market", path: "/karakata", icon: "", color: "bg-amber-600", desc: "Escrow-protected marketplace with verified reviews." },
  { name: "KAWS", path: "/kaws", icon: "??", color: "bg-cyan-600", desc: "KaraKata AI Web Services - The AI co-founder for every founder." },
  { name: "Launch", path: "/launch", icon: "??", color: "bg-purple-600", desc: "Launch your startup with AI-powered tools and guidance." },
];

export default function SuitePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-4xl font-bold mb-2">FounderPilot Suites</h1>
      <p className="text-slate-400 mb-8">Choose your suite to get started</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {suites.map((suite) => (
          <Link
            key={suite.path}
            href={suite.path}
            className={suite.color + " p-6 rounded-xl hover:scale-105 transition-transform shadow-lg"}
          >
            <div className="text-4xl mb-3">{suite.icon}</div>
            <h2 className="text-2xl font-bold mb-2">{suite.name}</h2>
            <p className="text-sm opacity-90">{suite.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
