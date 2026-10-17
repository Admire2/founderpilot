import { NextResponse } from "next/server";

type PersonaInput = {
  idea: string;
  industry?: string;
};

const SYSTEM_PROMPT = `
You are FounderPilot AI, an expert customer researcher.
Your job is to build a detailed ideal customer persona for a startup idea.
Be specific and practical. Avoid generic advice.
Always return ONLY valid JSON. No markdown. No explanations outside JSON.
`;

function buildPrompt(input: PersonaInput): string {
  return `
Build the ideal customer persona for this startup idea.

Startup Idea:
${input.idea}

Industry:
${input.industry || "Not specified"}

Return JSON with exactly these fields:
{
  "summary": string,
  "personaName": string,
  "ageRange": string,
  "jobRole": string,
  "goals": string[],
  "painPoints": string[],
  "frustrations": string[],
  "motivations": string[],
  "buyingBehavior": string,
  "objections": string[],
  "preferredChannels": string[],
  "messagingAngles": string[],
  "quote": string
}

Rules:
- personaName should be a realistic fictional name like "Founder Fiona".
- goals, painPoints, frustrations, motivations, objections, preferredChannels, messagingAngles must each contain 3 to 6 items.
- quote is one sentence the persona would say.
- Return ONLY JSON.
`;
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item));
}

function buildMockReport(input: PersonaInput) {
  return {
    summary: `Primary persona identified for: "${input.idea.slice(
      0,
      100
    )}". The strongest early adopter is a time-poor solo founder who needs clarity before investing money.`,

    personaName: "Founder Fiona",
    ageRange: "25 to 40",
    jobRole: "Solo founder / side-project builder with a day job",

    goals: [
      "Validate her startup idea before quitting her job.",
      "Avoid wasting months building something nobody wants.",
      "Look credible when talking to potential customers and investors.",
      "Find a clear niche and positioning quickly.",
    ],

    painPoints: [
      "Too many ideas, not enough clarity on which one to pursue.",
      "Market research feels slow, confusing, and expensive.",
      "Does not know how to talk to potential customers.",
      "Overwhelmed by generic AI advice that is not actionable.",
    ],

    frustrations: [
      "Business books and courses are too theoretical.",
      "Consultants are too expensive for an early-stage founder.",
      "Existing tools give vague scores without next steps.",
    ],

    motivations: [
      "Freedom and ownership over her career.",
      "Proof that her idea can make money.",
      "Speed: getting answers in minutes, not weeks.",
    ],

    buyingBehavior:
      "She researches on Twitter/X, YouTube, and Indie Hackers, tries free tools first, and pays for anything that saves her a week of work. Card payment, monthly subscription, cancel anytime.",

    objections: [
      "Is this just ChatGPT with a nicer UI?",
      "Will the advice be specific to my idea or generic?",
      "I have almost no budget right now.",
    ],

    preferredChannels: [
      "Twitter/X founder community",
      "YouTube founder stories",
      "Indie Hackers and Product Hunt",
      "Founder newsletters and Discord communities",
    ],

    messagingAngles: [
      "Know in 60 seconds if your idea is worth building.",
      "Skip months of guesswork with a structured validation report.",
      "Built for solo founders with zero budget and no time.",
    ],

    quote:
      "I just need to know if this idea is real before I spend my nights building it.",
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
      temperature: 0.6,
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
      personaName: String(parsed.personaName || ""),
      ageRange: String(parsed.ageRange || ""),
      jobRole: String(parsed.jobRole || ""),
      goals: toStringArray(parsed.goals),
      painPoints: toStringArray(parsed.painPoints),
      frustrations: toStringArray(parsed.frustrations),
      motivations: toStringArray(parsed.motivations),
      buyingBehavior: String(parsed.buyingBehavior || ""),
      objections: toStringArray(parsed.objections),
      preferredChannels: toStringArray(parsed.preferredChannels),
      messagingAngles: toStringArray(parsed.messagingAngles),
      quote: String(parsed.quote || ""),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: "Persona generation failed.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}