import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) return NextResponse.json({ ok: false, error: "missing fields" });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return NextResponse.json({ ok: false, error: "env missing" });

    const supabase = createClient(url, key);
    const etNow = new Date().toLocaleString("en-US", { timeZone: "America/New_York", hour12: false });

    const { data: existing } = await supabase.from("referrals").select("id").eq("referred_email", email).limit(1);
    if (existing && existing.length > 0) return NextResponse.json({ ok: true, already: true });

    const track = code.startsWith("KK-") ? "market" : "suite"; const { error } = await supabase.from("referrals").insert({
      affiliate_code: code,
      referred_email: email,
      status: "signed_up", track: track,
      timestamp_et: etNow
    });
    if (error) return NextResponse.json({ ok: false, error: error.message });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message });
  }
}