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
8. Keep the tone professional, objective, and helpful

EXAMPLE RESPONSE:
"The capital of Nigeria is Abuja [1]. It replaced Lagos as the capital in 1991 [2]. The city has a population of over 3 million people [1].";

const SEARXNG_INSTANCES = [
  "https://searx.be/search",
  "https://search.ononoki.org/search",
  "https://searxng.site/search",
  "https://search.mdosch.de/search",
  "https://searx.privacytools.io/search"
];

export async function POST(req: Request) {
  try {
    const { query, focus } = await req.json();

    if (!query || !query.trim()) {
      console.error("No query provided");
      return NextResponse.json({ error: "Query is required" }, { status: 400 });
    }

    console.log("🔍 Kara Search: Processing query:", query, "| Focus:", focus);

    // --- LAYER 1: RETRIEVAL (SearXNG with fallbacks) ---
    let searchData: any = null;
    let usedInstance = "";
    let searchError = "";

    for (const instance of SEARXNG_INSTANCES) {
      try {
        console.log("🌐 Trying SearXNG instance:", instance);
        const searchUrl = `${instance}?q=${encodeURIComponent(query)}&format=json&categories=general${focus !== 'all' ? ',' + focus : ''}`;
        
        const searchResponse = await fetch(searchUrl, {
          next: { revalidate: 0 },
          headers: { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) KaraSearch/1.0",
            "Accept": "application/json"
          }
        });

        if (searchResponse.ok) {
          searchData = await searchResponse.json();
          usedInstance = instance;
          const resultCount = searchData.results?.length || 0;
          console.log(`✅ SearXNG SUCCESS: ${instance} | Found ${resultCount} results`);
          
          if (resultCount > 0) {
            console.log("📄 First result:", searchData.results[0].title);
          }
          break;
        } else {
          searchError = `Instance ${instance} returned ${searchResponse.status}`;
          console.warn(`❌ SearXNG failed: ${instance} | Status: ${searchResponse.status}`);
        }
      } catch (err: any) {
        searchError = err.message;
        console.warn(` SearXNG instance error: ${instance} |`, err.message);
      }
    }

    // Check if we got any results
    if (!searchData || !searchData.results || searchData.results.length === 0) {
      console.error("❌ No search results found from any SearXNG instance");
      return NextResponse.json({ 
        ok: true, 
        answer: `I searched multiple search engines but couldn't find any results for "${query}". This could mean:\n\n1. The query is too specific or recent\n2. Search engines are temporarily unavailable\n3. Try rephrasing your query with different keywords\n\nPlease try again with a different search term.`, 
        sources: [],
        debug: { searchError, triedInstances: SEARXNG_INSTANCES }
      });
    }

    const results = searchData.results.slice(0, 10); // Use top 10 results
    console.log(`📚 Processing ${results.length} search results for AI synthesis...`);

    // Format results for the AI - be very explicit
    const contextSources = results.map((r: any, index: number) => {
      const title = r.title || "Untitled";
      const url = r.url || "No URL";
      const content = r.content || r.snippet || "No description available";
      return `[${index + 1}] ${title}\nURL: ${url}\nContent: ${content}`;
    }).join("\n\n---\n\n");

    console.log("📝 Formatted context for AI (length:", contextSources.length, "chars)");

    // --- LAYER 2: SYNTHESIS (Qwen AI) ---
    const qUrl = process.env.KARA_SEARCH_QWEN_API_URL || process.env.QWEN_API_URL;
    const qKey = process.env.KARA_SEARCH_QWEN_API_KEY || process.env.QWEN_API_KEY;
    const qModel = process.env.KARA_SEARCH_QWEN_MODEL || process.env.QWEN_MODEL || "3.75";

    if (!qUrl || !qKey) {
      console.error("❌ Missing Qwen API configuration");
      console.error("KARA_SEARCH_QWEN_API_URL:", qUrl ? "✅ Set" : " Missing");
      console.error("KARA_SEARCH_QWEN_API_KEY:", qKey ? "✅ Set" : "❌ Missing");
      
      return NextResponse.json({ 
        error: "AI configuration missing. Please add KARA_SEARCH_QWEN_API_KEY and KARA_SEARCH_QWEN_API_URL to Vercel Environment Variables.",
        debug: { hasUrl: !!qUrl, hasKey: !!qKey }
      }, { status: 500 });
    }

    console.log("🤖 Calling Qwen AI API...");
    console.log("Model:", qModel);
    console.log("URL:", qUrl.replace(qKey, "***"));

    const userPrompt = `Query: ${query}\n\nSearch Results:\n${contextSources}\n\nPlease provide a comprehensive answer to the query using ONLY the information from the search results above. Include citations like [1], [2], etc.`;

    try {
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
            { role: "user", content: userPrompt }
          ],
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!aiResponse.ok) {
        const errorText = await aiResponse.text();
        console.error("❌ Qwen API error:", aiResponse.status, errorText);
        return NextResponse.json({ 
          error: `AI service error: ${aiResponse.status}. ${errorText}`,
          debug: { status: aiResponse.status, error: errorText }
        }, { status: 502 });
      }

      const aiData = await aiResponse.json();
      console.log(" Qwen API response received");
      
      const answer = aiData.choices?.[0]?.message?.content;
      
      if (!answer) {
        console.error("❌ Qwen returned empty response");
        console.log("Full response:", JSON.stringify(aiData, null, 2));
        return NextResponse.json({
          ok: true,
          answer: "I found search results but couldn't synthesize an answer. The search results were:\n\n" + results.map((r: any, i: number) => `[${i+1}] ${r.title}`).join("\n"),
          sources: results.map((r: any) => ({
            title: r.title,
            url: r.url,
            snippet: r.content || r.snippet || ""
          })),
          debug: { aiResponse: aiData }
        });
      }

      console.log("✅ AI synthesis complete (length:", answer.length, "chars)");
      console.log("Answer preview:", answer.substring(0, 200) + "...");

      // --- LAYER 3: RETURN TO FRONTEND ---
      return NextResponse.json({
        ok: true,
        answer: answer,
        sources: results.map((r: any) => ({
          title: r.title,
          url: r.url,
          snippet: r.content || r.snippet || ""
        })),
        meta: {
          query,
          resultsCount: results.length,
          usedInstance,
          model: qModel
        }
      });

    } catch (aiError: any) {
      console.error(" Qwen API call failed:", aiError);
      // Return search results even if AI fails
      return NextResponse.json({
        ok: true,
        answer: `I found ${results.length} search results but encountered an error generating the AI synthesis. Here are the raw results:\n\n` + 
          results.map((r: any, i: number) => `[${i+1}] **${r.title}**\n${r.content || r.snippet || "No description"}\n${r.url}\n`).join("\n"),
        sources: results.map((r: any) => ({
          title: r.title,
          url: r.url,
          snippet: r.content || r.snippet || ""
        })),
        error: "AI synthesis failed: " + aiError.message,
        debug: { error: aiError.message }
      });
    }

  } catch (error: any) {
    console.error(" Kara Search Fatal Error:", error);
    console.error("Stack:", error.stack);
    return NextResponse.json({ 
      error: `Search failed: ${error.message}`,
      debug: { error: error.message, stack: error.stack }
    }, { status: 500 });
  }
}
