import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const b: any = await req.json().catch(() => ({}));
    const { email, shop_name, category, country, city, craft, phone, whatsapp, is_demo = false, status = 'pending' } = b;

    if (!email || !shop_name) {
      return NextResponse.json({ ok: false, error: "Email and shop_name are required" }, { status: 400 });
    }

    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // ✅ Upsert the seller profile with strict demo/status controls
    const { error } = await sb.from("sellers").upsert({
      email,
      shop_name,
      category,
      country,
      city,
      craft,
      phone,
      whatsapp,
      is_demo,      // ✅ Will be false for real applicants
      status,       // ✅ Will be 'pending' until Admin approves
      updated_at: new Date().toISOString()
    }, { onConflict: "email" }); 

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    // TODO: Trigger welcome email queue here

    return NextResponse.json({ ok: true, message: "Profile saved successfully" });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e.message) }, { status: 500 });
  }
}
