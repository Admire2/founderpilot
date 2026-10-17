import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body: any = await req.json().catch(() => ({}));
    const product = String(body.product || "");
    const audience = String(body.audience || "general");
    const goal = String(body.goal || "leads"); // leads, brand, conversions
    const count = Number(body.count || 10);

    if (!product) return NextResponse.json({ ok: false, error: "product description required" }, { status: 400 });

    const prompt = `Generate ${count} variations of a real estate ad for: ${product}. Target audience: ${audience}. Goal: ${goal}. For each variation, provide: headline, body copy (50-100 words), and a conversion score (0-100) based on predicted click-through rate. Return as JSON array.`;

    // TODO: Call Qwen or DeepSeek for ad generation
    // For now, return mock variations
    const mockAds = Array.from({ length: count }, (_, i) => ({
      variation: i + 1,
      headline: `Ad Variation ${i + 1}: ${product.slice(0, 50)}`,
      body: `This is a mock ad copy for ${product}. Targeting ${audience} with goal: ${goal}.`,
      conversion_score: Math.floor(Math.random() * 40) + 60, // 60-100
      recommended: i === 0
    }));

    return NextResponse.json({ ok: true, ads: mockAds, winner: mockAds[0] });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e.message) }, { status: 500 });
  }
}