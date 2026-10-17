import { NextResponse } from "next/server";
import Stripe from "stripe";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    const sig = req.headers.get("stripe-signature") || "";
    const secret = process.env.STRIPE_REMINDER_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET || "";
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
    
    let event: any;
    try { event = stripe.webhooks.constructEvent(body, sig, secret); }
    catch (e: any) { return NextResponse.json({ error: "bad signature" }, { status: 400 }); }
    
    // Only handle upcoming invoices (7 days before charge)
    if (event.type !== "invoice.upcoming") return NextResponse.json({ ok: true, ignored: event.type });
    
    const invoice: any = event.data.object;
    const customerId = invoice.customer;
    const customer = await stripe.customers.retrieve(customerId);
    const email = (customer as any).email || "";
    
    if (!email) return NextResponse.json({ ok: true });
    
    const amount = (invoice.amount_due || 0) / 100;
    const dueDate = new Date((invoice.period_end || 0) * 1000);
    
    // Send custom Pia-branded reminder
    const user = process.env.SMTP_USER || "";
    const pass = process.env.SMTP_PASS || "";
    if (user && pass) {
      const t = nodemailer.createTransport({ host: "smtp.gmail.com", port: 587, secure: false, auth: { user, pass } });
      await t.sendMail({
        from: "FounderPilot <" + user + ">",
        to: email,
        subject: "Your FounderPilot subscription renews in 7 days",
        html: "<div style='font-family:Segoe UI,Arial;max-width:480px;margin:auto;border:1px solid #ddd;border-radius:12px;padding:24px'><h2 style='color:#0891b2'>Subscription reminder 🔔</h2><p>Your <b>FounderPilot Pro</b> subscription renews on <b>" + dueDate.toLocaleDateString() + "</b>.</p><p>Amount: <b>$" + amount.toFixed(2) + "</b></p><p>If your card on file is still valid, you don't need to do anything. If you need to update payment info or cancel, <a href='https://founderpilot-theta.vercel.app/wallet'>visit your wallet</a> and click 'Manage Subscription'.</p><p style='color:#888'>- Pia, FounderPilot</p></div>"
      });
    }
    
    return NextResponse.json({ ok: true, email: email, amount: amount, dueDate: dueDate });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
