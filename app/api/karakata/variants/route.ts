import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { listing_id, seller_id, variants } = body;

    if (!listing_id || !seller_id || !Array.isArray(variants)) {
      return NextResponse.json({ ok: false, error: "Missing listing_id, seller_id, or variants array" }, { status: 400 });
    }

    // 1. Verify the seller owns this listing
    const { data: listing, error: listingError } = await supabase
      .from("kara_listings")
      .select("id")
      .eq("id", listing_id)
      .eq("seller_id", seller_id)
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ ok: false, error: "Unauthorized: You do not own this listing" }, { status: 403 });
    }

    // 2. Delete existing variants for this listing (to handle updates cleanly)
    await supabase.from("product_variants").delete().eq("listing_id", listing_id);

    // 3. Insert the new variants
    if (variants.length > 0) {
      const variantsToInsert = variants.map((v: any) => ({
        listing_id,
        size: v.size || null,
        color: v.color || null,
        material: v.material || null,
        price_usd: Number(v.price_usd) || 0,
        stock_quantity: Number(v.stock_quantity) || 0,
        sku: v.sku || null,
      }));

      const { error: insertError } = await supabase
        .from("product_variants")
        .insert(variantsToInsert);

      if (insertError) {
        console.error("Variant insert error:", insertError);
        return NextResponse.json({ ok: false, error: "Failed to save variants" }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, message: "Variants saved successfully" });
  } catch (error: any) {
    console.error("Variants API error:", error);
    return NextResponse.json({ ok: false, error: error.message || "Internal error" }, { status: 500 });
  }
}
