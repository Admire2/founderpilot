import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function tryGLM(imageUrl: string): Promise<any | null> {
  const key = process.env.GLM_API_KEY;
  if (!key) return null;

  const url = process.env.GLM_URL || "https://api.z.ai/api/paas/v4/chat/completions";
  const model = process.env.GLM_MODEL || "glm-5.3-flash";

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: [
          { type: "image_url", image_url: { url: imageUrl } },
          { type: "text", text: "Extract vehicle data from this car image/papers. Return JSON: {vin, make, model, year, color, mileage, country_registered}. Use null for unseen fields." }
        ] }]
      })
    });

    if (r.status === 429 || r.status === 402) {
      console.log("GLM rate limited/quota exceeded");
      return null;
    }

    if (!r.ok) return null;

    const j: any = await r.json();
    const text = String((j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || "");
    const s = text.indexOf("{");
    const e = text.lastIndexOf("}");
    if (s < 0 || e <= s) return null;

    return { data: JSON.parse(text.slice(s, e + 1)), provider: "glm" };
  } catch (e) {
    return null;
  }
}

async function tryQwen(imageUrl: string): Promise<any | null> {
  const key = process.env.QWEN_API_KEY;
  const url = process.env.QWEN_API_URL;
  if (!key || !url) return null;

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.QWEN_MODEL || "qwen-vl-plus",
        messages: [{ role: "user", content: [
          { type: "image_url", image_url: { url: imageUrl } },
          { type: "text", text: "Extract vehicle data from this car image/papers. Return JSON: {vin, make, model, year, color, mileage, country_registered}. Use null for unseen fields." }
        ] }]
      })
    });

    if (!r.ok) return null;

    const j: any = await r.json();
    const text = String((j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || "");
    const s = text.indexOf("{");
    const e = text.lastIndexOf("}");
    if (s < 0 || e <= s) return null;

    return { data: JSON.parse(text.slice(s, e + 1)), provider: "qwen" };
  } catch (e) {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const b: any = await req.json().catch(() => ({}));
    const imageUrl = String(b.image_url || "");
    if (!imageUrl) return NextResponse.json({ ok: false, error: "image_url required" }, { status: 400 });

    // Try GLM first (multimodal specialist)
    let result = await tryGLM(imageUrl);
    
    // Fallback to Qwen if GLM unavailable
    if (!result) {
      console.log("GLM unavailable, trying Qwen fallback");
      result = await tryQwen(imageUrl);
    }

    if (!result) {
      return NextResponse.json({ 
        ok: false, 
        error: "All vision models unavailable (GLM rate-limited, Qwen failed)",
        suggestion: "GLM is rate-limited. Wait 5-10 minutes or check dashboard at z.ai/dashboard"
      }, { status: 503 });
    }

    return NextResponse.json({ 
      ok: true, 
      vehicle: result.data,
      provider: result.provider
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e.message) }, { status: 500 });
  }
}