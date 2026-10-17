import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// GET: List MLS connections for a tenant
export async function GET(req: Request) {
  const url = new URL(req.url);
  const tenantId = String(url.searchParams.get("tenant_id") || "karakata");
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data } = await sb.from("kara_mls_connections").select("*").eq("tenant_id", tenantId);
  return NextResponse.json({ ok: true, connections: data || [] });
}

// POST: Create a new MLS connection (agent provides credentials)
export async function POST(req: Request) {
  try {
    const b: any = await req.json().catch(() => ({}));
    const tenantId = String(b.tenant_id || "karakata");
    const mlsProvider = String(b.mls_provider || "fmls"); // fmls, gamls
    const agentLicense = String(b.agent_license || "");
    const mlsId = String(b.mls_id || "");
    const apiKey = String(b.api_key || "");
    const apiEndpoint = String(b.api_endpoint || "");

    if (!mlsProvider || !agentLicense) {
      return NextResponse.json({ ok: false, error: "mls_provider and agent_license required" }, { status: 400 });
    }

    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    const { data, error } = await sb.from("kara_mls_connections").insert({
      tenant_id: tenantId,
      mls_provider: mlsProvider,
      agent_license: agentLicense,
      mls_id: mlsId,
      api_key: apiKey,
      api_endpoint: apiEndpoint,
      status: "pending"
    }).select().single();

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, connection: data, message: "MLS connection created. Status: pending verification." });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e.message) }, { status: 500 });
  }
}