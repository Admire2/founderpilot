import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      seller_id, title, description, category, condition, 
      images, video_url, variants, 
      weight_lbs, domestic_shipping, international_shipping 
    } = body;

    if (!seller_id || !title) {
      return NextResponse.json({ ok: false, error: "Missing required fields" }, { status: 400 });
    }

    // Calculate base price and total stock from variants (for backward compatibility)
    const validVariants = (variants || []).filter((v: any) => v.price && v.stock);
    const basePrice = validVariants.length > 0 ? parseFloat(validVariants[0].price) : 0;
    const totalStock = validVariants.reduce((sum: number, v: any) => sum + (parseInt(v.stock) || 0), 0);

    // Save to kara_listings
    const { data: listing, error: listingError } = await supabase
      .from("kara_listings")
      .insert({
        seller_id: seller_id,
        title,
        description,
        category,
        condition,
        image_url: images && images.length > 0 ? images[0] : null, // Main thumbnail
        images: images || [], // Full gallery array
        video_url: video_url || null,
        price_usd: basePrice,
        inventory_count: totalStock,
        weight_lbs: parseFloat(weight_lbs) || 1,
        domestic_shipping: parseFloat(domestic_shipping) || 0,
        international_shipping: parseFloat(international_shipping) || 0,
        status: "active",
        metadata: { variants: validVariants } // Store variants in JSONB
      })
      .select()
      .single();

    if (listingError) {
      console.error("Listing insert error:", listingError);
      return NextResponse.json({ ok: false, error: listingError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, listing_id: listing.id });
  } catch (error: any) {
    console.error("Listings API error:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
