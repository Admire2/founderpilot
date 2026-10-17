export type PropertyRecord = {
  address: string; city?: string; state?: string; zip?: string;
  price?: number; avm?: number; beds?: number; baths?: number; sqft?: number;
  ownerOccupied?: boolean; lastSaleDate?: string; source: string;
};

const H = (key: string) => ({ Accept: "application/json", "X-Api-Key": key });

export async function geocode(place: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const r = await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(place), {
      headers: { "User-Agent": "KAWS-Scout/1.0" }
    });
    if (!r.ok) return null;
    const j: any = await r.json();
    return j[0] ? { lat: +j[0].lat, lon: +j[0].lon } : null;
  } catch { return null; }
}

export async function rentcastLookup(address: string): Promise<PropertyRecord | null> {
  const key = process.env.RENTCAST_API_KEY;
  if (!key) return null;
  try {
    const r = await fetch("https://api.rentcast.io/v1/properties?address=" + encodeURIComponent(address), { headers: H(key) });
    if (!r.ok) return null;
    const j: any = await r.json();
    return { address: j.formattedAddress || address, city: j.city, state: j.state, zip: j.zipCode, price: j.lastSalePrice, avm: j.avm ? j.avm.value : undefined, beds: j.bedrooms, baths: j.bathrooms, sqft: j.squareFeet, ownerOccupied: j.ownerOccupied, lastSaleDate: j.lastSaleDate, source: "RentCast LIVE" };
  } catch { return null; }
}

export async function rentcastLeads(place: string, limit = 8): Promise<PropertyRecord[]> {
  const key = process.env.RENTCAST_API_KEY;
  if (!key) return [];
  const g = await geocode(place);
  if (!g) return [];
  try {
    const url = "https://api.rentcast.io/v1/properties/sale?latitude=" + g.lat + "&longitude=" + g.lon + "&radius=5&limit=" + limit;
    const r = await fetch(url, { headers: H(key) });
    if (!r.ok) return [];
    const j: any = await r.json();
    return (Array.isArray(j) ? j : []).map((p: any) => ({
      address: p.formattedAddress, city: p.city, state: p.state, zip: p.zipCode,
      price: p.listPrice || p.lastSalePrice, avm: p.avm ? p.avm.value : undefined,
      beds: p.bedrooms, baths: p.bathrooms, sqft: p.squareFeet,
      ownerOccupied: p.ownerOccupied, lastSaleDate: p.lastSaleDate, source: "RentCast LIVE"
    }));
  } catch { return []; }
}