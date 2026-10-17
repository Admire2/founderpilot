import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  const k = process.env.STRIPE_SECRET_KEY || "";
  const w = process.env.STRIPE_WEBHOOK_SECRET || "";
  return NextResponse.json({ hasSecretKey: k.length > 0, secretPrefix: k.slice(0, 8), hasWebhookSecret: w.length > 0, webhookPrefix: w.slice(0, 7) });
}