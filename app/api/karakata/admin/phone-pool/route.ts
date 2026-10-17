import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

// GET: See all numbers, statuses, and financials
export async function GET() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: pool } = await sb.from("kara_phone_pool").select("*, kara_tenants(name)").order("status", { ascending: true });
  const { data: financials } = await sb.from("kara_telecom_financials").select("*").single();
  
  return NextResponse.json({ ok: true, pool: pool || [], financials });
}

// POST: Assign a standby number to a new client
export async function POST(req: Request) {
  const b: any = await req.json();
  const { tenant_id, phone_number } = b;
  
  if (!tenant_id || !phone_number) return NextResponse.json({ ok: false, error: "tenant_id and phone_number required" }, { status: 400 });

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // 1. Update our database
  const { error } = await sb.from("kara_phone_pool").update({
    status: "assigned",
    tenant_id: tenant_id,
    last_assigned_at: new Date().toISOString()
  }).eq("phone_number", phone_number);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  // 2. TODO: Call Twilio/Vapi API to route the actual call traffic to this tenant's assistant
  
  return NextResponse.json({ ok: true, message: `Number ${phone_number} assigned to tenant ${tenant_id}` });
}

// DELETE (or PATCH): Unassign a number (Client churned) -> Moves to Standby
export async function PATCH(req: Request) {
  const b: any = await req.json();
  const { phone_number } = b;
  
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  await sb.from("kara_phone_pool").update({
    status: "parked",
    tenant_id: null,
    last_released_at: new Date().toISOString()
  }).eq("phone_number", phone_number);

  // TODO: Call Vapi API to unbind the assistant
  
  return NextResponse.json({ ok: true, message: `Number ${phone_number} moved to standby pool` });
}