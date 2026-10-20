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

// Multiple SearXNG instances for redundancy (if one is down, it tries the next)
const SEARXNG_INSTANCES = [
  "https://searx.be/search",
  "https://search.ononoki.org/search",
  "https://searxng.site/search",
  "https://search.mdosch.de/search"
];

export async function POST(req: Request) {
  try {
    const { query, focus } = await req.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    console.log("Kara Search: Processing query:", query, "Focus:", focus);

    // --- LAYER 1: RETRIEVAL (SearXNG with fallbacks) ---
    let searchData: any = null;

    for (const instance of SEARXNG_INSTANCES) {
      try {
        console.log("Trying SearXNG instance:", instance);
        const searchResponse = await fetch(
          `${instance}?q=${encodeURIComponent(query)}&format=json&categories=general${focus !== 'all' ? ',' + focus : ''}`,
          { 
            next: { revalidate: 0 },
            headers: { "User-Agent": "KaraSearch/1.0" } 
          }
        );

        if (searchResponse.ok) {
          searchData = await searchResponse.json();
          console.log("SearXNG success:", instance, "Results found:", searchData.results?.length || 0);
          break; // Stop trying other instances if this one works
        } else {
          console.warn("SearXNG failed:", instance, searchResponse.status);
        }
      } catch (err) {
        console.warn("SearXNG instance error:", instance, err);
      }
    }

    if (!searchData || !searchData.results || searchData.results.length === 0) {
      return NextResponse.json({ 
        ok: true, 
        answer: `I searched multiple sources but couldn't find specific information on "${query}". Try rephrasing your query.`, 
        sources: [] 
      });
    }

    const results = searchData.results;

    // Format results for the AI safely
    const contextSources = results.slice(0, 10).map((r: any, index: number) => 
      `[${index + 1}] ${r.title}\nURL: ${r.url}\nSnippet: ${r.content || r.snippet || "No snippet available"}`
    ).join("\n\n");

    // --- LAYER 2: SYNTHESIS (Qwen AI) ---
    // PRIMARY: 3.75 (Stable). FALLBACK: 3.8 or generic Qwen model.
    const qUrl = process.env.KARA_SEARCH_QWEN_API_URL || process.env.QWEN_API_URL;
    const qKey = process.env.KARA_SEARCH_QWEN_API_KEY || process.env.QWEN_API_KEY;
    const qModel = process.env.KARA_SEARCH_QWEN_MODEL || process.env.QWEN_MODEL || "3.75";

    if (!qUrl || !qKey) {
      console.error("Missing Qwen API keys in Environment Variables");
      return NextResponse.json({ 
        error: "AI configuration missing. Please add KARA_SEARCH_QWEN_API_KEY to Vercel." 
      }, { status: 500 });
    }

    console.log("Calling Qwen API with model:", qModel);

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
        temperature: 0.3, 
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Qwen API error:", aiResponse.status, errorText);
      return NextResponse.json({ 
        error: `AI service error: ${aiResponse.status}.` 
      }, { status: 502 });
    }

    const aiData = await aiResponse.json();
    const answer = aiData.choices?.[0]?.message?.content || "I couldn't generate an answer.";

    console.log("Search complete. Answer generated successfully.");

    // --- LAYER 3: RETURN TO FRONTEND ---
    return NextResponse.json({
      ok: true,
      answer: answer,
      sources: results.slice(0, 10).map((r: any) => ({
        title: r.title,
        url: r.url,
        snippet: r.content || r.snippet || ""
      }))
    });

  } catch (error: any) {
    console.error("Kara Search Fatal Error:", error);
    return NextResponse.json({ 
      error: `Search failed: ${error.message || "Unknown error"}` 
    }, { status: 500 });
  }
}
