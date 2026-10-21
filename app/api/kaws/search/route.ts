import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const SEARCH_SYSTEM_PROMPT = `You are Kara Search, an advanced AI answer engine powered by Qwen.
You will be given a user query and a list of search results from the web.

YOUR TASK:
1. Read through ALL the search results carefully
2. Synthesize a comprehensive, accurate answer to the user's query
3. Use ONLY the information provided in the search results
4. Include inline citations like [1], [2] at the end of sentences that use specific information
5. The citation numbers correspond to the source number in the list
6. If the search results don't contain enough information, say so clearly but try to provide what you can
7. Format in clean Markdown with headers, bullet points where helpful
8. Keep the tone professional, objective, and helpful`;

export async function POST(req: Request) {
  try {
    const { query, focus } = await req.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    console.log("🔍 Kara Search: Processing query:", query);

    // --- LAYER 1: RETRIEVAL (Serper.dev Google Search API) ---
    const serperKey = process.env.SERPER_API_KEY;
    
    if (!serperKey) {
      console.error("❌ SERPER_API_KEY missing");
      return NextResponse.json({ 
        error: "Search API key missing. Add SERPER_API_KEY to Vercel Environment Variables." 
      }, { status: 500 });
    }

    console.log("🌐 Calling Serper.dev Google Search API...");

    const searchResponse = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": serperKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: query,
        num: 10,
        gl: "us",
        hl: "en",
      }),
    });

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error("❌ Serper API error:", searchResponse.status, errorText);
      return NextResponse.json({ 
        error: `Search API error: ${searchResponse.status}` 
      }, { status: 502 });
    }

    const searchData = await searchResponse.json();
    const organicResults = searchData.organic || [];
    console.log(`📊 Found ${organicResults.length} organic results`);

    if (organicResults.length === 0) {
      return NextResponse.json({ 
        ok: true, 
        answer: `I couldn't find any results for "${query}". Try rephrasing your query.`, 
        sources: [] 
      });
    }

    const contextSources = organicResults.slice(0, 10).map((r: any, index: number) => 
      `[${index + 1}] ${r.title || "Untitled"}\nURL: ${r.link || "No URL"}\nSnippet: ${r.snippet || "No description"}`
    ).join("\n\n---\n\n");

    // --- LAYER 2: SYNTHESIS (Qwen AI - PROVEN WORKING!) ---
    const qUrl = process.env.KARA_SEARCH_QWEN_API_URL || process.env.QWEN_API_URL;
    const qKey = process.env.KARA_SEARCH_QWEN_API_KEY || process.env.QWEN_API_KEY;
    const qModel = process.env.KARA_SEARCH_QWEN_MODEL || process.env.QWEN_MODEL || "3.75";

    if (!qUrl || !qKey) {
      console.error("❌ Missing Qwen API configuration");
      return NextResponse.json({ error: "AI configuration missing." }, { status: 500 });
    }

    console.log("🤖 Calling Qwen AI with model:", qModel);

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
          { role: "user", content: `Query: ${query}\n\nSearch Results:\n${contextSources}\n\nPlease provide a comprehensive answer using ONLY the search results above. Include citations like [1], [2].` }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("❌ Qwen API error:", aiResponse.status, errorText);
      return NextResponse.json({ error: `AI service error: ${aiResponse.status}` }, { status: 502 });
    }

    const aiData = await aiResponse.json();
    const answer = aiData.choices?.[0]?.message?.content;

    if (!answer) {
      console.error("❌ Qwen returned empty response");
      return NextResponse.json({
        ok: true,
        answer: "I found search results but couldn't synthesize an answer. Please try again.",
        sources: organicResults.slice(0, 10).map((r: any) => ({ title: r.title, url: r.link, snippet: r.snippet || "" }))
      });
    }

    console.log("✅ AI synthesis complete (length:", answer.length, "chars)");

    return NextResponse.json({
      ok: true,
      answer: answer,
      sources: organicResults.slice(0, 10).map((r: any) => ({
        title: r.title,
        url: r.link,
        snippet: r.snippet || ""
      })),
      meta: { query, resultsCount: organicResults.length, model: qModel }
    });

  } catch (error: any) {
    console.error("💥 Kara Search Fatal Error:", error);
    return NextResponse.json({ error: `Search failed: ${error.message}` }, { status: 500 });
  }
}
