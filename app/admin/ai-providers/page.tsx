export const dynamic = "force-dynamic";
const REG = [
  { name: "Vercel AI Gateway - MiniMax M2.7", model: "minimax/minimax-m2.7-free", deal: "FREE promo", expires: "2026-09-07" },
  { name: "Vercel AI Gateway - MiniMax M3", model: "minimax/minimax-m3-free", deal: "FREE promo", expires: "2026-09-07" },
  { name: "Vercel AI Gateway - $5 monthly credits", model: "any model", deal: "Free $5/30 days (Hobby)", expires: "" },
  { name: "OpenRouter - Qwen3 32B", model: "qwen/qwen3-32b", deal: "Your key", expires: "" },
  { name: "Cerebras - Qwen3 32B", model: "qwen-3-32b", deal: "Free tier", expires: "" },
  { name: "SambaNova - Qwen3 32B", model: "Qwen3-32B", deal: "Free tier", expires: "" },
  { name: "Google Gemini flash / lite", model: "gemini-2.0-flash(-lite)", deal: "Free 1,500/day", expires: "" },
];
export default function Page() {
  const now = Date.now();
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <h1 className="text-3xl font-bold">🧠 AI Provider Registry</h1>
      <p className="mt-2 text-sm text-slate-400">Free offers Maxi can use. Expired promos are skipped automatically.</p>
      <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="bg-white/5 text-left">
            <tr><th className="p-3">Provider</th><th className="p-3">Model</th><th className="p-3">Deal</th><th className="p-3">Expires</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody>
            {REG.map((r) => {
              const expired = r.expires && now > Date.parse(r.expires);
              return (
                <tr key={r.name} className="border-t border-white/10">
                  <td className="p-3 font-bold">{r.name}</td>
                  <td className="p-3 font-mono text-xs text-slate-400">{r.model}</td>
                  <td className="p-3">{r.deal}</td>
                  <td className="p-3">{r.expires || "—"}</td>
                  <td className="p-3"><span className={"rounded-full px-2 py-0.5 text-[10px] font-bold " + (expired ? "bg-red-500/20 text-red-300" : "bg-emerald-500/20 text-emerald-300")}>{expired ? "EXPIRED - auto-skipped" : "ACTIVE"}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}