import { NextResponse } from "next/server";

type LandingInput = {
  productName: string;
  description: string;
  targetCustomer?: string;
  tone?: string;
};

const SYSTEM_PROMPT = `
You are FounderPilot AI, an expert conversion copywriter.
Your job is to write high-converting landing page copy for a product.
Be specific, persuasive, and clear. Avoid hype and fluff.
Always return ONLY valid JSON. No markdown. No explanations outside JSON.
`;

function buildPrompt(input: LandingInput): string {
  return `
Write landing page copy for this product.

Product Name:
${input.productName}

What It Does:
${input.description}

Target Customer:
${input.targetCustomer || "Not specified"}

Tone:
${input.tone || "Professional"}

Return JSON with exactly these fields:
{
  "headline": string,
  "subheadline": string,
  "heroCta": string,
  "valueProposition": string,
  "benefits": string[],
  "howItWorks": string[],
  "socialProof": string,
  "faqs": string[],
  "finalCta": string,
  "seoTitle": string,
  "seoDescription": string
}

Rules:
- headline must be under 12 words and outcome-focused.
- benefits must contain 4 items.
- howItWorks must contain exactly 3 steps.
- faqs must contain 4 items in the format "Question? - Answer."
- Return ONLY JSON.
`;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

function buildMockReport(input: LandingInput) {
  const name = input.productName;
  const audience = input.targetCustomer || "your audience";

  return {
    headline: `Meet ${name} — The Smarter Way to Get It Done`,

    subheadline: `${name} helps ${audience} save time, avoid costly mistakes, and get clear results in minutes — without the usual complexity.`,

    heroCta: "Get Started Free",

    valueProposition: `Unlike generic tools, ${name} is built specifically for ${audience}, with a simple workflow that delivers clear, practical results every time.`,

    benefits: [
      "Save hours of manual work every week.",
      "Avoid expensive mistakes with clear guidance.",
      "Simple interface — no training required.",
      "Results you can act on and share immediately.",
    ],

    howItWorks: [
      "Step 1 — Tell it what you need: answer a few simple questions.",
      "Step 2 — Get your result: receive a clear, structured output in under a minute.",
      "Step 3 — Take action: use the recommendations immediately or share them with your team.",
    ],

    socialProof: `Early testers say ${name} "feels like having an expert on demand." Join the waitlist and be first in line.`,

    faqs: [
      `Is ${name} free to try? - Yes, the basic version is free. Upgrade only if you need more.`,
      "Do I need any technical skills? - No. If you can fill a form, you can use it.",
      "How is this different from ChatGPT? - It is specialized: structured, practical outputs for one specific job, every time.",
      "Can I cancel anytime? - Yes, monthly plans cancel in one click.",
    ],

    finalCta: `Ready to try ${name}? Start free today — no credit card required.`,

    seoTitle: `${name} — Fast, Practical AI Help for ${audience}`,

    seoDescription: `${name} gives ${audience} clear, actionable answers in minutes. Try it free today.`,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (
      typeof body?.productName !== "string" ||
      body.productName.trim().length < 2 ||
      typeof body?.description !== "string" ||
      body.description.trim().length < 10
    ) {
      return NextResponse.json(
        {
          error:
            "Please provide a product name and a description of at least 10 characters.",
        },
        { status: 400 }
      );
    }

    if (process.env.USE_MOCK === "true" || !process.env.QWEN_API_KEY) {
      return NextResponse.json(buildMockReport(body));
    }

    const apiUrl = process.env.QWEN_API_URL;

    if (!apiUrl) {
      return NextResponse.json(
        { error: "Missing QWEN_API_URL environment variable." },
        { status: 500 }
      );
    }

    const payload = {
      model: process.env.QWEN_MODEL || "qwen-plus",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildPrompt(body) },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    };

    const aiResponse = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.QWEN_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();

      return NextResponse.json(
        {
          error: `AI provider error: ${aiResponse.status}`,
          details: errorText,
        },
        { status: 502 }
      );
    }

    const data = await aiResponse.json();

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: "AI response was empty." },
        { status: 502 }
      );
    }

    const start = content.indexOf("{");
    const end = content.lastIndexOf("}");

    if (start === -1 || end === -1) {
      return NextResponse.json(
        { error: "No JSON found in AI response." },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(content.slice(start, end + 1));

    return NextResponse.json({
      headline: String(parsed.headline || ""),
      subheadline: String(parsed.subheadline || ""),
      heroCta: String(parsed.heroCta || ""),
      valueProposition: String(parsed.valueProposition || ""),
      benefits: toStringArray(parsed.benefits),
      howItWorks: toStringArray(parsed.howItWorks),
      socialProof: String(parsed.socialProof || ""),
      faqs: toStringArray(parsed.faqs),
      finalCta: String(parsed.finalCta || ""),
      seoTitle: String(parsed.seoTitle || ""),
      seoDescription: String(parsed.seoDescription || ""),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Landing page generation failed.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}