import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PERSONA = "You are Kara, KaraKata's AI phone agent. You are on a LIVE phone call. Speak naturally, briefly (1-3 sentences per turn), warmly, and in the caller's language (English, Pidgin, Yoruba, Hausa, Igbo). Never mention being an AI model. Pursue the call objective given in context. If the caller asks for a human, promise a colleague within 24 hours and end politely.";

export async function POST(req: Request) {
  const callId = "kara-" + Date.now();
  let body: any = {};
  try { body = await req.json(); } catch (e: any) {
    console.error("[kara-bridge] body parse failed:", e.message);
    return NextResponse.json({ error: { message: "bad body" } }, { status: 400 });
  }

  // LOG: exactly what Vapi sent us
  console.log("[kara-bridge] REQUEST id=" + callId + " body=" + JSON.stringify(body).slice(0, 1500));

  const wantsStream = body.stream === true;
  const reqModel = String(body.model || "kara-qwen");  // ECHO THIS back
  const msgs = Array.isArray(body.messages) ? body.messages : [];
  if (!msgs.some((m: any) => m.role === "system")) msgs.unshift({ role: "system", content: PERSONA });

  const tries: any[] = [];
  if (process.env.QWEN_API_KEY && process.env.QWEN_API_URL) tries.push({ url: process.env.QWEN_API_URL, key: process.env.QWEN_API_KEY, model: process.env.QWEN_MODEL || "qwen-plus", name: "qwen" });
  if (process.env.DEEPSEEK_API_KEY) tries.push({ url: "https://api.deepseek.com/chat/completions", key: process.env.DEEPSEEK_API_KEY, model: "deepseek-chat", name: "deepseek" });
  if (process.env.GLM_API_KEY) tries.push({ url: process.env.GLM_URL || "https://api.z.ai/api/paas/v4/chat/completions", key: process.env.GLM_API_KEY, model: process.env.GLM_MODEL || "glm-5.3-flash", name: "glm" });

  for (const t of tries) {
    try {
      console.log("[kara-bridge] trying brain=" + t.name + " model=" + t.model);
      const r = await fetch(t.url, {
        method: "POST",
        headers: { Authorization: "Bearer " + t.key, "Content-Type": "application/json", "Accept": "text/event-stream" },
        body: JSON.stringify({ model: t.model, messages: msgs, temperature: 0.4, stream: true, max_tokens: 300 })
      });
      if (!r.ok || !r.body) { console.error("[kara-bridge] brain " + t.name + " http=" + r.status); continue; }

      const reader = r.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      const pieces: string[] = [];
      let firstChunkLogged = false;

      const pump = async (onDelta: (s: string) => void) => {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += dec.decode(value, { stream: true });
          const lines = buf.split("\n");
          buf = lines.pop() || "";
          for (const line of lines) {
            const s = line.trim();
            if (!s.startsWith("data:")) continue;
            const payload = s.slice(5).trim();
            if (payload === "[DONE]") continue;
            try {
              const j = JSON.parse(payload);
              const d = (j.choices && j.choices[0] && j.choices[0].delta && j.choices[0].delta.content) || "";
              if (d) { pieces.push(d); onDelta(d); }
            } catch {}
          }
        }
      };

      const chunk = (content: string | null, finish: string | null) => ({
        id: callId,
        object: "chat.completion.chunk",
        created: Math.floor(Date.now() / 1000),
        model: reqModel,  // ECHO the request model, not hardcoded
        choices: [{ index: 0, delta: content === null ? {} : { content: content }, finish_reason: finish }]
      });

      if (!wantsStream) {
        await pump(() => {});
        const full = pieces.join("");
        console.log("[kara-bridge] NON-STREAM reply=" + full.slice(0, 200));
        if (!full) continue;
        return NextResponse.json({ id: callId, object: "chat.completion", created: Math.floor(Date.now() / 1000), model: reqModel, choices: [{ index: 0, message: { role: "assistant", content: full }, finish_reason: "stop" }], usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 } });
      }

      const enc = new TextEncoder();
      const stream = new ReadableStream({
        async start(controller) {
          // First chunk: role=assistant (OpenAI spec)
          const first = "data: " + JSON.stringify({ id: callId, object: "chat.completion.chunk", created: Math.floor(Date.now() / 1000), model: reqModel, choices: [{ index: 0, delta: { role: "assistant", content: "" }, finish_reason: null }] }) + "\n\n";
          controller.enqueue(enc.encode(first));
          console.log("[kara-bridge] FIRST CHUNK SENT: " + first.trim());

          await pump((d) => {
            if (!firstChunkLogged) { firstChunkLogged = true; console.log("[kara-bridge] FIRST DELTA: " + d); }
            controller.enqueue(enc.encode("data: " + JSON.stringify(chunk(d, null)) + "\n\n"));
          });

          controller.enqueue(enc.encode("data: " + JSON.stringify(chunk(null, "stop")) + "\n\n"));
          controller.enqueue(enc.encode("data: [DONE]\n\n"));
          controller.close();
        }
      });

      return new Response(stream, {
        status: 200,
        headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" }
      });
    } catch (e: any) { console.error("[kara-bridge] brain " + t.name + " crashed: " + e.message); }
  }
  console.error("[kara-bridge] ALL BRAINS FAILED");
  return NextResponse.json({ error: { message: "no brain available" } }, { status: 502 });
}