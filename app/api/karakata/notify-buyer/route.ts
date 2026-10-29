import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

const LIVE_DOMAIN = "https://founderpilot-theta.vercel.app";

export async function POST(req: NextRequest) {
  try {
    const { buyer_id, seller_id, thread_id } = await req.json();

    if (!buyer_id || !seller_id) {
      return NextResponse.json({ ok: false, error: "Missing IDs" }, { status: 400 });
    }

    // 1. Find the buyer's email from the messages table (fallback to Auth if needed)
    const { data: msgData } = await sb.from("kara_seller_messages").select("buyer_email").eq("buyer_id", buyer_id).limit(1).single();
    let buyerEmail = msgData?.buyer_email;

    if (!buyerEmail) {
      const { data: user } = await sb.auth.admin.getUserById(buyer_id);
      buyerEmail = user?.user?.email;
    }

    // 2. Find the seller's shop name securely
    const { data: seller } = await sb.from("sellers").select("shop_name").eq("id", seller_id).single();
    const shopName = seller?.shop_name || "KaraKata Seller";

    if (!buyerEmail) {
      console.warn("Buyer email not found for ID:", buyer_id);
      return NextResponse.json({ ok: false, error: "Buyer email not found" }, { status: 404 });
    }

    // 3. SEND THE EMAIL VIA RESEND
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: "KaraKata <onboarding@resend.dev>",
      to: [buyerEmail],
      subject: `You have a new message from ${shopName} on KaraKata`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #1e293b;">You have a new message!</h2>
          <p style="color: #475569;">Hello,</p>
          <p style="color: #475569;">You have received a new secure message from <strong>${shopName}</strong> regarding your inquiry.</p>
          <p style="color: #475569;">For your privacy and security, direct contact information is hidden. Please log in to your KaraKata account to view and reply to this message.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${LIVE_DOMAIN}/account/messages?thread=${thread_id}" style="background-color: #9333ea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">View Message Securely</a>
          </div>
          <p style="color: #94a3b8; font-size: 12px; margin-top: 30px;">Thank you,<br>The KaraKata Team</p>
        </div>
      `,
    });

    if (emailError) {
      console.error("Resend Email Error:", emailError);
      return NextResponse.json({ ok: true, message: "Message saved, but email failed", error: emailError.message });
    }

    console.log(`✅ Email successfully sent to ${buyerEmail}! Message ID: ${emailData?.id}`);
    return NextResponse.json({ ok: true, message: "Notification sent successfully" });

  } catch (error: any) {
    console.error("Notification API Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
