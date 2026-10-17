import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  const form = await req.formData();
  const file = form.get("audio") as File | null;
  if (!file) return NextResponse.json({ error: "No audio file" }, { status: 400 });

  const orKey = process.env.OPENROUTER_API_KEY || "";
  const oaKey = process.env.OPENAI_API_KEY || "";

  const order: Array<[string, string]> = [];
  if (oaKey && !oaKey.startsWith("sk-or-")) order.push(["oa", oaKey]);
  if (orKey && orKey.startsWith("sk-or-")) order.push(["or", orKey]);
  if (orKey && !orKey.startsWith("sk-or-")) order.push(["oa", orKey]);
  if (oaKey && oaKey.startsWith("sk-or-")) order.push(["or", oaKey]);

  for (const [p, key] of order) {
    try {
      if (p === "oa") {
        const fd = new FormData();
        fd.append("file", new Blob([await file.arrayBuffer()]), file.name);
        fd.append("model", "whisper-1");
        const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: { "Authorization": "Bearer " + key },
          body: fd,
        });
        if (!r.ok) throw new Error("oa " + r.status);
        const j = await r.json();
        if (!j.text) throw new Error("no text");
        return NextResponse.json({ text: j.text });
      } else {
        const bytes = await file.arrayBuffer();
        const b64 = Buffer.from(bytes).toString("base64");
        const ext = (file.name.split(".").pop() || "mp3").toLowerCase();
        const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "openai/gpt-4o-mini-audio-preview",
            messages: [
              { role: "system", content: "You are a professional transcriber. Transcribe the audio exactly, with correct punctuation. Return only the transcription text." },
              { role: "user", content: [{ type: "input_audio", input_audio: { data: b64, format: ext } }] },
            ],
          }),
        });
        if (!r.ok) throw new Error("or " + r.status);
        const j = await r.json();
        const text = j.choices && j.choices[0] && j.choices[0].message ? j.choices[0].message.content : null;
        if (!text) throw new Error("no text");
        return NextResponse.json({ text: text });
      }
    } catch (e) { /* try next provider */ }
  }
  return NextResponse.json({ error: "All transcription providers failed" }, { status: 500 });
}