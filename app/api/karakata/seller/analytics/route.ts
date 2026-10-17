import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { seller_id } = await req.json().catch(() => ({}));
    if (!seller_id) return NextResponse.json({ ok: false, error: "seller_id required" }, { status: 400 });

    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // 1. Get seller's listings
    const { data: listings } = await sb.from("kara_listings").select("id, status").eq("seller_id", seller_id);
    const listingIds = (listings || []).map((l: any) => l.id);
    
    if (listingIds.length === 0) {
      return NextResponse.json({ ok: false, error: "Seller has no listings" }, { status: 404 });
    }

    const activeListings = (listings || []).filter((l: any) => l.status === 'active').length;
    const soldListings = (listings || []).filter((l: any) => l.status === 'sold').length;
    const turnover = activeListings > 0 ? soldListings / activeListings : 0;

    // 2. Recent 30d orders (via listing IDs)
    const { data: recentOrders } = await sb.from("kara_orders").select("total_usd, total").in("listing_id", listingIds).gte("created_at", thirtyDaysAgo.toISOString());
    const recentCount = recentOrders?.length || 0;
    const recentGMV = (recentOrders || []).reduce((s: number, o: any) => s + Number(o.total_usd || o.total || 0), 0);

    // 3. Previous 30d orders (for growth calculation)
    const { data: prevOrders } = await sb.from("kara_orders").select("total_usd, total").in("listing_id", listingIds).gte("created_at", sixtyDaysAgo.toISOString()).lt("created_at", thirtyDaysAgo.toISOString());
    const prevGMV = (prevOrders || []).reduce((s: number, o: any) => s + Number(o.total_usd || o.total || 0), 0);

    // 4. Reviews (Trust)
    const { data: reviews } = await sb.from("kara_reviews").select("rating").eq("seller_id", seller_id);
    const avgRating = reviews && reviews.length > 0 ? reviews.reduce((s: number, r: any) => s + Number(r.rating), 0) / reviews.length : 0;

    // 5. Calculate Funding Score (0-100)
    let score = 15; // Base score for having active listings
    if (recentCount >= 10) score += 20; else if (recentCount >= 5) score += 10; else if (recentCount > 0) score += 5;
    if (prevGMV > 0 && recentGMV > prevGMV) score += 20; else if (recentGMV > 0) score += 10;
    if (turnover > 0.5) score += 15; else if (turnover > 0.2) score += 10;
    if (avgRating >= 4.5) score += 15; else if (avgRating >= 4.0) score += 10;
    if (recentGMV > 1000) score += 15; else if (recentGMV > 200) score += 10;

    // 6. Determine Tier & Funding Need
    let tier = "develop";
    if (score >= 80) tier = "prime";
    else if (score >= 60) tier = "growth";
    else if (score >= 40) tier = "watch";

    // Simple funding formula: 50% of their monthly GMV to restock
    const fundingNeeded = Math.max(0, Math.round(recentGMV * 0.5));

    // 7. Upsert into analytics table
    const { data, error } = await sb.from("kara_seller_analytics").upsert({
      seller_id,
      orders_30d: recentCount,
      gmv_30d: recentGMV,
      growth_pct: prevGMV > 0 ? ((recentGMV - prevGMV) / prevGMV) * 100 : (recentGMV > 0 ? 100 : 0),
      inventory_turnover: turnover,
      trust_score: avgRating,
      funding_score: score,
      funding_needed_usd: fundingNeeded,
      funding_tier: tier,
      updated_at: new Date().toISOString()
    }, { onConflict: "seller_id" }).select().single();

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

    return NextResponse.json({ ok: true, analytics: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}