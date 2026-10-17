import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const ip = (req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown").split(",")[0].trim();
    const deviceId = b.device_id || "unknown";
    
    let geo = { country: "Unknown", region: "Unknown", city: "Unknown" };
    if (ip && ip !== "unknown" && ip !== "127.0.0.1") {
      try {
        const geoRes = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`);
        const geoData = await geoRes.json();
        if (geoData.status === "success") {
          geo = { country: geoData.country, region: geoData.regionName, city: geoData.city };
        }
      } catch (e) { /* GeoIP failed, proceed with unknown */ }
    }

    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { error } = await supabase.from("user_sessions").insert({ 
      email: b.email || "anonymous", 
      suite: b.suite || "suite", 
      action: "session", 
      start_time_et: b.start_et, 
      end_time_et: b.end_et, 
      duration_seconds: b.duration_seconds || 0,
      ip_address: ip,
      country: geo.country,
      region: geo.region,
      city: geo.city,
      device_id: deviceId
    });
    
    if (error) return NextResponse.json({ ok: false, error: error.message });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false, error: e.message }); }
}