import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { sendMail } from "@/lib/mail";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error(`Webhook signature verification failed:`, err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;
    const sellerId = session.metadata?.seller_id;
    const buyerEmail = session.customer_details?.email;

    if (!orderId) {
      console.error("No order_id found in session metadata");
      return NextResponse.json({ received: true });
    }

    try {
      // 1. Update Order Status to 'paid'
      const { error: orderError } = await supabase
        .from("kara_orders")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", orderId);

      if (orderError) {
        console.error("Failed to update order status:", orderError);
      }

      // 2. Send Beautiful Order Confirmation Email via Resend/Gmail fallback
      if (buyerEmail) {
        try {
          const emailHtml = `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #333; line-height: 1.6; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #fbbf24; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
                .header h1 { color: #0f172a; margin: 0; font-size: 24px; }
                .content { background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
                .badge { display: inline-block; background-color: #d1fae5; color: #065f46; padding: 6px 12px; border-radius: 9999px; font-size: 14px; font-weight: bold; margin-bottom: 20px; }
                .details { background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #64748b; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>Order Confirmed! 🎉</h1>
                </div>
                <div class="content">
                  <p>Hello,</p>
                  <p>Thank you for your purchase on <strong>KaraKata</strong>. Your payment has been successfully processed and is now securely held in our <strong>Smart Escrow</strong> system.</p>
                  
                  <div class="badge">🛡️ Funds Protected</div>
                  
                  <p>Your funds will be held securely and only released to the seller after you confirm satisfactory delivery of your item(s). 0% risk to you.</p>
                  
                  <div class="details">
                    <p><strong>Transaction ID:</strong> ${session.id}</p>
                    <p><strong>Order Status:</strong> Paid & Held in Escrow</p>
                    <p><strong>Next Step:</strong> The seller is preparing your shipment. You will receive another email once your item ships.</p>
                  </div>

                  <p>If you have any questions, simply reply to this email or visit your KaraKata dashboard.</p>
                  
                  <p>Best regards,<br>The KaraKata Team</p>
                </div>
                <div class="footer">
                  <p>&copy; 2026 KaraKata. All rights reserved.</p>
                  <p>This is an automated message, please do not reply directly to this email.</p>
                </div>
              </div>
            </body>
            </html>
          `;
          
          await sendMail({
            to: buyerEmail,
            subject: "Order Confirmed! 🎉 - KaraKata Smart Escrow",
            html: emailHtml,
          });
          console.log(`✅ Order confirmation email sent to ${buyerEmail}`);
        } catch (emailError) {
          console.error("Failed to send order confirmation email:", emailError);
          // We don't throw here, so the webhook still returns 200 OK to Stripe
        }
      }

      console.log(`✅ Order ${orderId} marked as PAID successfully!`);
    } catch (error) {
      console.error("Webhook processing error:", error);
      return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
