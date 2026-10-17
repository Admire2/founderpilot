import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const b: any = await req.json().catch(() => ({}));
    const tenantId = String(b.tenant_id || "karakata");
    const callId = String(b.call_id || "");
    const transcript = String(b.transcript || "");
    if (!transcript) return NextResponse.json({ ok: false, error: "transcript required" }, { status: 400 });

    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    let tenant: any = null;
    try {
      const res = await sb.from("kara_tenants").select("*").eq("id", tenantId).single();
      tenant = res.data;
    } catch {}

    const industryId = String(b.industry_id || (tenant && tenant.industry_id) || "real_estate");
    
    let industry: any = null;
    try {
      const res = await sb.from("kara_industries").select("*").eq("id", industryId).single();
      industry = res.data;
    } catch {}

    const schema: any[] = (industry && industry.form_schema) || [];

    const prompt = "You are a CRM data-entry engine. From this phone call transcript between an AI agent and a caller, extract structured intake data.\nFields to extract (JSON keys with labels): " + JSON.stringify(schema) + "\nRules: null when unknown; numbers as plain numbers without currency symbols; also return contact {name, phone, email} if mentioned, a 2-sentence summary, and status = one of intake|qualified|followup|closed.\nReturn ONLY JSON: {\"fields\":{...},\"contact\":{...},\"summary\":\"...\",\"status\":\"...\"}\nTranscript:\n" + transcript;

    let parsed: any = null;
    const tries: any[] = [];
    if (process.env.QWEN_API_KEY && process.env.QWEN_API_URL) tries.push({ url: process.env.QWEN_API_URL, key: process.env.QWEN_API_KEY, model: process.env.QWEN_MODEL || "qwen-plus" });
    if (process.env.DEEPSEEK_API_KEY) tries.push({ url: "https://api.deepseek.com/chat/completions", key: process.env.DEEPSEEK_API_KEY, model: "deepseek-chat" });
    
    for (const t of tries) {
      try {
        const r = await fetch(t.url, { method: "POST", headers: { Authorization: "Bearer " + t.key, "Content-Type": "application/json" }, body: JSON.stringify({ model: t.model, temperature: 0.1, messages: [{ role: "user", content: prompt }] }) });
        if (!r.ok) continue;
        const j: any = await r.json();
        const text = String((j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || "");
        const s = text.indexOf("{"); const e = text.lastIndexOf("}");
        if (s >= 0 && e > s) { parsed = JSON.parse(text.slice(s, e + 1)); break; }
      } catch {}
    }
    if (!parsed) return NextResponse.json({ ok: false, error: "extraction failed" }, { status: 502 });

    const phone = String((parsed.contact && parsed.contact.phone) || b.caller_phone || "");
    let contact: any = null;
    if (phone) {
      const { data: existing } = await sb.from("kara_crm_contacts").select("*").eq("tenant_id", tenantId).eq("phone", phone).limit(1);
      if (existing && existing[0]) contact = existing[0];
    }
    if (!contact) {
      const { count } = await sb.from("kara_crm_contacts").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId);
      const code = tenantId.slice(0, 3).toUpperCase() + "-" + String((count || 0) + 1).padStart(4, "0");
      const { data: created, error: createError } = await sb.from("kara_crm_contacts").insert({ contact_code: code, tenant_id: tenantId, industry_id: industryId, name: (parsed.contact && parsed.contact.name) || null, phone: phone || null, email: (parsed.contact && parsed.contact.email) || null }).select().single();
      if (createError) return NextResponse.json({ ok: false, error: createError.message }, { status: 500 });
      contact = created;
    }
    if (!contact) return NextResponse.json({ ok: false, error: "contact creation failed" }, { status: 500 });

    const reqFields = schema.filter((f: any) => f.required);
    const filled = reqFields.filter((f: any) => parsed.fields && parsed.fields[f.key] !== null && parsed.fields[f.key] !== undefined && parsed.fields[f.key] !== "");
    const completeness = reqFields.length ? Math.round((filled.length / reqFields.length) * 100) : 100;

    const { data: record, error } = await sb.from("kara_crm_records").insert({ contact_id: contact.id, tenant_id: tenantId, industry_id: industryId, call_id: callId || null, form_data: parsed.fields || {}, completeness, status: parsed.status || "intake", summary: parsed.summary || "" }).select().single();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, contact_code: contact.contact_code, contact_id: contact.id, completeness, record });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e.message) }, { status: 500 });
  }
}