import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const SYS = "You are a world-class branding agency. Every answer must be UNIQUE and deeply based on the user's exact business. Prefer short coined names that are likely to have available .com domains. Return ONLY valid JSON with keys names (array of 5 objects with name and rationale), taglines (array of 3 strings), domains (array of 3 strings).";

function fallbackReport(desc: string, keywords: string, vibe: string, industry: string) {
  const words = ((desc + " " + keywords + " " + industry).toLowerCase().match(/[a-z]{4,}/g) || ["nova", "prime", "swift", "bright", "core"]);
  const roots = Array.from(new Set(words)).slice(0, 6);
  const suffixes = ["ly", "io", "hq", "lab", "hub", "flow", "nest", "ai", "co", "app"];
  function cap(w: string) { return w.charAt(0).toUpperCase() + w.slice(1); }
  const names = [];
  for (let i = 0; i < 5; i++) {
    const root = roots[i % roots.length];
    const name = i % 2 === 0 ? cap(root) + suffixes[(i * 3 + root.length) % suffixes.length] : cap(root) + " " + cap(roots[(i + 1) % roots.length]);
    names.push({ name: name, rationale: "Blends your core word with a " + vibe.toLowerCase() + " feel for the " + (industry || "modern") + " market." });
  }
  return {
    names: names,
    taglines: ["Built for " + (industry || "what is next") + ".", vibe + " by design.", "Where " + (roots[0] || "ideas") + " meets momentum."],
    domains: [names[0].name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com", names[1].name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".ai", "get" + names[2].name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com"]
  };
}

async function ask(provider: string, key: string, promptUser: string) {
  const url = provider === "or" ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.openai.com/v1/chat/completions";
  const model = provider === "or" ? "openai/gpt-4o-mini" : "gpt-4o-mini";
  const response = await fetch(url, {
    method: "POST",
    headers: { "Authorization": "Bearer " + key, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: model,
      temperature: 1.1,
      messages: [ { role: "system", content: SYS }, { role: "user", content: promptUser } ],
      response_format: { type: "json_object" }
    })
  });
  if (!response.ok) throw new Error(provider + " error " + response.status);
  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

export async function POST(req: Request) {
  const { desc, keywords, vibe, industry, audience } = await req.json();
  const orKey = process.env.OPENROUTER_API_KEY || "";
  const oaKey = process.env.OPENAI_API_KEY || "";

  const promptUser = "Business: " + desc + ". Industry: " + (industry || "any") + ". Audience: " + (audience || "any") + ". Keywords: " + (keywords || "none") + ". Vibe: " + vibe + ".";

  // Try every sensible key/provider combination until one works
  const attempts: Array<{ p: string; k: string }> = [];
  if (orKey) attempts.push({ p: "or", k: orKey });
  if (oaKey) attempts.push({ p: "oa", k: oaKey });
  if (orKey) attempts.push({ p: "oa", k: orKey });
  if (oaKey) attempts.push({ p: "or", k: oaKey });

  for (const a of attempts) {
    try {
      return NextResponse.json(await ask(a.p, a.k, promptUser));
    } catch (e) {
      // try next combination
    }
  }

  return NextResponse.json(fallbackReport(desc, keywords, vibe, industry));
}