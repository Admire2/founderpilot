import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const b: any = await req.json().catch(() => ({}));
    const companyName = String(b.company_name || "").trim();
    const industryId = String(b.industry_id || "real_estate");
    const ownerEmail = String(b.email || "").trim();

    if (!companyName || !ownerEmail) return NextResponse.json({ ok: false, error: "company_name and email required" }, { status: 400 });

    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // 1. Create a unique tenant ID (e.g., smith-realty)
    const tenantId = companyName.toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 20);

    // 2. Insert into Tenants table
    const licenseType = String(b.license_type || "investor");
    const licenseNumber = String(b.license_number || "");
    const licenseState = String(b.license_state || "GA");

    const { error: tErr } = await sb.from("kara_tenants").insert({
      id: tenantId,
      name: companyName,
      industry_id: industryId,
      monthly_fee: 149.00,
      license_type: licenseType,
      license_number: licenseNumber,
      license_state: licenseState
    });
    if (tErr) return NextResponse.json({ ok: false, error: "tenant exists or db error: " + tErr.message }, { status: 500 });

    // 3. TODO: Trigger Vapi API to create their custom Assistant
    // 4. TODO: Trigger Twilio API to buy them a number
    // 5. TODO: Trigger Stripe to start their $149/mo subscription

    return NextResponse.json({ 
      ok: true, 
      message: "Tenant provisioned successfully!", 
      tenant_id: tenantId,
      next_steps: "Assign a phone number from the Admin Pool to this tenant to activate them."
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e.message) }, { status: 500 });
  }
}