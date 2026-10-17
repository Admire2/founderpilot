import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const vapiKey = process.env.VAPI_API_KEY;
  if (!vapiKey) return NextResponse.json({ ok: false, error: "VAPI_API_KEY missing in env" }, { status: 500 });

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const r = await fetch("https://api.vapi.ai/call?limit=25", { headers: { Authorization: "Bearer " + vapiKey } });
  if (!r.ok) return NextResponse.json({ ok: false, error: "vapi list failed: " + r.status }, { status: 502 });
  const calls: any[] = await r.json();

  const ingested: any[] = [];
  for (const c of calls) {
    try {
      const callId = String(c.id || "");
      if (!callId || String(c.status || "") !== "ended") continue;
      const transcript = String(c.transcript || "");
      if (!transcript) continue;

      const { data: existing } = await sb.from("kara_calls").select("id").eq("provider_call_id", callId).limit(1);
      if (existing && existing.length > 0) continue;

      let tenantId = "karakata";
      const pnId = String(c.phoneNumberId || "");
      if (pnId) {
        const { data: poolRow } = await sb.from("kara_phone_pool").select("tenant_id").eq("vapi_phone_id", pnId).limit(1);
        if (poolRow && poolRow[0] && poolRow[0].tenant_id) tenantId = String(poolRow[0].tenant_id);
      }

      const customerNumber = String((c.customer && c.customer.number) || "");
      await sb.from("kara_calls").insert({
        direction: String(c.type || "") === "outboundPhoneCall" ? "outbound" : "inbound",
        phone_number: customerNumber,
        provider_call_id: callId,
        campaign: "live",
        status: "completed",
        transcript: transcript,
        outcome: String(c.endedReason || ""),
        context: { cost: c.cost || 0, startedAt: c.startedAt, endedAt: c.endedAt, recordingUrl: c.recordingUrl || "" },
        tenant_id: tenantId
      });

      // INLINE EXTRACTION (No self-fetch, bypasses Vercel 502s)
      const { data: tenant } = await sb.from("kara_tenants").select("*").eq("id", tenantId).single();
      const industryId = String((tenant && tenant.industry_id) || "real_estate");
      const { data: industry } = await sb.from("kara_industries").select("*").eq("id", industryId).single();
      const schema: any[] = (industry && industry.form_schema) || [];

      const prompt = "You are a CRM data-entry engine. From this phone call transcript between an AI agent and a caller, extract structured intake data.\nFields to extract (JSON keys with labels): " + JSON.stringify(schema) + "\nRules: null when unknown; numbers as plain numbers without currency symbols; also return contact {name, phone, email} if mentioned, a 2-sentence summary, and status = one of intake|qualified|followup|closed.\nReturn ONLY JSON: {\"fields\":{...},\"contact\":{...},\"summary\":\"...\",\"status\":\"...\"}\nTranscript:\n" + transcript;

      let parsed: any = null;
      const tries: any[] = [];
      if (process.env.QWEN_API_KEY && process.env.QWEN_API_URL) tries.push({ url: process.env.QWEN_API_URL, key: process.env.QWEN_API_KEY, model: process.env.QWEN_MODEL || "qwen-plus" });
      if (process.env.DEEPSEEK_API_KEY) tries.push({ url: "https://api.deepseek.com/chat/completions", key: process.env.DEEPSEEK_API_KEY, model: "deepseek-chat" });
      
      for (const t of tries) {
        try {
          const qr = await fetch(t.url, { method: "POST", headers: { Authorization: "Bearer " + t.key, "Content-Type": "application/json" }, body: JSON.stringify({ model: t.model, temperature: 0.1, messages: [{ role: "user", content: prompt }] }) });
          if (!qr.ok) continue;
          const qj: any = await qr.json();
          const text = String((qj && qj.choices && qj.choices[0] && qj.choices[0].message && qj.choices[0].message.content) || "");
          const s = text.indexOf("{"); const e = text.lastIndexOf("}");
          if (s >= 0 && e > s) { parsed = JSON.parse(text.slice(s, e + 1)); break; }
        } catch {}
      }
      if (!parsed) parsed = { fields: {}, contact: {}, summary: "Extraction failed", status: "intake" };

      const phone = String((parsed.contact && parsed.contact.phone) || customerNumber || "");
      let contact: any = null;
      if (phone) {
        const { data: existingC } = await sb.from("kara_crm_contacts").select("*").eq("tenant_id", tenantId).eq("phone", phone).limit(1);
        if (existingC && existingC[0]) contact = existingC[0];
      }
      if (!contact) {
        const { count } = await sb.from("kara_crm_contacts").select("id", { count: "exact", head: true }).eq("tenant_id", tenantId);
        const code = tenantId.slice(0, 3).toUpperCase() + "-" + String((count || 0) + 1).padStart(4, "0");
        const { data: created } = await sb.from("kara_crm_contacts").insert({ contact_code: code, tenant_id: tenantId, industry_id: industryId, name: (parsed.contact && parsed.contact.name) || null, phone: phone || null, email: (parsed.contact && parsed.contact.email) || null }).select().single();
        contact = created;
      }

      if (contact) {
        const reqFields = schema.filter((f: any) => f.required);
        const filled = reqFields.filter((f: any) => parsed.fields && parsed.fields[f.key] !== null && parsed.fields[f.key] !== undefined && parsed.fields[f.key] !== "");
        const completeness = reqFields.length ? Math.round((filled.length / reqFields.length) * 100) : 100;
        await sb.from("kara_crm_records").insert({ contact_id: contact.id, tenant_id: tenantId, industry_id: industryId, call_id: callId, form_data: parsed.fields || {}, completeness, status: parsed.status || "intake", summary: parsed.summary || "" });
        ingested.push({ call_id: callId, contact_code: contact.contact_code, completeness });
      }
    } catch {}
  }
  return NextResponse.json({ ok: true, ingested: ingested.length, details: ingested });
}