import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sessionId = body.session_id;
    const accessToken = body.access_token;
    if (!sessionId || !accessToken) return NextResponse.json({ error: "Missing information." }, { status: 400 });

    const stripeRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${sessionId}`, {
      headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
    });
    const session = await stripeRes.json();
    if (!stripeRes.ok || session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment could not be verified." }, { status: 402 });
    }

    const amount = session.amount_total;
    let plan = "";
    if (amount === 900 || amount === 9900) plan = "pro";
    else if (amount === 2900 || amount === 29900) plan = "team";
    if (!plan) return NextResponse.json({ error: "Unknown product." }, { status: 402 });

    const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: userData, error: userErr } = await admin.auth.getUser(accessToken);
    if (userErr || !userData.user) return NextResponse.json({ error: "Please log in first." }, { status: 401 });

    const paidEmail = session.customer_details?.email || session.customer_email;
    if (paidEmail && paidEmail.toLowerCase() !== (userData.user.email || "").toLowerCase()) {
      return NextResponse.json({ error: "Log in with the same email you used to pay." }, { status: 403 });
    }

    const userId = userData.user.id;
    if (plan === "team") {
      const { data: prof } = await admin.from("profiles").select("team_id, is_team_owner").eq("id", userId).single();
      if (!prof?.team_id || !prof?.is_team_owner) {
        const { data: newTeam } = await admin.from("teams").insert({ owner_id: userId, name: "My Team" }).select().single();
        if (newTeam) await admin.from("profiles").update({ team_id: newTeam.id, is_team_owner: true }).eq("id", userId);
      }
    }

    const { error: upErr } = await admin.from("profiles").update({ plan }).eq("id", userId);
    if (upErr) return NextResponse.json({ error: "Could not activate plan." }, { status: 500 });

    return NextResponse.json({ ok: true, plan });
  } catch {
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}