"use client";
import WalletBar from "@/app/components/WalletBar";
import { useState } from "react";
import Link from "next/link";

const VOICES = [
  { id: "alloy", label: "Alloy (Neutral & Balanced)" },
  { id: "echo", label: "Echo (Male, Professional)" },
  { id: "fable", label: "Fable (Female, Expressive)" },
  { id: "onyx", label: "Onyx (Male, Deep & Authoritative)" },
  { id: "nova", label: "Nova (Female, Warm & Friendly)" },
  { id: "shimmer", label: "Shimmer (Female, Crisp & Clear)" },
];

export default function TextToAudioPage() {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("alloy");
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const generate = async () => {
    if (text.trim().length < 10) { alert("Please enter at least 10 characters."); return; }
    setLoading(true); setAudioUrl(null);
    try {
      const res = await fetch("/api/suite/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice }),
      });
      const ct = res.headers.get("content-type") || "";
      if (!res.ok || !ct.startsWith("audio")) { alert("Audio generation failed. Please try a shorter text or try again."); setLoading(false); return; }
      const blob = await res.blob();
      setAudioUrl(URL.createObjectURL(blob));
    } catch (e) { alert("Error generating audio."); }
    setLoading(false);
  };

  const download = () => {
    if (!audioUrl) return;
    const a = document.createElement("a");
    a.href = audioUrl;
    a.download = "founderpilot-audio.mp3";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const inputClass = "w-full rounded-xl border border-white/10 bg-slate-900/70 p-4 text-sm text-white outline-none focus:border-cyan-400";

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <WalletBar />

      <div className="max-w-3xl mx-auto">
        <Link href="/suite" className="text-cyan-400 hover:underline mb-6 inline-block">&larr; Back to Suite</Link>
        <h1 className="text-3xl font-bold mb-2">Text-to-Audio Generator</h1>
        <p className="text-slate-400 mb-8">Turn blogs, emails, or scripts into professional, human-sounding MP3 audio files instantly.</p>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium">Your Text (up to ~3000 characters)</label>
            <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your article, podcast intro, or cold email script here..." className={inputClass + " min-h-[200px]"} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">Choose a Voice</label>
            <select value={voice} onChange={(e) => setVoice(e.target.value)} className={inputClass}>
              {VOICES.map((v) => <option key={v.id} value={v.id}>{v.label}</option>)}
            </select>
          </div>
          <button onClick={generate} disabled={loading} className="w-full rounded-xl bg-cyan-500 px-6 py-4 font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition">
            {loading ? "Generating Human Audio..." : "Generate MP3 Audio"}
          </button>
        </div>

        {audioUrl && (
          <div className="mt-8 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-8 space-y-4">
            <h2 className="text-xl font-bold text-emerald-300">Your Audio is Ready!</h2>
            <audio controls src={audioUrl} className="w-full mb-4" />
            <button onClick={download} className="w-full rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-slate-950 hover:bg-emerald-400 transition">Download MP3 File</button>
          </div>
        )}
      </div>
    </main>
  );
}