import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const b: any = await req.json().catch(() => ({}));
    const photos: string[] = b.photos || [];
    const vibe = String(b.vibe || "luxury_modern"); // luxury_modern, cozy_family, urban_loft

    if (photos.length < 3) return NextResponse.json({ ok: false, error: "Need at least 3 photos" }, { status: 400 });

    const prompt = `You are a high-end real estate videographer. I am giving you ${photos.length} listing photos for a property.
Create a 30-second cinematic video storyboard. Vibe: ${vibe}.
Output ONLY JSON in this exact format:
{
  "title": "Video Title",
  "music_vibe": "Description of background music",
  "scenes": [
    { "scene_number": 1, "photo_index": 0, "duration_sec": 4, "camera_movement": "Slow pan right", "text_overlay": "Welcome to..." },
    { "scene_number": 2, "photo_index": 1, "duration_sec": 3, "camera_movement": "Zoom in slowly", "text_overlay": "" }
  ]
}`;

    // TODO: Call Qwen/DeepSeek for storyboard generation
    // For now, return a high-quality mock storyboard
    const storyboard = {
      ok: true,
      title: "Cinematic Property Tour",
      music_vibe: "Upbeat, modern lo-fi house track with a driving bassline",
      scenes: photos.map((url, i) => ({
        scene_number: i + 1,
        photo_index: i,
        photo_url: url,
        duration_sec: i === 0 || i === photos.length - 1 ? 5 : 3,
        camera_movement: i % 2 === 0 ? "Slow pan right with slight zoom" : "Ken Burns effect zoom in",
        text_overlay: i === 0 ? "New Listing" : (i === photos.length - 1 ? "Schedule a Tour" : "")
      }))
    };

    return NextResponse.json(storyboard);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e.message) }, { status: 500 });
  }
}