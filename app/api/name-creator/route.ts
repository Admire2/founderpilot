import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const { desc, industry, audience } = await req.json();
  const prompt = "You are a brand naming expert. Generate 10 short, brandable, memorable business names for this business: " + (desc || "") + (industry ? " Industry: " + industry : "") + (audience ? " Target audience: " + audience : "") + ". Return ONLY a comma-separated list of names. No numbering, no explanations.";
  try {
    const r = await fetch("https://text.pollinations.ai/" + encodeURIComponent(prompt));
    const text = await r.text();
    const names = text.split(/[,\n]/).map((s: string) => s.trim().replace(/^["'*\-\d.\)]+/, "").replace(/["']+$/,"")).filter((s: string) => s.length > 1 && s.length < 40).slice(0, 10);
    return NextResponse.json({ names: names });
  } catch (e) {
    return NextResponse.json({ names: [] }, { status: 502 });
  }
}