"use client";
import { useState } from "react";
import Link from "next/link";

export default function KaraSearchPage() {
  const [query, setQuery] = useState("");
  const [focus, setFocus] = useState("all");
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setAnswer("");
    setSources([]);
    setStage("Searching the live web...");

    try {
      const res = await fetch("/api/kaws/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, focus }),
      });
      const data = await res.json();

      if (data.ok) {
        setStage("Reading sources and synthesizing...");
        // Simulate a slight delay for UX polish
        setTimeout(() => {
          setAnswer(data.answer);
          setSources(data.sources);
          setLoading(false);
          setStage("");
        }, 800);
      } else {
        setAnswer("Error: " + (data.error || "Search failed."));
        setLoading(false);
      }
    } catch (err) {
      setAnswer("Connection error. Please try again.");
      setLoading(false);
    }
  };

  // Simple function to turn [1] into clickable badges
  const renderAnswerWithCitations = (text: string) => {
    if (!text) return null;
    const parts = text.split(/(\[\d+\])/g);
    return parts.map((part, i) => {
      if (part.match(/^\[\d+\]$/)) {
        const num = part.replace(/[\[\]]/g, "");
        const source = sources[parseInt(num) - 1];
        return (
          <a 
            key={i} 
            href={source?.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center w-5 h-5 mx-0.5 text-[10px] font-bold text-cyan-400 bg-slate-800 border border-cyan-500/30 rounded-full hover:bg-cyan-500 hover:text-white transition cursor-pointer align-super"
            title={source?.title}
          >
            {num}
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Top Nav */}
      <nav className="border-b border-slate-800 p-4 flex justify-between items-center bg-slate-900/50 backdrop-blur">
        <Link href="/" className="text-xl font-bold text-cyan-400">Kara Search</Link>
        <div className="flex gap-4 text-sm text-slate-400">
          <Link href="/karakata" className="hover:text-white transition">Marketplace</Link>
          <Link href="/suite/business" className="hover:text-white transition">Suites</Link>
        </div>
      </nav>

      <main className="flex-1 max-w-4xl w-full mx-auto p-6 flex flex-col">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mt-8 md:mt-16 mb-8">
          <div className="relative group">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything... (e.g., 'Latest trends in solar energy in Nigeria')"
              className="w-full bg-slate-900 border border-slate-700 rounded-2xl px-6 py-4 text-lg text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition shadow-lg"
              disabled={loading}
            />
            <button 
              type="submit" 
              disabled={loading || !query.trim()}
              className="absolute right-3 top-3 bottom-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-700 text-slate-950 font-bold px-6 rounded-xl transition"
            >
              {loading ? "Thinking..." : "Search"}
            </button>
          </div>

          {/* Focus Modes */}
          <div className="flex gap-3 mt-4 justify-center flex-wrap">
            {["all", "academic", "news", "social"].map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFocus(mode)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold capitalize transition ${
                  focus === mode 
                    ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/50" 
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {mode === "all" ? " All" : mode === "academic" ? "🎓 Academic" : mode === "news" ? "📰 News" : "💬 Social"}
              </button>
            ))}
          </div>
        </form>

        {/* Results Area */}
        {(loading || answer) && (
          <div className="flex-1 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* AI Answer */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                {loading ? stage : "AI Synthesis"}
              </h2>
              <div className="text-lg leading-relaxed text-slate-200 whitespace-pre-wrap">
                {answer ? renderAnswerWithCitations(answer) : (
                  <div className="space-y-2">
                    <div className="h-4 bg-slate-800 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-slate-800 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-slate-800 rounded w-5/6 animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Sources */}
            {sources.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Sources ({sources.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sources.map((source, idx) => (
                    <a 
                      key={idx} 
                      href={source.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block bg-slate-900 border border-slate-800 rounded-xl p-4 hover:border-cyan-500/50 hover:bg-slate-800/50 transition group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded bg-slate-800 text-cyan-400 text-xs font-bold flex items-center justify-center border border-slate-700 group-hover:border-cyan-500">
                          {idx + 1}
                        </span>
                        <div className="overflow-hidden">
                          <p className="text-sm font-medium text-white truncate group-hover:text-cyan-400 transition">{source.title}</p>
                          <p className="text-xs text-slate-500 truncate mt-1">{source.url}</p>
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State / Welcome */}
        {!loading && !answer && (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60">
            <h2 className="text-2xl font-bold text-slate-300 mb-2">The AI Answer Engine</h2>
            <p className="text-slate-500 max-w-md">
              Powered by SearXNG for unbiased web retrieval and Qwen AI for deep synthesis. 
              No tracking. No ads. Just answers.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
