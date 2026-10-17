import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

async function generateWithStepFun(text: string, voice: string): Promise<Buffer | null> {
  const models = ["stepaudio-3-tts", "stepaudio-2.5-tts"];
  
  for (const model of models) {
    try {
      const r = await fetch("https://api.stepfun.ai/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + (process.env.STEPFUN_API_KEY || ""),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ model, input: text, voice: voice || "default" })
      });

      if (r.ok) {
        const buf = Buffer.from(await r.arrayBuffer());
        if (buf.length > 100) return buf;
      }
    } catch (e) {}
  }
  return null;
}

async function generateWithGoogleTTS(text: string, langCode: string): Promise<Buffer | null> {
  try {
    const lang = langCode || "en";
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text)}`;
    
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });

    if (!r.ok) return null;
    const buf = Buffer.from(await r.arrayBuffer());
    return buf.length > 100 ? buf : null;
  } catch (e) {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const b: any = await req.json().catch(() => ({}));

    if (b.action === "tts") {
      const text = String(b.text || "Hello from KaraKata!");
      const voice = String(b.voice || "en-US");
      const langCode = voice.split("-")[0].toLowerCase() || "en";
      
      console.log("TTS request:", { voice, langCode, text_length: text.length });

      // Try StepFun first
      let audioBuf = await generateWithStepFun(text, voice);
      let method = "stepfun";
      
      // Fallback to Google TTS
      if (!audioBuf) {
        console.log("StepFun unavailable, trying Google TTS");
        audioBuf = await generateWithGoogleTTS(text, langCode);
        method = "google-tts";
      }

      if (!audioBuf) {
        return NextResponse.json({ ok: false, error: "All TTS methods failed" }, { status: 500 });
      }

      console.log(`Generated ${audioBuf.length} bytes using ${method}`);

      // Upload to Supabase Storage
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const storagePath = `tts-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`;
      
      try {
        console.log("Uploading to Supabase:", storagePath, audioBuf.length, "bytes");
        
        const { data: upData, error: upError } = await sb.storage
          .from("kara-store-photos")
          .upload(storagePath, audioBuf, { 
            contentType: "audio/mpeg",
            cacheControl: "3600",
            upsert: false
          });

        if (upError) {
          console.error("Storage upload error:", upError);
          return NextResponse.json({ 
            ok: false, 
            error: "Storage upload failed: " + upError.message,
            details: JSON.stringify(upError)
          }, { status: 500 });
        }

        console.log("Upload success:", upData);

        const { data: pubData } = sb.storage.from("kara-store-photos").getPublicUrl(storagePath);

        return NextResponse.json({ 
          ok: true, 
          audio_url: pubData.publicUrl,
          method: method,
          voice: voice,
          lang: langCode,
          bytes: audioBuf.length
        });
        
      } catch (storageErr: any) {
        console.error("Storage exception:", storageErr);
        return NextResponse.json({ 
          ok: false, 
          error: "Storage exception: " + String(storageErr.message || storageErr)
        }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: false, error: "unknown action" }, { status: 400 });
  } catch (e: any) {
    console.error("Route error:", e);
    return NextResponse.json({ ok: false, error: String(e.message) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, message: "TTS service ready" });
}