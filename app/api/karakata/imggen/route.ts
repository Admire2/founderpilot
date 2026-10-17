import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

const HOSTS = ["https://dashscope-intl.aliyuncs.com", "https://dashscope.aliyuncs.com"];
const MODELS = ["wanx2.1-t2i-turbo", "wanx-v1", "qwen-image"];

async function qwenImage(prompt: string): Promise<string | null> {
  const key = process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;
  if (!key) return null;
  for (const host of HOSTS) {
    for (const model of MODELS) {
      try {
        const r = await fetch(host + "/api/v1/services/aigc/text2image/image-synthesis", {
          method: "POST",
          headers: { Authorization: "Bearer " + key, "Content-Type": "application/json", "X-DashScope-Async": "enable" },
          body: JSON.stringify({ model, input: { prompt }, parameters: { size: "1024*1024", n: 1 } }),
        });
        const j: any = await r.json();
        const taskId = j && j.output && j.output.task_id;
        if (!taskId) continue;
        for (let i = 0; i < 25; i++) {
          await new Promise((res) => setTimeout(res, 1200));
          const st: any = await (await fetch(host + "/api/v1/tasks/" + taskId, { headers: { Authorization: "Bearer " + key } })).json();
          const status = st && st.output && st.output.task_status;
          if (status === "SUCCEEDED") {
            const url = st.output.results && st.output.results[0] && st.output.results[0].url;
            if (url) return String(url);
            break;
          }
          if (status === "FAILED") break;
        }
      } catch (e) {}
    }
  }
  return null;
}

async function storeImage(sb: any, url: string, id: number): Promise<string | null> {
  try {
    const buf = await (await fetch(url)).arrayBuffer();
    const path = "gen-" + id + "-" + Date.now() + ".jpg";
    const up = await sb.storage.from("kara-store-photos").upload(path, Buffer.from(buf), { contentType: "image/jpeg" });
    if (up.error) return null;
    return sb.storage.from("kara-store-photos").getPublicUrl(path).publicUrl;
  } catch (e) { return null; }
}

const poll = (l: any) => "https://image.pollinations.ai/prompt/" + encodeURIComponent("professional product photo of " + String(l.title || "product")) + "?width=800&height=600&seed=" + String(l.id) + "&nologo=true";

export async function GET() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: rows } = await sb.from("kara_listings").select("id, title, image_url");
  const all = rows || [];
  const pending = all.filter((l: any) => {
    const u = String(l.image_url || "");
    if (!u) return true;
    if (u.indexOf("loremflickr") >= 0) return true;
    if (u.indexOf("pollinations") >= 0 && u.indexOf("kkfb") < 0) return true;
    return false;
  });
  if (pending.length === 0) return NextResponse.json({ ok: true, generated: 0, fallback: 0, pending: 0 });
  const l = pending[0];
  const url = await qwenImage("professional product photo of " + String(l.title || "product") + ", clean studio lighting, plain white background, high detail");
  if (url) {
    const pub = await storeImage(sb, url, l.id);
    if (pub) {
      await sb.from("kara_listings").update({ image_url: pub }).eq("id", l.id);
      return NextResponse.json({ ok: true, generated: 1, fallback: 0, pending: pending.length - 1, id: l.id });
    }
  }
  await sb.from("kara_listings").update({ image_url: poll(l) + "&kkfb=1" }).eq("id", l.id);
  return NextResponse.json({ ok: true, generated: 0, fallback: 1, pending: pending.length - 1, id: l.id });
}

export async function POST(req: Request) {
  const b: any = await req.json().catch(() => ({}));
  const id = Number(b.listing_id || 0);
  const prompt = String(b.prompt || ("professional product photo of " + String(b.title || "product")));
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const url = await qwenImage(prompt);
  if (!url) return NextResponse.json({ ok: false, error: "qwen image failed - pollinations remains as fallback" }, { status: 502 });
  const pub = await storeImage(sb, url, id || Date.now());
  if (!pub) return NextResponse.json({ ok: false, error: "storage upload failed" }, { status: 500 });
  if (id) await sb.from("kara_listings").update({ image_url: pub }).eq("id", id);
  return NextResponse.json({ ok: true, image_url: pub });
}