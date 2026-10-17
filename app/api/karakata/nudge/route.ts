import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Find all leads that are pending followup and older than the tenant's nudge_hours
  const { data: tenants } = await sb.from("kara_tenants").select("*");
  if (!tenants) return NextResponse.json({ ok: true, nudges: 0 });

  let totalNudges = 0;

  for (const tenant of tenants) {
    const hours = tenant.nudge_hours || 4;
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

    // Find uncontacted qualified leads older than the cutoff
    const { data: overdueLeads } = await sb
      .from("kara_crm_records")
      .select("*, kara_crm_contacts(name, phone, contact_code)")
      .eq("tenant_id", tenant.id)
      .eq("status", "pending_followup")
      .lt("created_at", cutoff);

    if (overdueLeads && overdueLeads.length > 0) {
      for (const lead of overdueLeads) {
        // Check if we already nudged the boss about this specific lead recently
        const { data: existingNudge } = await sb.from("kara_boss_inbox")
          .select("id").eq("record_id", lead.id).eq("status", "pending").limit(1);
        
        if (!existingNudge || existingNudge.length === 0) {
          // Insert into Boss Inbox
          await sb.from("kara_boss_inbox").insert({
            tenant_id: tenant.id,
            record_id: lead.id,
            contact_code: lead.kara_crm_contacts.contact_code,
            lead_name: lead.kara_crm_contacts.name || "Unknown Caller",
            lead_phone: lead.kara_crm_contacts.phone,
            summary: lead.summary || "Qualified lead waiting for callback",
            status: "pending"
          });
          totalNudges++;
          
          // TODO: Trigger Email/SMS to tenant.nudge_email here in the future
        }
      }
    }
  }

  return NextResponse.json({ ok: true, nudges_created: totalNudges });
}