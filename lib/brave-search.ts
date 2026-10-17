export async function braveSearch(query: string, count = 5): Promise<string> {
  const key = process.env.BRAVE_API_KEY;
  if (!key) return "";
  try {
    const r = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`, {
      headers: { "X-Subscription-Token": key, Accept: "application/json" }
    });
    if (!r.ok) return "";
    const j: any = await r.json();
    if (!j.web || !j.web.results) return "";
    return j.web.results.map((w: any) => `TITLE: ${w.title}\nURL: ${w.url}\nSNIPPET: ${w.description}`).join("\n---\n");
  } catch { return ""; }
}