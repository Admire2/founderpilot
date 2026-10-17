import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const email = String(b.email || "").toLowerCase();
    if (!email || !b.title || !b.price) return NextResponse.json({ ok: false, error: "Email, title and price required" }, { status: 400 });
    if (!b.confirmed) return NextResponse.json({ ok: false, error: "You must confirm VIN and mileage accuracy" }, { status: 400 });
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const vin = String(b.vin || "").replace(/\s/g, "");
    const masked = vin.length >= 4 ? "VIN ••••••••••" + vin.slice(-4) : (vin ? "VIN on file" : "VIN not provided");
    const spec =
      "[AUTO] " + (b.year || "----") + " " + (b.make || "") + " " + (b.model || "") + " · " + (b.mileage || "?") + " mi · " + (b.condition || "Used") + " · " + masked + "\n" +
      "INSPECTION GRADE: " + (b.grade || "Self-declared") + "\n" +
      (b.history_url ? "HISTORY REPORT: " + b.history_url + "\n" : "HISTORY REPORT: not provided\n") +
      (b.inspection_url ? "PRE-PURCHASE INSPECTION: " + b.inspection_url + "\n" : "") +
      "-----\n";
    const { data, error } = await sb.from("kara_products").insert({
      email: email,
      title: String(b.title),
      category: "Vehicles & Auto Parts",
      price_usd: Number(b.price) || 0,
      description: spec + String(b.notes || ""),
      image_url: String(b.image_url || ""),
      lead_time_days: Number(b.lead_time_days || 3),
      season: "Everyday"
    }).select().single();
    if (error) return NextResponse.json({ ok: false, error: String(error.message) }, { status: 500 });
    return NextResponse.json({ ok: true, id: data.id });
  } catch (e: any) { return NextResponse.json({ ok: false, error: String((e && e.message) || e) }, { status: 500 }); }
}
