import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Use service key for backend queries to bypass RLS if needed
);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const category = searchParams.get("category") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const sortBy = searchParams.get("sortBy") || "newest";
    const limit = parseInt(searchParams.get("limit") || "50");

    let supabaseQuery = sb
      .from("kara_listings")
      .select(`
        id, 
        title, 
        category, 
        subcategory, 
        price_usd, 
        compare_at_usd, 
        inventory_count, 
        rating, 
        sales_count, 
        created_at, 
        image_url, 
        seller_id, 
        status,
        is_demo,
        sellers:seller_id(shop_name, status)
      `)
      .eq("is_demo", false) // ONLY show real, non-demo listings
      .eq("status", "active") // ONLY show approved/active listings
      .order(sortBy === "newest" ? "created_at" : "sales_count", { ascending: sortBy === "newest" ? false : false })
      .limit(limit);

    // Apply filters
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
      return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    console.error("Search API crash:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
