import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Simplified, safe query to prevent 500 errors from missing columns
    let supabaseQuery = sb
      .from("kara_listings")
      .select(`
        id, 
        title, 
        category, 
        price_usd, 
        compare_at_usd, 
        inventory_count, 
        created_at, 
        image_url, 
        seller_id, 
        status,
        is_demo,
        sellers:seller_id(shop_name)
      `)
      .eq("is_demo", false)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (query) {
      supabaseQuery = supabaseQuery.ilike("title", `%${query}%`);
    }
    if (category && category !== "All") {
      supabaseQuery = supabaseQuery.eq("category", category);
    }
    if (minPrice) {
      supabaseQuery = supabaseQuery.gte("price_usd", minPrice);
    }
    if (maxPrice) {
      supabaseQuery = supabaseQuery.lte("price_usd", maxPrice);
    }

    const { data, error } = await supabaseQuery;

    if (error) {
      console.error("Supabase search error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("Search API crash:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
