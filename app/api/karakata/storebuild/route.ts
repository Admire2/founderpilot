import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

async function callAI(prompt: string): Promise<string> {
  const tries: any[] = [];
  if (process.env.QWEN_API_URL && process.env.QWEN_API_KEY) tries.push({ url: process.env.QWEN_API_URL, key: process.env.QWEN_API_KEY, model: process.env.QWEN_MODEL || "qwen-plus" });
  if (process.env.GROQ_API_KEY) tries.push({ url: "https://api.groq.com/openai/v1/chat/completions", key: process.env.GROQ_API_KEY, model: "llama-3.3-70b-versatile" });
  if (process.env.OPENROUTER_API_KEY) tries.push({ url: "https://openrouter.ai/api/v1/chat/completions", key: process.env.OPENROUTER_API_KEY, model: "meta-llama/llama-3.3-70b-instruct:free" });
  if (process.env.OPENAI_API_KEY) tries.push({ url: "https://api.openai.com/v1/chat/completions", key: process.env.OPENAI_API_KEY, model: "gpt-4o-mini" });
  let lastErr = "no providers configured";
  for (const t of tries) {
    try {
      const r = await fetch(t.url, { method: "POST", headers: { Authorization: "Bearer " + t.key, "Content-Type": "application/json" }, body: JSON.stringify({ model: t.model, temperature: 0.8, messages: [{ role: "user", content: prompt }] }) });
      const j: any = await r.json();
      const text = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
      if (text) return String(text);
      lastErr = "empty response";
    } catch (e: any) { lastErr = String((e && e.message) || e); }
  }
  throw new Error("AI providers failed: " + lastErr);
}

export async function POST(req: Request) {
  const b: any = await req.json();
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  if (b.action === "generate") {
    const prompt = "You are KaraKata StoreBuilder, an AI that designs marketplace storefronts. Return ONLY valid JSON, no markdown, with exactly these keys: shop_name (string), tagline (string, max 8 words), banner_headline (string, welcoming, max 12 words), about_text (string, 2-3 sentences, warm and trustworthy), theme_color (a single hex color like #0f766e that matches the vibe), categories (array of exactly 3 strings), products (array of exactly 5 objects with keys title, description, price_usd as a number). Seller description - what they sell: " + String(b.sells || "") + ". Store vibe: " + String(b.vibe || "") + ". City: " + String(b.city || "") + ". Country: " + String(b.country || "") + ".";
    const raw = await callAI(prompt);
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end < 0) return NextResponse.json({ ok: false, error: "AI returned no JSON" }, { status: 502 });
    const draft = JSON.parse(raw.slice(start, end + 1));
    return NextResponse.json({ ok: true, draft });
  }

  if (b.action === "publish") {
    const d = b.draft || {};
    let sellerId = Number(b.seller_id || 0);
    if (!sellerId) {
      const ins: any = await sb.from("kara_sellers").insert({ shop_name: String(d.shop_name || "New Store"), email: String(b.email || "pending@karakata.com"), stripe_account: "", stripe_payouts_enabled: false, tagline: String(d.tagline || ""), about_text: String(d.about_text || ""), theme_color: String(d.theme_color || "#0f766e"), banner_headline: String(d.banner_headline || "") }).select().single();
      if (!ins.data) return NextResponse.json({ ok: false, error: String(ins.error && ins.error.message) }, { status: 500 });
      sellerId = ins.data.id;
    } else {
      await sb.from("kara_sellers").update({ shop_name: String(d.shop_name || ""), tagline: String(d.tagline || ""), about_text: String(d.about_text || ""), theme_color: String(d.theme_color || "#0f766e"), banner_headline: String(d.banner_headline || "") }).eq("id", sellerId);
    }
    const probe: any = await sb.from("kara_listings").select("*").limit(1);
    const cols = probe && probe.data && probe.data[0] ? Object.keys(probe.data[0]) : [];
    const priceCol = cols.includes("price_usd") ? "price_usd" : "price";
    for (const p of (d.products || [])) {
      const row: any = { seller_id: sellerId, title: String(p.title || ""), description: String(p.description || "") };
      row[priceCol] = Number(p.price_usd) || 0;
      if (cols.includes("status")) row.status = "active";
      const ins: any = await sb.from("kara_listings").insert(row);
      if (ins.error) { const retry: any = await sb.from("kara_listings").insert({ seller_id: sellerId, title: String(p.title || ""), description: String(p.description || ""), price: Number(p.price_usd) || 0 }); if (retry.error) continue; }
    }
    return NextResponse.json({ ok: true, seller_id: sellerId });
  }

  return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
}