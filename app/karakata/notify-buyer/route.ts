import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

    // 1. Find the buyer's email from Supabase Auth (Admin only)
    const { data: user } = await sb.auth.admin.getUserById(buyer_id);
    const buyerEmail = user?.user?.email;

    // 2. Find the seller's shop name securely
    const { data: seller } = await sb.from("sellers").select("shop_name").eq("id", seller_id).single();
    const shopName = seller?.shop_name || "KaraKata Seller";

    if (!buyerEmail) {
      console.warn("Buyer email not found for ID:", buyer_id);
      return NextResponse.json({ ok: false, error: "Buyer email not found" }, { status: 404 });
    }

    // 3. LOG THE EMAIL (Simulation Mode)
    console.log(`
    =========================================
    📧 EMAIL NOTIFICATION TRIGGERED
    =========================================
    To: ${buyerEmail}
    From: KaraKata <no-reply@founderpilot-theta.vercel.app>
    Subject: You have a new message from ${shopName} on KaraKata
    
    Body:
    Hello,
    
    You have received a new message from ${shopName} regarding your inquiry.
    
    For your privacy and security, please log in to your KaraKata account to view and reply to this message.
    
    View Message: ${LIVE_DOMAIN}/account/messages?thread=${thread_id}
    
    Thank you,
    The KaraKata Team
    =========================================
    `);

    return NextResponse.json({ ok: true, message: "Notification queued" });
  } catch (error: any) {
    console.error("Notification API Error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
