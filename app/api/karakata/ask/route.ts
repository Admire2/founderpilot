import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ECOSYSTEM_BRAIN = `You are Kara, the expert AI concierge for the FounderPilot and KaraKata Ecosystem. 
Your knowledge base includes:
1. KaraKata Market: An escrow-protected marketplace for physical goods, digital services, and vehicles.
2. Business Suite: Daily operating system for files, documents, and growth.
3. Engineering Suite (Volt/Rivet): Advanced engineering tools and AI assistants.
4. Healthcare Suite (iLera): AI-driven health diagnostics, medical records, and wellness tracking.
5. KAWS: KaraKata AI Web Services (Ad Optimizer, Cinematic, Relight, CRM Extract).
6. Seller Center: Where sellers manage inventory, view orders, and use the AI Storefront Builder.

RULES FOR ANSWERING:
- Be warm, professional, and concise (under 150 words).
- If the user asks about a specific product or service that DOES NOT exist or is out of stock in the ecosystem, you MUST reply with this EXACT JSON format (do not add markdown, just the JSON):
{
  "type": "waitlist",
  "message": "That specific product/service isn't available in the KaraKata ecosystem just yet, but I can help you get early access! I've also queued a placeholder image to be generated for the marketplace.",
  "productName": "[Name of the product they asked for]"
}
- If it is a general question, answer it normally in plain text.
- Never invent fake products. Always guide them to existing suites if relevant.`;

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    const qUrl = process.env.QWEN_API_URL || "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
    const qKey = process.env.QWEN_API_KEY;

    if (!qKey) {
      return NextResponse.json({ error: "AI configuration missing" }, { status: 500 });
    }

    const response = await fetch(qUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${qKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.QWEN_MODEL || "qwen-plus",
        messages: [
          { role: "system", content: ECOSYSTEM_BRAIN },
          { role: "user", content: message }
        ],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const aiText = data.choices?.[0]?.message?.content || "I'm sorry, I couldn't process that right now.";

    return NextResponse.json({ response: aiText });
  } catch (error) {
    console.error("Ask API Error:", error);
    return NextResponse.json({ error: "Failed to get response" }, { status: 500 });
  }
}
