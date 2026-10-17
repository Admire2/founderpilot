import { NextResponse } from "next/server";

type IdeaInput = {
  idea: string;
  industry?: string;
  targetCustomer?: string;
  market?: string;
  businessModel?: string;
  budget?: string;
  experienceLevel?: string;
};

const SYSTEM_PROMPT = `
You are FounderPilot AI, a practical startup validation analyst.

Your job is to evaluate startup ideas honestly and produce a structured validation report.

Rules:
- Be practical, specific, and honest.
- Avoid generic startup advice.
- If the idea is weak, say why and how it can be improved.
- If the idea is strong, explain the clearest path to validation.
- Always return ONLY valid JSON.
- Do not include markdown.
- Do not include explanations outside JSON.
`;

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  return value.map((item) => String(item));
}

function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");

  if (start === -1 || end === -1) {
    throw new Error("No JSON found in AI response.");
  }

  return text.slice(start, end + 1);
}

function normalizeReport(raw: any) {
  return {
    ideaScore:
      typeof raw.ideaScore === "number"
        ? raw.ideaScore
        : Number(raw.ideaScore) || 50,

    summary: String(raw.summary || ""),

    strengths: toStringArray(raw.strengths),
    weaknesses: toStringArray(raw.weaknesses),
    opportunities: toStringArray(raw.opportunities),
    threats: toStringArray(raw.threats),

    marketDemand: String(raw.marketDemand || ""),
    competition: String(raw.competition || ""),
    targetCustomerInsights: String(raw.targetCustomerInsights || ""),

    monetizationSuggestions: toStringArray(raw.monetizationSuggestions),
    validationSteps: toStringArray(raw.validationSteps),

    mvpRecommendation: String(raw.mvpRecommendation || ""),
    finalVerdict: String(raw.finalVerdict || ""),
  };
}

function buildMockReport(input: IdeaInput) {
  return {
    ideaScore: 74,
    summary: `API mock validation completed for: "${input.idea.slice(
      0,
      100
    )}". This idea shows potential, but the target customer and monetization model need sharper definition before building a full product.`,

    strengths: [
      "Clear problem-solving angle.",
      "Can be tested with a lightweight MVP.",
      "Potential demand from founders or small businesses.",
      "Can be expanded into a broader AI tool suite.",
    ],

    weaknesses: [
      "Target niche may be too broad.",
      "Differentiation is not fully clear yet.",
      "Willingness to pay must be validated.",
      "Distribution strategy needs planning.",
    ],

    opportunities: [
      "Build a focused landing page to capture demand.",
      "Create a paid pilot offer for early users.",
      "Bundle with other founder tools later.",
      "Use content marketing around startup validation.",
    ],

    threats: [
      "Existing AI startup tools may already serve this need.",
      "Users may expect free AI tools.",
      "Retention may be low if the tool gives only one-time value.",
      "AI output quality must be consistently useful.",
    ],

    marketDemand:
      "Demand appears plausible because entrepreneurs constantly seek faster ways to test ideas, reduce risk, and create go-to-market plans. However, demand should be validated through landing page signups, interviews, or pre-sales.",

    competition:
      "Competition includes AI startup idea generators, business plan tools, startup consultants, and general AI assistants. The best angle is to specialize in practical validation with clear next steps.",

    targetCustomerInsights:
      "The most likely early users are solo founders, first-time entrepreneurs, indie hackers, consultants, and small business owners who need fast clarity before spending time or money on product development.",

    monetizationSuggestions: [
      "Free basic validation with paid detailed report.",
      "Monthly subscription for unlimited idea testing.",
      "One-time payment for premium validation report.",
      "Team plan for startup studios and accelerators.",
      "Bundle with pitch deck and business model tools.",
    ],

    validationSteps: [
      "Create a landing page explaining the tool.",
      "Run ads or posts targeting entrepreneurs.",
      "Collect emails from interested users.",
      "Interview 10 founders about their idea validation process.",
      "Offer a manual paid validation service before building automation.",
      "Test willingness to pay with a simple pricing page.",
      "Build a waitlist and measure conversion rate.",
      "Launch a minimal version to 20 early users.",
      "Collect feedback and refine the report structure.",
    ],

    mvpRecommendation:
      "Build a simple web app where the user enters an idea and receives a structured validation report. Avoid adding accounts, payments, or advanced dashboards until the core report proves valuable.",

    finalVerdict:
      "Promising idea, but success depends on niche focus, report quality, and clear user willingness to pay. Validate demand before building advanced features.",
  };
}

function buildPrompt(input: IdeaInput): string {
  return `
Analyze this startup idea and return a JSON validation report.

Startup Idea:
${input.idea}

Industry:
${input.industry || "Not specified"}

Target Customer:
${input.targetCustomer || "Not specified"}

Business Model:
${input.businessModel || "Not specified"}

Founder Budget:
${input.budget || "Not specified"}

Founder Experience Level:
${input.experienceLevel || "Not specified"}

Return JSON with exactly these fields:

{
  "ideaScore": number,
  "summary": string,
  "strengths": string[],
  "weaknesses": string[],
  "opportunities": string[],
  "threats": string[],
  "marketDemand": string,
  "competition": string,
  "targetCustomerInsights": string,
  "monetizationSuggestions": string[],
  "validationSteps": string[],
  "mvpRecommendation": string,
  "finalVerdict": string
}

Important:
- ideaScore must be a number from 0 to 100.
- summary should be 2 to 4 sentences.
- strengths, weaknesses, opportunities, threats must each contain 3 to 6 items.
- monetizationSuggestions must contain 3 to 6 items.
- validationSteps must contain 5 to 10 actionable steps.
- finalVerdict should be direct and practical.
- Return ONLY JSON.
`;
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
      const mockReport = buildMockReport(body);
      return NextResponse.json(mockReport);
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
        {
          role: "system",
          content: SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: buildPrompt(body),
        },
      ],
      temperature: 0.4,
      max_tokens: 2500,
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

    const jsonText = extractJson(content);
    const parsed = JSON.parse(jsonText);
    const report = normalizeReport(parsed);

    return NextResponse.json(report);
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Idea validation failed.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}
