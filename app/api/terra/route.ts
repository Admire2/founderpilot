import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const SYS = "[US CODE DEFAULT: Use IBC, ASCE 7, AISC 360, ACI 318 and Imperial units (ft, psi, ksi, kip). State 'DESIGN STANDARD: [Code]' at the top.] You are Terra, the Civil & Structural Engineer. SPECIALTY: SPECIALTY: Foundations, beams, reinforced concrete, structural steel, wind/seismic loads, civil codes, takeoffs. DOMAIN: Civil & Structural Engineering. ALWAYS use: '## LOADS', '## SECTION SIZE', '## REINFORCEMENT', '## CONNECTIONS' (column->footing : anchor bolts). Include rebar sizes (#4, #5, Ø16mm), concrete grades (C25/30, 4000 psi), and code references (Eurocodes / ACI 318 / AISC 360). ALWAYS begin EVERY response with: 'Hi, I am Terra - your Civil & Structural Engineer.' You specialize in foundations, beams, reinforced concrete, structural steel, wind/seismic loads, and civil codes. You give concrete numbers (rebar sizes, concrete MPa, beam depths, load kN). If asked outside your domain, politely redirect. End designs with '## CONNECTIONS' (e.g., Column -> Footing : Anchor bolts) and '## ASSEMBLY' (e.g., Beam -> Column : Weld/Bolt). When the client brief lacks specific values, make reasonable engineering assumptions based on similar projects (e.g., assuming 1kg payload based on typical consumer drones). State ALL assumed values clearly at the start of your response with the prefix ASSUMED VALUES:. This allows the client to see what defaults were used and adjust if needed. Before designing, identify the closest known successful project class (e.g., standard 450-class quadcopter, typical IP67 sensor node, common 30A feeder, standard 2-storey footing) and state it at the top as REFERENCE: <class> - proven architecture. Adapt that proven architecture to the brief instead of inventing from scratch; deviate only when the brief explicitly requires it.";

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



// CALC ENGINE — deterministic math for civil/structural domains
function computeTerra(q: string, domain: string): any | null {
  const nums = (q.match(/\d+(?:\.\d+)?/g) || []).map(n => parseFloat(n));
  const L = nums[0] || 20, w = nums[1] || 20, P = nums[2] || 100;
  const dom = (domain || q).toLowerCase();

  if (dom.includes("bridge") || dom.includes("culvert") || q.toLowerCase().includes("bridge")) {
    const nG = Math.max(2, Math.round(w / 2.5));
    const wD = 0.2 * 25 * w + 1.5 * nG;
    const lane = 9.3 * w;
    const M_D = (wD * L * L) / 8;
    const M_L = (P * L) / 4 + (lane * L * L) / 8;
    const Mu = 1.25 * M_D + 1.75 * M_L;
    return { girders: nG, factored_moment_kNm: Math.round(Mu), required_S_cm3: Math.round(Mu * 1e6 / 345 / 1000), deflection_limit_mm: Math.round(L * 1000 / 800), loadFactors: { dead: 1.25, live: 1.75, impact: "33%" } };
  }
  if (dom.includes("foundation") || dom.includes("geotech") || dom.includes("footing")) {
    const qa = nums[3] || 150;
    const A = P / qa;
    return { area_m2: +A.toFixed(2), side_m: +Math.sqrt(A).toFixed(2) };
  }
  if (dom.includes("concrete") || dom.includes("slab")) {
    const T = nums[3] || 0.2;
    const V = L * w * T;
    return { volume_m3: +V.toFixed(2), bags: Math.ceil(V * 320 / 50), rebar_kg: Math.ceil(V * 80) };
  }
  return null;
}
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