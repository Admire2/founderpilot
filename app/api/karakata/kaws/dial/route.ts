import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const SCRIPTS: Record<string, string> = {
  pre_foreclosure: "Hi {name}, this is Kara calling from Akande Joseph Realty regarding your property at {address}. I noticed a Notice of Default was recently filed, and I'm calling because you still have time to protect your credit before the foreclosure process completes. Do you have two minutes to hear your options?",
  pre_auction: "Hi {name}, this is Kara calling from Akande Joseph Realty regarding your property at {address}. I'm calling because your property appears on an upcoming sale list, and there are still options available to you before that date. Do you have two minutes to hear them?",
  off_market: "Hi {name}, this is Kara calling from Akande Joseph Realty. We work with buyers actively looking in the {address} area, and your property came up as a strong match. Would you be open to a no-obligation cash offer review?"
};

export async function POST(req: Request) {
  try {
    const b: any = await req.json().catch(() => ({}));
    const { phone, leadName, address, lane, verified, dncCleared } = b;

    if (!verified) return NextResponse.json({ ok: false, error: "REFUSED: Lead owner-match not verified." }, { status: 409 });
    if (!dncCleared) return NextResponse.json({ ok: false, error: "REFUSED: DNC scrub not confirmed." }, { status: 409 });
    if (!phone) return NextResponse.json({ ok: false, error: "Missing phone" }, { status: 400 });

    const apiKey = process.env.VAPI_API_KEY;
    const assistantId = process.env.VAPI_ASSISTANT_ID;
    const phoneNumberId = process.env.VAPI_PHONE_NUMBER_ID;
    
    if (!apiKey || !assistantId || !phoneNumberId) {
      return NextResponse.json({ ok: false, error: "Missing VAPI env vars. Check Vercel settings." }, { status: 500 });
    }

    const script = (SCRIPTS[lane] || SCRIPTS.off_market)
      .replace("{name}", leadName || "there")
      .replace("{address}", address || "your property");

    const r = await fetch("https://api.vapi.ai/call/phone", {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumberId, assistantId,
        customer: { number: phone },
        assistantOverrides: {
          variableValues: { life_event: lane, opening_script: script, first_message: script }
        }
      })
    });

    const text = await r.text();
    let j: any = {};
    try {
      j = JSON.parse(text);
    } catch {
      return NextResponse.json({ ok: false, error: "Vapi returned non-JSON: " + text.substring(0, 100) }, { status: 502 });
    }

    if (!r.ok) {
      return NextResponse.json({ ok: false, error: j?.message || "Vapi HTTP error " + r.status }, { status: 502 });
    }
    
    return NextResponse.json({ ok: true, callId: j.id, lane });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "Server crashed: " + e.message }, { status: 500 });
  }
}