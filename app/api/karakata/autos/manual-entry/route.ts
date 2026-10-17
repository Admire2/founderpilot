import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const b: any = await req.json();
    
    const year = b.year;
    const make = String(b.make || "");
    const model = String(b.model || "");
    const vin = String(b.vin || "");
    const price = Number(b.price_usd) || 0;
    const condition = String(b.condition || "fairly_used");
    const sellerId = Number(b.seller_id) || 1;
    
    if (!year || !make || !model || !vin) {
      return NextResponse.json({ 
        ok: false, 
        error: "year, make, model, vin are required",
        received: { year, make, model, vin, price, condition }
      }, { status: 400 });
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Generate title-matched image
    const title = `${year} ${make} ${model}`;
    const imagePrompt = encodeURIComponent(`professional car photo of ${year} ${make} ${model}, clean studio lighting`);
    const imageUrl = `https://image.pollinations.ai/prompt/${imagePrompt}?width=800&height=600&seed=${vin.replace(/\W/g, '')}&nologo=true`;

    const compareAt = Math.round(price * 1.15);
    const subcategory = condition === "new" ? "Cars for sale - New" : "Cars for sale - Fairly used";
    const description = `VIN: ${vin}. Well-maintained, clean title, ready for immediate sale.`;

    console.log("Inserting listing:", { title, price, compareAt, subcategory });

    const { data, error } = await sb.from("kara_listings").insert({
      title: title,
      description: description,
      category: "Automotive",
      subcategory: subcategory,
      status: "active",
      price_usd: price,
      compare_at_usd: compareAt,
      image_url: imageUrl,
      seller_id: sellerId
    }).select().single();

    if (error) {
      console.error("Insert error:", error);
      return NextResponse.json({ 
        ok: false, 
        error: "Database insert failed: " + error.message,
        details: error
      }, { status: 500 });
    }

    console.log("Success:", data);

    return NextResponse.json({
      ok: true,
      listing: data,
      message: `Car listing created: ${title}`,
      market_url: "https://founderpilot-theta.vercel.app/karakata"
    });

  } catch (e: any) {
    console.error("Route error:", e);
    return NextResponse.json({ 
      ok: false, 
      error: String(e.message),
      stack: e.stack
    }, { status: 500 });
  }
}