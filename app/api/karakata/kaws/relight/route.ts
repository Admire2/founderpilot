import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body: any = await req.json().catch(() => ({}));
    const imageUrl = String(body.image_url || "");
    const preset = String(body.preset || "golden_hour"); // golden_hour, twilight, sunny, overcast, winter, summer

    if (!imageUrl) return NextResponse.json({ ok: false, error: "image_url required" }, { status: 400 });

    // Prompt for Qwen-VL or similar vision model
    const prompt = `Transform this real estate photo with the following lighting and weather conditions: ${preset}. Maintain architectural accuracy. Make it look like a professional real estate listing photo. Output ONLY the transformed image URL or base64.`;

    // TODO: Call Qwen-VL or Replicate API for image transformation
    // For now, return mock response
    const mockResult = {
      ok: true,
      original_url: imageUrl,
      transformed_url: imageUrl + "?preset=" + preset, // placeholder
      preset: preset,
      message: "Relight transformation complete (mock mode - integrate Qwen-VL API)"
    };

    return NextResponse.json(mockResult);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e.message) }, { status: 500 });
  }
}