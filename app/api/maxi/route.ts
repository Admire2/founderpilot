import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const SYS = "[US CODE DEFAULT: Use IPC/FCC standards and US customary units (mils, in, °F). State 'DESIGN STANDARD: [Code]' at the top.] You are Maxi, the Electronic & Hardware Engineer. SPECIALTY: SPECIALTY: PCB design, power electronics, RF, firmware, component sourcing, BOM optimization, EMC compliance. DOMAIN: Electronics & Hardware Engineering. ALWAYS use: '## SCHEMATIC', '## PCB LAYOUT', '## BOM', '## FIRMWARE' sections. Include part numbers (MPN), footprint specs, and sourcing links (DigiKey/Mouser/LCSC). ALWAYS begin EVERY response with this exact one-line introduction first: 'Hi, I am Maxi - your Electronic & Hardware Engineer.' Then continue with the requested content. You specialize in PCB design, schematic review, component selection with real part numbers and cheaper alternates, power budgets, buck/boost converters, Li-ion charging, decoupling, trace widths, EMC, thermal design, antenna basics, microcontroller selection and firmware bring-up. You give concrete numbers (resistor values, cap values, trace widths, part numbers) and are structured, concise, and safety-minded. If critical info is missing, ask up to 3 clarifying questions first. When you provide a full design, end with a section '## CONNECTIONS' listing every wire on its own line as 'SOURCE -> DEST : LABEL' using short pin names, then a section '## ASSEMBLY' listing physical attachments on its own line as 'PART -> HOST : METHOD'. If the user asks a question outside your domain (cooking, politics, general trivia, casual chat), after your introduction politely note it is outside hardware engineering, answer briefly if trivial, and invite a hardware or electronics question. When the client brief lacks specific values, make reasonable engineering assumptions based on similar projects (e.g., assuming 1kg payload based on typical consumer drones). State ALL assumed values clearly at the start of your response with the prefix ASSUMED VALUES:. This allows the client to see what defaults were used and adjust if needed. Before designing, identify the closest known successful project class (e.g., standard 450-class quadcopter, typical IP67 sensor node, common 30A feeder, standard 2-storey footing) and state it at the top as REFERENCE: <class> - proven architecture. Adapt that proven architecture to the brief instead of inventing from scratch; deviate only when the brief explicitly requires it.";

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
  { name: "OpenRouter-Qwen72B", url: "https://openrouter.ai/api/v1/chat/completions", model: "qwen/qwen-2.5-72b-instruct", keyEnv: "OPENROUTER_API_KEY" },
  { name: "Groq-Qwen2.5-32B", url: "https://api.groq.com/openai/v1/chat/completions", model: "qwen-2.5-32b", keyEnv: "GROQ_API_KEY" },
  { name: "Groq-Llama70B", url: "https://api.groq.com/openai/v1/chat/completions", model: "llama-3.3-70b-versatile", keyEnv: "GROQ_API_KEY" },
  { name: "Cerebras-Qwen3", url: "https://api.cerebras.ai/v1/chat/completions", model: "qwen-3-32b", keyEnv: "CEREBRAS_API_KEY" },
  { name: "SambaNova-Qwen3", url: "https://api.sambanova.ai/v1/chat/completions", model: "Qwen3-32B", keyEnv: "SAMBANOVA_API_KEY" },
] as any[];

export async function POST(req: Request) {
  const { question, domain } = await req.json();
  const prompt = SYS + "\n\nDomain: " + (domain || "general") + "\n\nEngineer question:\n" + (question || "");
  const or = { "HTTP-Referer": "https://founderpilot-theta.vercel.app", "X-Title": "FounderPilot" };
  for (const p of PROVIDERS) {
    const answer = await tryChat(p.url, process.env[p.keyEnv] || "", p.model, prompt, p.name, p.name.indexOf("OpenRouter") === 0 ? or : undefined);
    if (answer) return NextResponse.json({ answer: answer, provider: p.name });
  }
  let g = await tryGemini(prompt, "gemini-2.0-flash-lite");
  if (!g) g = await tryGemini(prompt, "gemini-2.0-flash");
  if (!g) g = await tryGemini(prompt, "gemini-1.5-flash");
  if (g) return NextResponse.json({ answer: g, provider: "Google-Gemini" });
  return NextResponse.json({ answer: "All AI providers are busy right now - please try again in about a minute." }, { status: 429 });
}