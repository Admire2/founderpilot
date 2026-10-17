import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

async function probe(name: string, fn: () => Promise<string>) {
  try { return { name: name, ok: true, detail: await fn() }; }
  catch (e: any) { return { name: name, ok: false, detail: String(e.message || e).slice(0, 200) }; }
}

async function chatProbe(url: string, key: string, model: string, headers: Record<string, string> = {}) {
  if (!key) throw new Error("key missing");
  const r = await fetch(url, { 
    method: "POST", 
    headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json", ...headers }, 
    body: JSON.stringify({ model: model, max_tokens: 50, messages: [{ role: "user", content: "Say OK" }] }) 
  });
  const t = await r.text();
  if (!r.ok) throw new Error("HTTP " + r.status + " " + t.slice(0, 150));
  return "HTTP 200 OK";
}

export async function GET() {
  const k = {
    or: process.env.OPENROUTER_API_KEY || "",
    oa: process.env.OPENAI_API_KEY || "",
    ds: process.env.DEPSEEK_API_KEY || "",
    qw: process.env.QWEN_API_KEY || "",
    hf: process.env.HUGGINGFACE_API_KEY || "",
    an: process.env.ANTHROPIC_API_KEY || "",
    xai: process.env.XAI_API_KEY || "",
    gem: process.env.GEMINI_API_KEY || "",
  };

  const results = [
    await probe("1. OpenAI (Text)", () => chatProbe("https://api.openai.com/v1/chat/completions", k.oa, "gpt-4o-mini")),
    await probe("2. OpenRouter (Text)", () => chatProbe("https://openrouter.ai/api/v1/chat/completions", k.or, "openai/gpt-4o-mini")),
    await probe("3. DeepSeek (Text)", () => chatProbe("https://api.deepseek.com/v1/chat/completions", k.ds, "deepseek-chat")),
    await probe("4. Qwen (Text)", () => chatProbe("https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions", k.qw, "qwen-plus")),
    await probe("5. Grok (Text)", () => chatProbe("https://api.x.ai/v1/chat/completions", k.xai, "grok-3-mini")),
    await probe("6. HuggingFace (Text)", () => chatProbe("https://router.huggingface.co/v1/chat/completions", k.hf, "meta-llama/Llama-3.3-70B-Instruct")),
    await probe("7. Gemini (Text)", () => chatProbe("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", k.gem, "gemini-1.5-flash")),
    await probe("8. Anthropic (Text)", async () => {
      if (!k.an) throw new Error("key missing");
      const r = await fetch("https://api.anthropic.com/v1/messages", { 
        method: "POST", 
        headers: { "x-api-key": k.an, "anthropic-version": "2023-06-01", "Content-Type": "application/json" }, 
        body: JSON.stringify({ model: "claude-3-haiku-20240307", max_tokens: 50, messages: [{ role: "user", content: "Say OK" }] }) 
      });
      if (!r.ok) throw new Error("HTTP " + r.status + " " + (await r.text()).slice(0, 100));
      return "HTTP 200 OK";
    }),
    await probe("9. Gemini (Audio/TTS)", async () => {
      if (!k.gem) throw new Error("key missing");
      const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" + k.gem, { 
        method: "POST", 
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ contents: [{ parts: [{ text: "Hi" }] }] }) 
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      return "TEXT/AUDIO OK";
    })
  ];

  return NextResponse.json({ engines_tested: 9, results: results });
}