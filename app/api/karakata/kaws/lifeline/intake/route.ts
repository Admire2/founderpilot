import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const b: any = await req.json().catch(() => ({}));
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    const { data, error } = await sb.from("kara_lifeline_leads").insert({
      homeowner_name: b.homeowner_name,
      property_address: b.property_address,
      contact_phone: b.contact_phone,
      contact_email: b.contact_email,
      status: "intake_pending",
      chosen_option: b.chosen_option || null,
      notes: b.notes || null
    }).select().single();

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, lead: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e.message) }, { status: 500 });
  }
}