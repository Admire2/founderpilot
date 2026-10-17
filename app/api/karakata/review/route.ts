import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const orderId = url.searchParams.get("order");
  const stars = Number(url.searchParams.get("stars"));

  if (!orderId || !stars || stars < 1 || stars > 5) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  const { data: order } = await sb.from("kara_orders").select("seller_id").eq("id", orderId).single();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  // Save the review (upsert prevents duplicates)
  await sb.from("kara_reviews").upsert({
    order_id: Number(orderId),
    seller_id: order.seller_id,
    stars: stars
  }, { onConflict: 'order_id' });

  // Recalculate seller average
  const { data: reviews } = await sb.from("kara_reviews").select("stars").eq("seller_id", order.seller_id);
  const all = reviews || [];
  const avg = all.length > 0 ? all.reduce((sum: number, r: any) => sum + r.stars, 0) / all.length : 0;
  
  await sb.from("kara_sellers").update({ 
    avg_rating: avg.toFixed(2), 
    review_count: all.length 
  }).eq("id", order.seller_id);

  return NextResponse.json({ ok: true, stars: stars, message: "Rating saved" });
}