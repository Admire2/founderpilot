import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function callDeepSeek(prompt: string): Promise<string> {
  const key = process.env.DEEPSEEK_API_KEY;
  if (!key) return "";
  try {
    const r = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "deepseek-chat",
        temperature: 0.3,
        messages: [{ role: "user", content: prompt }]
      }),
    });
    const j: any = await r.json();
    return String((j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || "");
  } catch (e) { return ""; }
}

async function haulCurator(sb: any): Promise<number> {
  const { data: rows } = await sb.from("kara_listings").select("id, title, category, price_usd, compare_at_usd, created_at").eq("status", "active").order("created_at", { ascending: false }).limit(50);
  const all = rows || [];
  const prompt = "You are KaraKata's Haul Curator. From these listings, pick the 5 best candidates for today's Haul deals rail. Return ONLY JSON: [{\"id\":number,\"reason\":string}]. Listings:\n" + JSON.stringify(all);
  const out = await callDeepSeek(prompt);
  const s = out.indexOf("[");
  const e = out.lastIndexOf("]");
  let picks: any[] = [];
  try { picks = s >= 0 && e > s ? JSON.parse(out.slice(s, e + 1)) : []; } catch {}
  let affected = 0;
  for (const p of picks) {
    await sb.from("kara_agent_signals").insert({ agent: "haul_curator", listing_id: p.id, signal: "haulpick: " + String(p.reason || "") });
    affected++;
  }
  return affected;
}

async function dupScanner(sb: any): Promise<number> {
  const { data: rows } = await sb.from("kara_listings").select("id, title, seller_id").eq("status", "active").order("id", { ascending: false }).limit(100);
  const all = rows || [];
  const titles = all.map((r: any) => `${r.id}|${r.title}`).join("\n");
  const prompt = "You are KaraKata's fraud scanner. Find duplicate or near-duplicate listings (same product listed twice). Return ONLY JSON: [{\"ids\":[n,n],\"reason\":string}]. Listings:\n" + titles;
  const out = await callDeepSeek(prompt);
  const s = out.indexOf("[");
  const e = out.lastIndexOf("]");
  let hits: any[] = [];
  try { hits = s >= 0 && e > s ? JSON.parse(out.slice(s, e + 1)) : []; } catch {}
  let affected = 0;
  for (const h of hits) {
    for (const id of (h.ids || [])) {
      await sb.from("kara_agent_signals").insert({ agent: "dup_scanner", listing_id: id, signal: "duplicate: " + String(h.reason || "") });
      affected++;
    }
  }
  return affected;
}

export async function POST() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const haul = await haulCurator(sb);
  const dups = await dupScanner(sb);
  await sb.from("kara_agent_runs").insert({ agent: "combined", summary: { haul_picks: haul, dup_flags: dups }, items_affected: haul + dups });
  return NextResponse.json({ ok: true, haul, dups });
}
export async function GET() { return POST(); }