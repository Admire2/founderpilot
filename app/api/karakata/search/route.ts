import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const cat = searchParams.get("cat") || "";
    const sub = searchParams.get("sub") || "";
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const minRating = searchParams.get("minRating");
    const sortBy = searchParams.get("sortBy") || "newest";
    const limit = Number(searchParams.get("limit")) || 50; // ✅ QUOTA PROTECTION

    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    // ✅ START WITH STRICT SECURITY FILTERS
    let query = sb
      .from("kara_listings")
      .select("id, title, category, subcategory, price_usd, compare_at_usd, inventory_count, rating, sales_count, created_at, image_url, seller_id, sellers:seller_id(shop_name, status)")
      .eq("is_demo", false)               // ✅ NEVER show demo listings
      .eq("status", "active")             // ✅ ONLY show active listings
      .eq("sellers.status", "approved");  // ✅ ONLY show approved sellers

    // 1. Text Search
    if (q) {
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%`);
    }

    // 2. Category & Subcategory
    if (cat) query = query.eq("category", cat);
    if (sub) query = query.eq("subcategory", sub);

    // 3. Price Range
    if (minPrice) query = query.gte("price_usd", Number(minPrice));
    if (maxPrice) query = query.lte("price_usd", Number(maxPrice));

    // 4. Rating
    if (minRating) query = query.gte("rating", Number(minRating));

    // 5. Sorting
    if (sortBy === "price_asc") query = query.order("price_usd", { ascending: true });
    else if (sortBy === "price_desc") query = query.order("price_usd", { ascending: false });
    else if (sortBy === "best_selling") query = query.order("sales_count", { ascending: false });
    else query = query.order("created_at", { ascending: false }); // newest (default)

    const { data, error } = await query.limit(limit);

    if (error) {
      console.error("Marketplace API error:", error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, listings: data || [], count: data?.length || 0 });
  } catch (e: any) {
    console.error("Marketplace API crash:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
