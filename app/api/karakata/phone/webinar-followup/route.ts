import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const b: any = await req.json().catch(() => ({}));
    const eventName = String(b.event_name || "");
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

    // Find registrants who never clicked the email and were never called
    let q = sb.from("kara_webinar_registrants").select("*").eq("clicked", false).eq("called", false);
    if (eventName) q = q.eq("event_name", eventName);
    const { data: noClickers } = await q;

    if (!noClickers || noClickers.length === 0) {
      return NextResponse.json({ ok: true, message: "No non-clickers to call", count: 0 });
    }

    const targets = noClickers.map((r: any) => ({
      phone: r.phone,
      name: r.name,
      context: { name: r.name, event_name: r.event_name, event_date: r.event_date, reason: "registered but never clicked confirmation email" }
    }));

    // Mark them as called
    await sb.from("kara_webinar_registrants").update({ called: true }).in("id", noClickers.map((r: any) => r.id));

    // Launch the outbound campaign
    const res = await fetch(new URL("/api/karakata/phone/outbound", req.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ campaign: "webinar_followup", name: "Webinar chaser: " + (eventName || "all"), purpose: "Re-engage registrants who never clicked", targets: targets })
    });
    const j: any = await res.json().catch(() => ({}));

    return NextResponse.json({ ok: true, non_clickers_found: noClickers.length, campaign: j });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e.message) }, { status: 500 });
  }
}