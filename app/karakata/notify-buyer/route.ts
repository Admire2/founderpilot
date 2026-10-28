import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ✅ Use Service Role Key to securely fetch the buyer's email from Auth
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

// ✅ Your current live domain
const LIVE_DOMAIN = "https://founderpilot-theta.vercel.app";

export async function POST(req: NextRequest) {
  try {
    const { buyer_id, shop_name, thread_id } = await req.json();

    if (!buyer_id) {
      return NextResponse.json({ ok: false, error: "Missing buyer_id" }, { status: 400 });
    }

    // 1. Find the buyer's email from Supabase Auth (Admin only access!)
    const { data: user } = await sb.auth.admin.getUserById(buyer_id);
    const buyerEmail = user?.user?.email;

    if (!buyerEmail) {
      console.warn("Buyer email not found for ID:", buyer_id);
      return NextResponse.json({ ok: false, error: "Buyer email not found" }, { status: 404 });
    }

    // 2. Send the Email (Industry Standard: No-Reply, No Message Content, No Seller Email)
    // NOTE: Replace this with your actual email provider (Resend, SendGrid, Nodemailer, etc.)
    // For now, we log it to the console so you can verify the flow immediately.
    
    console.log(`
    =========================================
    📧 EMAIL NOTIFICATION TRIGGERED
    =========================================
    To: ${buyerEmail}
    From: KaraKata <no-reply@founderpilot-theta.vercel.app>
    Subject: You have a new message from ${shop_name} on KaraKata
    
    Body:
    Hello,
    
    You have received a new message from ${shop_name} regarding your inquiry.
    
    For your privacy and security, please log in to your KaraKata account to view and reply to this message.
    
    View Message: ${LIVE_DOMAIN}/account/messages?thread=${thread_id}
    
    Thank you,
    The KaraKata Team
    =========================================
    `);

    /* 
    // UNCOMMENT THIS WHEN YOU CONNECT RESEND/SENDGRID:
    // await resend.emails.send({
    //   from: 'KaraKata <no-reply@founderpilot-theta.vercel.app>',
    //   to: buyerEmail,
    //   subject: `You have a new message from ${shop_name} on KaraKata`,
    //   html: `<p>Hello,</p><p>You have received a new message from <b>${shop_name}</b>.</p><p><a href="${LIVE_DOMAIN}/account/messages?thread=${thread_id}">Click here to view and reply securely.</a></p>`
    // });
    */

    return NextResponse.json({ ok: true, message: "Notification queued" });
  } catch (error: any) {
    console.error("Notification API Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
