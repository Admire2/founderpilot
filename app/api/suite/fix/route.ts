import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

async function askText(sys: string, user: string): Promise<string> {
  const k = {
    qw: process.env.QWEN_API_KEY || "",
    hf: process.env.HUGGINGFACE_API_KEY || "",
    gem: process.env.GEMINI_API_KEY || "",
  };
  
  if (k.qw) {
    try {
      const r = await fetch("https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": "Bearer " + k.qw, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "qwen-plus", messages: [{ role: "system", content: sys }, { role: "user", content: user }] })
      });
      if (r.ok) { const j = await r.json(); if (j.choices && j.choices[0] && j.choices[0].message) return j.choices[0].message.content; }
    } catch (e) {}
  }
  
  if (k.hf) {
    try {
      const r = await fetch("https://router.huggingface.co/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": "Bearer " + k.hf, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "meta-llama/Llama-3.3-70B-Instruct", messages: [{ role: "system", content: sys }, { role: "user", content: user }] })
      });
      if (r.ok) { const j = await r.json(); if (j.choices && j.choices[0] && j.choices[0].message) return j.choices[0].message.content; }
    } catch (e) {}
  }

  if (k.gem) {
    try {
      const r = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: { "Authorization": "Bearer " + k.gem, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gemini-1.5-flash", messages: [{ role: "system", content: sys }, { role: "user", content: user }] })
      });
      if (r.ok) { const j = await r.json(); if (j.choices && j.choices[0] && j.choices[0].message) return j.choices[0].message.content; }
    } catch (e) {}
  }

  throw new Error("all engines failed");
}

export async function POST(req: Request) {
  const { text } = await req.json();
  try {
    const fixed = await askText("You are a professional proofreader. Fix all spelling, grammar, and punctuation errors. Improve clarity slightly but keep the original meaning and tone. Return ONLY the corrected text with no explanations.", text);
    return NextResponse.json({ fixed: fixed });
  } catch (e) {
    return NextResponse.json({ error: "All engines busy" }, { status: 500 });
  }
}