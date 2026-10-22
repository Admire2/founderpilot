import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    
    if (!query) {
      return NextResponse.json({ ok: false, error: "Query parameter 'q' is required" }, { status: 400 });
    }

    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    // Search in listings
    const { data: listings, error } = await sb
      .from("kara_listings")
      .select("*, sellers:seller_id(shop_name, category, city, country)")
      .ilike(`title`, `%${query}%`)
      .or(`description.ilike.%${query}%,category.ilike.%${query}%`)
      .limit(20);

    if (error) {
      console.error("Search error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, listings: listings || [], count: listings?.length || 0 });
  } catch (e: any) {
    console.error("Search API error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
