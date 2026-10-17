import { KAWS_AGENTS } from "@/lib/kaws-agents";
import { braveSearch } from "@/lib/brave-search";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const maxDuration = 90;

const FREE_QWEN = "qwen/qwen-2.5-72b-instruct:free";
const PAID_QWEN = "qwen/qwen-2.5-72b-instruct";
const SONAR = "perplexity/sonar";

export async function POST(req: Request) {
  const b: any = await req.json().catch(() => ({}));
  const def = KAWS_AGENTS.find(a => a.id === b.agent);
  if (!def) return NextResponse.json({ ok: false, error: "Unknown agent" }, { status: 404 });
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return NextResponse.json({ ok: false, error: "Missing OPENROUTER_API_KEY" }, { status: 500 });

  const rawInput = String(b.input || "");
  const place = String(b.place || "");
  const isUrl = /^https?:\/\//.test(rawInput.trim());

  // 1. FORCE THE QUERY: Prepend site operators for Assessor
  let searchQuery = `${rawInput} ${place}`.trim();
  if (def.id === "assessor") {
    // This forces the search engine to ONLY look at people search sites
    searchQuery = "site:truepeoplesearch.com OR site:fastpeoplesearch.com OR site:whitepages.com " + rawInput;
  }

  // 2. Fetch Evidence (Brave first, then Sonar fallback)
  let evidence = "";
  if (def.search && !isUrl) {
    evidence = await braveSearch(searchQuery, 5);
  }

  const sysMsg = { role: "system", content: def.system };
  const buildMsgs = (m: string, hasEvidence: boolean): any[] => {
    if (def.vision && isUrl) {
      return [sysMsg, { role: "user", content: [{ type: "text", text: "Analyze this property photo." }, { type: "image_url", image_url: { url: rawInput.trim() } }] }];
    }
    const base = def.fields ? JSON.stringify(b.fields || {}) : rawInput;
    const context = hasEvidence ? `\n\nSEARCH EVIDENCE (Use ONLY this evidence, never invent data):\n${evidence}` : "";
    // For Assessor, explicitly tell the model to look for people, not houses
    const assessorHint = def.id === "assessor" ? "\n\nCRITICAL: You are a skip-tracer. Extract owner name, mailing address, and phone numbers from the evidence. Ignore real estate listings." : "";
    // If no evidence (Brave failed), force the model to use the site: operators in its own search
    const forcedQuery = (def.id === "assessor" && !hasEvidence) ? searchQuery : base;
    return [sysMsg, { role: "user", content: forcedQuery + context + assessorHint }];
  };

  const call = async (m: string, msgs: any[]) => {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({ model: m, messages: msgs, temperature: 0.2 })
    });
    if (!r.ok) throw new Error("HTTP " + r.status);
    const j: any = await r.json();
    return j?.choices?.[0]?.message?.content || "";
  };

  let out: any = null;
  let usedModel = "";
  let dataSource = "PAID TIER";

  const chain = def.search ? [FREE_QWEN, PAID_QWEN, SONAR] : (def.vision && isUrl ? ["qwen/qwen2.5-vl-72b-instruct", PAID_QWEN] : [FREE_QWEN, PAID_QWEN]);

  for (const m of chain) {
    try {
      const hasEvidence = m !== SONAR && evidence.length > 0;
      const text = await call(m, buildMsgs(m, hasEvidence));
      try { 
        const mm = text.match(/\{[\s\S]*\}/); 
        out = mm ? JSON.parse(mm[0]) : { result: text }; 
      } catch { out = { result: text }; }
      usedModel = m;
      
      if (m === FREE_QWEN) dataSource = evidence ? "LIVE (Brave + Free Qwen)" : "FREE TIER";
      else if (m === SONAR) dataSource = "LIVE (Sonar Fallback)";
      else dataSource = "PAID TIER";
      
      break;
    } catch {}
  }

  if (!out) return NextResponse.json({ ok: false, error: "All models failed" }, { status: 502 });

  if (def.id === "investor" && b.fields) {
    const p = Number(b.fields.purchase_price) || 0;
    const rh = Number(b.fields.rehab_cost) || 0;
    const arv = Number(b.fields.arv) || 0;
    const rent = Number(b.fields.monthly_rent) || 0;
    const mao = arv * 0.7 - rh;
    out.metrics = { max_allowable_offer: Math.round(mao), one_percent_rule: ((rent / (p + rh)) * 100 || 0).toFixed(2) + "%", gross_yield: (((rent * 12) / (p + rh)) * 100 || 0).toFixed(2) + "%" };
  }

  return NextResponse.json({ ok: true, agent: def.id, dataSource, model: usedModel, output: out });
}