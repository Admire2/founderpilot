import { NextResponse } from "next/server";

type BusinessModelInput = {
  idea: string;
  industry?: string;
  targetCustomer?: string;
};

const SYSTEM_PROMPT = `
You are FounderPilot AI, a startup business strategist.
Your job is to turn a startup idea into a complete Business Model Canvas.
Be specific and practical. Avoid generic advice.
Always return ONLY valid JSON. No markdown. No explanations outside JSON.
`;

function buildPrompt(input: BusinessModelInput): string {
  return `
Create a Business Model Canvas for this startup idea.

Startup Idea:
${input.idea}

Industry:
${input.industry || "Not specified"}

Target Customer:
${input.targetCustomer || "Not specified"}

Return JSON with exactly these fields (each a string of 1 to 3 sentences):
{
  "summary": string,
  "customerSegments": string,
  "valueProposition": string,
  "channels": string,
  "customerRelationships": string,
  "revenueStreams": string,
  "keyResources": string,
  "keyActivities": string,
  "keyPartnerships": string,
  "costStructure": string,
  "pricingStrategy": string,
  "unfairAdvantage": string
}
Return ONLY JSON.
`;
}

function buildMockReport(input: BusinessModelInput) {
  return {
    summary: `Business model generated for: "${input.idea.slice(
      0,
      100
    )}". A freemium SaaS approach fits this idea well.`,

    customerSegments:
      "Solo founders, first-time entrepreneurs, indie hackers, and small agency owners who need fast clarity before building.",

    valueProposition:
      "Instant, structured business clarity: validation, business model, and go-to-market direction in under a minute, without hiring a consultant.",

    channels:
      "Twitter/X founder community, Indie Hackers, Product Hunt launch, SEO content around startup validation, and short-form video.",

    customerRelationships:
      "Self-serve product with onboarding emails, a weekly founder tips newsletter, and a community space for retention.",

    revenueStreams:
      "Freemium subscription: free basic report, 19 dollars per month Pro with unlimited reports, and a team plan for startup studios.",

    keyResources:
      "AI model APIs, validation frameworks and prompt systems, brand, and user feedback data for improving reports.",

    keyActivities:
      "Improving report quality, shipping new AI tools, content marketing, and onboarding optimization.",

    keyPartnerships:
      "Startup communities, accelerators, incubators, AI API providers, and founder influencers.",

    costStructure:
      "AI API usage costs, hosting, domain, marketing budget, and future contractor costs.",

    pricingStrategy:
      "Start with a free tier to build trust, then price Pro at 19 dollars per month with an annual discount and a pilot team plan.",

    unfairAdvantage:
      "A connected suite of founder tools (validation, business model, persona, pitch deck) that compounds value instead of one-off reports.",
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (typeof body?.idea !== "string" || body.idea.trim().length < 10) {
      return NextResponse.json(
        {
          error: "Please provide a startup idea with at least 10 characters.",
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
      temperature: 0.5,
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
      summary: String(parsed.summary || ""),
      customerSegments: String(parsed.customerSegments || ""),
      valueProposition: String(parsed.valueProposition || ""),
      channels: String(parsed.channels || ""),
      customerRelationships: String(parsed.customerRelationships || ""),
      revenueStreams: String(parsed.revenueStreams || ""),
      keyResources: String(parsed.keyResources || ""),
      keyActivities: String(parsed.keyActivities || ""),
      keyPartnerships: String(parsed.keyPartnerships || ""),
      costStructure: String(parsed.costStructure || ""),
      pricingStrategy: String(parsed.pricingStrategy || ""),
      unfairAdvantage: String(parsed.unfairAdvantage || ""),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Business model generation failed.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}