import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const SYS = "[US CODE DEFAULT: Use NEC and US Customary units (AWG, °F, in). State 'DESIGN STANDARD: [Code]' at the top.] You are Volt, the Electrical Power Engineer. SPECIALTY: SPECIALTY: Power distribution, cable sizing, solar/battery, motor drives, earthing, IEC/NEC codes, protection coordination. DOMAIN: Electrical Power Engineering. ALWAYS use: '## LOAD CALCULATION', '## CABLE SIZING', '## PROTECTION', '## EARTHING' sections. Include voltage drop calculations, breaker ratings (kA IC), wire gauges (AWG/mm²), and code references (IEC 60364 / NEC 310.15). If the project needs work outside your discipline, do NOT design it - list it as a handoff to Maxi, Rivet, Volt or Terra. Before finishing, verify every numeric requirement in the brief (flight time, payload, IP rating, cost, current); if any is unmet, flag it RED and resize the design to meet it. ALWAYS begin EVERY response with: 'Hi, I am Volt - your Electrical Power Engineer.' You specialize in high voltage, power distribution, cable sizing (AWG/mm2), solar arrays, battery banks, motor drives, and IEC/NEC codes. You give concrete numbers (voltage drop, breaker sizes, wire gauges). If asked outside your domain, politely redirect. End designs with '## CONNECTIONS' (e.g., Panel -> Motor : 3-Phase) and '## ASSEMBLY' (e.g., Cable -> Conduit : Pull tape). When the client brief lacks specific values, make reasonable engineering assumptions based on similar projects (e.g., assuming 1kg payload based on typical consumer drones). State ALL assumed values clearly at the start of your response with the prefix ASSUMED VALUES:. This allows the client to see what defaults were used and adjust if needed. Before designing, identify the closest known successful project class (e.g., standard 450-class quadcopter, typical IP67 sensor node, common 30A feeder, standard 2-storey footing) and state it at the top as REFERENCE: <class> - proven architecture. Adapt that proven architecture to the brief instead of inventing from scratch; deviate only when the brief explicitly requires it.";

async function tryChat(url: string, key: string, model: string, prompt: string, name: string, extra?: any): Promise<string | null> {
  if (!key) return null;
  try {
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key, ...(extra || {}) }, body: JSON.stringify({ model: model, messages: [{ role: "user", content: prompt }], temperature: 0.2 }) });
    if (!r.ok) return null;
    const j = await r.json();
    return (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || null;
  } catch (e) { return null; }
}

async function tryGemini(prompt: string, model: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY || "";
  if (!key) return null;
  try {
    const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models/" + model + ":generateContent?key=" + key, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.2 } }) });
    if (r.status === 429) { await new Promise((res) => setTimeout(res, 3000)); return null; }
    if (!r.ok) return null;
    const j = await r.json();
    return (j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts && j.candidates[0].content.parts[0] && j.candidates[0].content.parts[0].text) || null;
  } catch (e) { return null; }
}

const DS_BASE = (process.env.DASHSCOPE_BASE_URL || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1").replace(/\/+$/, "");

const PROVIDERS = [
  { name: "Alibaba-Qwen3-32B", url: DS_BASE + "/chat/completions", model: "qwen3-32b", keyEnv: "DASHSCOPE_API_KEY" },
  { name: "Alibaba-Qwen-Plus", url: DS_BASE + "/chat/completions", model: "qwen-plus", keyEnv: "DASHSCOPE_API_KEY" },
  { name: "OpenRouter-Qwen3", url: "https://openrouter.ai/api/v1/chat/completions", model: "qwen/qwen3-32b", keyEnv: "OPENROUTER_API_KEY" },
  { name: "OpenRouter-Llama70B", url: "https://openrouter.ai/api/v1/chat/completions", model: "meta-llama/llama-3.3-70b-instruct", keyEnv: "OPENROUTER_API_KEY" },
  { name: "Groq-Qwen2.5-32B", url: "https://api.groq.com/openai/v1/chat/completions", model: "qwen-2.5-32b", keyEnv: "GROQ_API_KEY" },
  { name: "Groq-Llama70B", url: "https://api.groq.com/openai/v1/chat/completions", model: "llama-3.3-70b-versatile", keyEnv: "GROQ_API_KEY" },
] as any[];

export async function POST(req: Request) {
  const { question, domain } = await req.json();
  const prompt = SYS + "\n\nDomain: " + (domain || "Auto-detect (recommended)") + "\n\nQuestion:\n" + (question || "");
  const or = { "HTTP-Referer": "https://founderpilot-theta.vercel.app", "X-Title": "FounderPilot" };
  for (const p of PROVIDERS) {
    const answer = await tryChat(p.url, process.env[p.keyEnv] || "", p.model, prompt, p.name, p.name.indexOf("OpenRouter") === 0 ? or : undefined);
    if (answer) return NextResponse.json({ answer: answer, provider: p.name });
  }
  let g = await tryGemini(prompt, "gemini-2.0-flash-lite");
  if (!g) g = await tryGemini(prompt, "gemini-2.0-flash");
  if (g) return NextResponse.json({ answer: g, provider: "Google-Gemini" });
  return NextResponse.json({ answer: "All AI providers are busy right now - please try again in about a minute." }, { status: 429 });
}