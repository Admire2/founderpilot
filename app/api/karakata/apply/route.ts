import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

// Initialize Resend with your Vercel Environment Variable
const resend = new Resend(process.env.RESEND_API_KEY);

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const b = await req.json();
    if (!b.shop_name || !b.email) {
      return NextResponse.json({ ok: false, error: "Shop name and email required." }, { status: 400 });
    }

    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    
    // 1. Save to Database
    const { error } = await sb.from("sellers").upsert({ 
      email: String(b.email || "").toLowerCase(), 
      shop_name: b.shop_name, 
      category: b.category, 
      country: b.country || null, 
      city: b.city || null, 
      craft: b.craft || null, 
      phone: b.phone || null, 
      whatsapp: b.whatsapp || null 
    }, { onConflict: "email" });

    if (error) {
      return NextResponse.json({ ok: false, error: String(error.message) }, { status: 500 });
    }

    // 2. SEND THE WELCOME EMAIL VIA RESEND
    if (process.env.RESEND_API_KEY) {
      await resend.emails.send({
        from: "KaraKata <onboarding@resend.dev>", // Update this to your verified Resend domain later
        to: [b.email],
        subject: `Welcome to KaraKata, ${b.shop_name}! 🚀`,
        html: `
          <h2>Welcome to KaraKata!</h2>
          <p>Hi there,</p>
          <p>Your seller profile for <strong>${b.shop_name}</strong> has been successfully saved.</p>
          <p>Kara, your onboarding agent, is ready to help you launch. Your next step is to add your first product and connect your payout method.</p>
          <p>Remember: Founding sellers get <strong>0% commission for the first 6 months</strong>.</p>
          <br/>
          <p>Cheers,<br/>The KaraKata Team</p>
        `
      });
      console.log("✅ Welcome email sent to:", b.email);
    } else {
      console.warn("⚠️ RESEND_API_KEY not found. Email not sent.");
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String((e && e.message) || e) }, { status: 500 });
  }
}
