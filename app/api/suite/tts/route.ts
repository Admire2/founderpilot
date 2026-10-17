import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function tryOpenAI(key: string, text: string, v: string): Promise<Response> {
  const r = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "tts-1", voice: v, input: text }),
  });
  if (!r.ok) throw new Error("oa " + r.status);
  return r;
}

async function tryOpenRouter(key: string, text: string, v: string): Promise<Response> {
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-4o-mini-audio-preview",
      modalities: ["audio", "text"],
      audio: { voice: v, format: "mp3" },
      messages: [{ role: "user", content: "Speak the following text exactly as written, with natural pacing: " + text }],
    }),
  });
  if (!r.ok) throw new Error("or " + r.status);
  const j = await r.json();
  const data = j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.audio ? j.choices[0].message.audio.data : null;
  if (!data) throw new Error("no audio");
  const buf = Buffer.from(data, "base64");
  return new Response(buf, { headers: { "Content-Type": "audio/mpeg" } });
}

export async function POST(req: Request) {
  const { text, voice } = await req.json();
  const orKey = process.env.OPENROUTER_API_KEY || "";
  const oaKey = process.env.OPENAI_API_KEY || "";
  const v = voice || "alloy";

  const order: Array<[string, string]> = [];
  if (oaKey && !oaKey.startsWith("sk-or-")) order.push(["oa", oaKey]);
  if (orKey && orKey.startsWith("sk-or-")) order.push(["or", orKey]);
  if (orKey && !orKey.startsWith("sk-or-")) order.push(["oa", orKey]);
  if (oaKey && oaKey.startsWith("sk-or-")) order.push(["or", oaKey]);

  for (const [p, key] of order) {
    try {
      const res = p === "oa" ? await tryOpenAI(key, text, v) : await tryOpenRouter(key, text, v);
      const ct = res.headers.get("content-type") || "";
      if (ct.includes("audio") || ct.includes("octet-stream")) return res;
    } catch (e) { /* try next provider */ }
  }
  return NextResponse.json({ error: "All audio providers failed" }, { status: 500 });
}