import { NextResponse } from "next/server";
import OpenAI from "openai";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const PROVIDERS = [
  { name: "dashscope", key: process.env.DASHSCOPE_API_KEY, url: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1" },
  { name: "openrouter", key: process.env.OPENROUTER_API_KEY, url: "https://openrouter.ai/api/v1" },
  { name: "openai", key: process.env.OPENAI_API_KEY, url: "https://api.openai.com/v1" }
];

const VISION_MODELS: Record<string, string[]> = {
  openrouter: ["openai/gpt-4o-mini", "anthropic/claude-3.5-sonnet", "google/gemini-pro-vision"],
  dashscope: ["qwen-vl-max", "qwen-vl-plus"],
  openai: ["gpt-4o-mini", "gpt-4o"]
};

const SYS = `You are a senior product teardown engineer. Given a product photo and optional name/description, output EXACTLY this format:

## PARTS LIST
1. [Part name] - [material/process] - $[per-unit cost at 1,000 units/yr] - [owner: MAXI|RIVET|VOLT|TERRA]
2. ...
EST. BOM @1k: $[sum of the per-unit costs above; this is ONE unit total - do NOT multiply by 1000]
TEAM SPLIT: MAXI x% / RIVET y% / VOLT z% / TERRA w%

Owner definitions (use strictly):
- MAXI = electronics & hardware: PCB, MCU, controllers, sensors, displays, wiring harness, firmware
- RIVET = mechanical: housings, sheet metal, castings, valves, burners, heat exchangers, fasteners, gaskets, insulation, brackets
- Gas burners, gas trains and combustion hardware = RIVET; only their ignition transformers and blower motors = VOLT/MAXI.
- VOLT = electrical power: heating elements, motors, batteries, PSU, power distribution, high-current wiring, fuses
- TERRA = civil/structural ONLY: building mounting, foundations, seismic restraints, site concrete/piping. For a standalone product TERRA is usually 0-10%.

Recognition rules:
- If a brand/model is visible or given (e.g., Burnham SteamMax), state it and use that product class as the reference.
- ALWAYS include the hidden core functional part even if not visible: pressure vessel/heat exchanger for boilers, motor for power tools, compressor for fridges, PCB+motor for drones.
- TEAM SPLIT = share of engineering effort, not share of cost.

Cost rules:
- Every $ figure is a PER-UNIT manufacturing/purchase cost at 1,000 units per year (not retail).
- EST. BOM @1k = the sum of those per-unit figures (one unit total). Never multiply by 1000.
- Sanity check: a product BOM is typically 25-35% of retail price; adjust if your numbers violate this.
- Percentages must sum to 100.
- Before writing EST. BOM @1k, re-add all per-unit figures; the total MUST equal that sum.
- If a store price is provided, per-unit costs must total 25-35% of it; adjust and state the volume assumption.
- If the photo is unclear, say "Cannot identify parts clearly" and list only what you can see.`;

export async function POST(req: Request) {
  try {
    const { image, productName, description, storePrice } = await req.json();
    if (!image) return NextResponse.json({ error: "no image" }, { status: 400 });

    const userPrompt = `Product: ${productName || "Unknown"}
Description: ${description || "No description provided"}

Store price seen by client: ${storePrice ? "$" + storePrice : "not provided"}. If a store price is provided, scale per-unit costs so the total BOM lands at 25-35% of it and state the production volume assumption. Analyze this product photo and provide the parts list in the exact format.`;

    for (const provider of PROVIDERS) {
      if (!provider.key) continue;
      const models = VISION_MODELS[provider.name] || [];
      for (const model of models) {
        try {
          const client = new OpenAI({ apiKey: provider.key, baseURL: provider.url });
          const completion = await client.chat.completions.create({
            model,
            messages: [
              { role: "system", content: SYS },
              { role: "user", content: [
                { type: "text", text: userPrompt },
                { type: "image_url", image_url: { url: image } }
              ]}
            ],
            max_tokens: 1500
          });
          const text = completion.choices[0]?.message?.content || "";
          if (text.includes("## PARTS LIST")) {
            return NextResponse.json({ ok: true, text, provider: provider.name, model });
          }
        } catch (e: any) {
          console.error(`${provider.name}/${model}:`, e.message);
          continue;
        }
      }
    }
    return NextResponse.json({ error: "all providers failed" }, { status: 500 });
  } catch (e: any) {
    return NextResponse.json({ error: "crash", detail: String((e && e.message) || e) }, { status: 500 });
  }
}