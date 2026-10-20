import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// 1. THE SYNTHESIS PROMPT (This makes it act like Perplexity)
const SEARCH_SYSTEM_PROMPT = `You are Kara Search, an advanced AI answer engine. 
You will be given a user query and a list of search results from the web.
Your task:
1. Synthesize a comprehensive, highly accurate, and easy-to-read answer to the user's query.
2. You MUST use inline citations. If you use information from a source, append a citation number like [1], [2], etc., at the end of the sentence.
3. The citation numbers correspond to the index of the search results provided (starting at 1).
4. If the search results do not contain the answer, state clearly that you couldn't find it, but offer a helpful related insight.
5. Format your response in clean Markdown.
6. Keep the tone objective, professional, and direct.`;

export async function POST(req: Request) {
  try {
    const { query, focus } = await req.json(); // focus could be 'all', 'academic', 'news'

    // --- LAYER 1: RETRIEVAL (SearXNG) ---
    // Using a public SearXNG instance so Vercel can reach it. 
    const searxngUrl = process.env.SEARXNG_URL || "https://searx.be/search"; 
    
    const searchResponse = await fetch(`${searxngUrl}?q=${encodeURIComponent(query)}&format=json&categories=general${focus !== 'all' ? ',' + focus : ''}`, {
      next: { revalidate: 0 } // Always get fresh results
    });

    if (!searchResponse.ok) {
      console.error("SearXNG Error:", searchResponse.status, searchResponse.statusText);
      return NextResponse.json({ error: "Search engine unreachable. Please try again." }, { status: 502 });
    }

    const searchData = await searchResponse.json();
    const results = searchData.results || [];

    if (results.length === 0) {
      return NextResponse.json({ 
        ok: true, 
        answer: "I searched the web but couldn't find specific information on this topic. Try rephrasing your query.", 
        sources: [] 
      });
    }

    // Format results for the AI
    const contextSources = results.slice(0, 10).map((r: any, index: number) => 
      `[${index + 1}] ${r.title}\nURL: ${r.url}\nSnippet: ${r.content}`
    ).join("\n\n");

    // --- LAYER 2: SYNTHESIS (Qwen AI) ---
    // Using dedicated Kara Search API keys for isolation and quota tracking
    const qUrl = process.env.KARA_SEARCH_QWEN_API_URL || process.env.QWEN_API_URL;
    const qKey = process.env.KARA_SEARCH_QWEN_API_KEY || process.env.QWEN_API_KEY;
    const qModel = process.env.KARA_SEARCH_QWEN_MODEL || process.env.QWEN_MODEL || "qwen-plus";

    if (!qUrl || !qKey) {
      return NextResponse.json({ error: "AI configuration missing. Please add KARA_SEARCH_QWEN_API_KEY and KARA_SEARCH_QWEN_API_URL to Vercel Environment Variables." }, { status: 500 });
    }

    const aiResponse = await fetch(qUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${qKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: qModel,
        messages: [
          { role: "system", content: SEARCH_SYSTEM_PROMPT },
          { role: "user", content: `Query: ${query}\n\nSources:\n${contextSources}` }
        ],
        temperature: 0.3, // Lower temperature for factual accuracy
      }),
    });

    const aiData = await aiResponse.json();
    const answer = aiData.choices?.[0]?.message?.content || "I couldn't generate an answer.";

    // --- LAYER 3: RETURN TO FRONTEND ---
    return NextResponse.json({
      ok: true,
      answer: answer,
      sources: results.slice(0, 10).map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.content
      }))
    });

  } catch (error) {
    console.error("Kara Search Error:", error);
    return NextResponse.json({ error: "Failed to process search" }, { status: 500 });
  }
}
