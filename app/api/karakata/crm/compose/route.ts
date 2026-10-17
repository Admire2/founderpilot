import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenantId = String(url.searchParams.get("tenant_id") || "karakata");
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data: tenant } = await sb.from("kara_tenants").select("*").eq("id", tenantId).single();
  const industryId = String((tenant && tenant.industry_id) || "real_estate");
  
  const { data: industry } = await sb.from("kara_industries").select("*").eq("id", industryId).single();
  
  const company = (tenant && tenant.name) || "KaraKata";
  const fields: any[] = ((industry && industry.form_schema) || []);
  const prompt = [
    "You are the AI " + ((industry && industry.name) || "sales") + " representative for " + company + ". " + ((industry && industry.persona_prompt) || ""),
    "During every call you MUST collect these intake fields by asking natural questions, one at a time: " + fields.map((f: any) => f.key).join(", ") + ".",
    "Close every call with: summarize what you learned, state the next step, ask 'Before I let you go, do you have any further questions?', and if no: 'Wonderful. I have to go now, speak with you later. If you feel you need to call me back for any reason, do not hesitate. Bye for now.' then end the call.",
    "Never invent details. If unknown, skip it politely."
  ].join("\n");
  return NextResponse.json({ ok: true, tenant_id: tenantId, industry_id: industryId, prompt });
}