export async function fetchPropertyData(address: string): Promise<any> {
  const key = process.env.RAPIDAPI_KEY;
  // You will change this URL to match the specific RapidAPI endpoint you subscribe to
  const apiUrl = "https://zillow-com1.p.rapidapi.com/property"; 
  
  if (!key) return null;

  try {
    const r = await fetch(`${apiUrl}?address=${encodeURIComponent(address)}`, {
      headers: {
        "X-RapidAPI-Key": key,
        "X-RapidAPI-Host": apiUrl.replace("https://", "").split("/")[0]
      }
    });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) {
    console.error("RapidAPI fetch failed:", e);
    return null;
  }
}