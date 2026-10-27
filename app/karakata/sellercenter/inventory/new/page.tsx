"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sellerId, setSellerId] = useState<string | number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Basic Info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Fashion");
  const [condition, setCondition] = useState("new");

  // Media
  const [images, setImages] = useState<string[]>([""]);
  const [videoUrl, setVideoUrl] = useState("");

  // Variants
  const [variants, setVariants] = useState([{ size: "", color: "", price: "", stock: "", sku: "" }]);

  // Shipping
  const [weightLbs, setWeightLbs] = useState("1");
  const [domesticShipping, setDomesticShipping] = useState("10");
  const [internationalShipping, setInternationalShipping] = useState("25");

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.user) {
        router.push("/auth?callbackUrl=/karakata/sellercenter/inventory/new");
        return;
      }
      const { data: sellerData } = await sb.from("sellers").select("id").eq("email", session.user.email).single();
      if (sellerData) setSellerId(sellerData.id);
    };
    init();
  }, [router]);

  const handleImageChange = (index: number, value: string) => {
    const updated = [...images];
    updated[index] = value;
    setImages(updated);
  };

  const addImageField = () => setImages([...images, ""]);
  const removeImageField = (index: number) => setImages(images.filter((_, i) => i !== index));

  const handleVariantChange = (index: number, field: string, value: string) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: value };
    setVariants(updated);
  };

  const addVariantRow = () => setVariants([...variants, { size: "", color: "", price: "", stock: "", sku: "" }]);
  const removeVariantRow = (index: number) => setVariants(variants.filter((_, i) => i !== index));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!title.trim()) {
      setMessage({ type: "error", text: "Product title is required." });
      setLoading(false);
      return;
    }

    const cleanImages = images.filter(url => url.trim() !== "");
    const validVariants = variants.filter(v => v.price && v.stock);

    if (validVariants.length === 0) {
      setMessage({ type: "error", text: "Please add at least one variant with a price and stock quantity." });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/karakata/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seller_id: sellerId,
          title, description, category, condition,
          images: cleanImages, video_url: videoUrl,
          variants: validVariants,
          weight_lbs: weightLbs,
          domestic_shipping: domesticShipping,
          international_shipping: internationalShipping
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setMessage({ type: "success", text: "✅ Product created successfully!" });
        setTimeout(() => router.push("/karakata"), 1500);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save product." });
      }
    } catch (err: any) {
      setMessage({ type: "error", text: "Network error." });
    } finally {
      setLoading(false);
    }
  };

  if (!sellerId) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="animate-pulse font-bold text-slate-600">Loading...</p></div>;

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link href="/karakata/sellercenter" className="text-sm font-bold text-emerald-700 hover:underline mb-6 inline-block">← Back to Seller Center</Link>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Add New Product</h1>
        <p className="text-slate-600 mb-8">Create a new listing with multiple images and size/color variants.</p>

        {message && (
          <div className={`mb-6 p-4 rounded-lg text-sm font-bold ${message.type === "success" ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Basic Info */}
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">1. Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Product Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Premium Leather Sneakers" className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Describe the product features, materials, and condition..." className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-purple-500 outline-none">
                    <option value="Fashion">Fashion & Apparel</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Home">Home & Garden</option>
                    <option value="Beauty">Beauty & Health</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Condition</label>
                  <select value={condition} onChange={e => setCondition(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-purple-500 outline-none">
                    <option value="new">New</option>
                    <option value="used">Used</option>
                    <option value="refurbished">Refurbished</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Media */}
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">2. Media Gallery</h2>
            <div className="space-y-3">
              {images.map((img, idx) => (
                <div key={idx} className="flex gap-2">
                  <input 
                    type="url" 
                    value={img} 
                    onChange={e => handleImageChange(idx, e.target.value)} 
                    placeholder={idx === 0 ? "Main Image URL (Thumbnail)" : `Additional Image ${idx} URL`} 
                    className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 outline-none" 
                  />
                  {idx > 0 && (
                    <button type="button" onClick={() => removeImageField(idx)} className="px-3 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-bold">✕</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addImageField} className="text-sm font-bold text-purple-600 hover:underline">+ Add Another Image</button>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-bold text-slate-700 mb-1">Video URL (Optional)</label>
              <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=... or MP4 link" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-purple-500 outline-none" />
            </div>
          </section>

          {/* Section 3: Variants */}
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">3. Variants (Size, Color, Price, Stock)</h2>
            <p className="text-xs text-slate-500 mb-4">Add the specific options you have available. If you only have one version of this item, just add one row below.</p>
            <div className="space-y-3 border border-slate-200 rounded-xl p-4 bg-slate-50">
              <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-600 uppercase">
                <div className="col-span-2">Size</div>
                <div className="col-span-2">Color</div>
                <div className="col-span-2">Price ($)</div>
                <div className="col-span-2">Stock</div>
                <div className="col-span-3">SKU</div>
                <div className="col-span-1"></div>
              </div>
              {variants.map((v, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input type="text" value={v.size} onChange={e => handleVariantChange(idx, "size", e.target.value)} placeholder="e.g., 42" className="col-span-2 rounded border border-slate-300 px-2 py-1.5 text-sm" />
                  <input type="text" value={v.color} onChange={e => handleVariantChange(idx, "color", e.target.value)} placeholder="e.g., Red" className="col-span-2 rounded border border-slate-300 px-2 py-1.5 text-sm" />
                  <input type="number" step="0.01" value={v.price} onChange={e => handleVariantChange(idx, "price", e.target.value)} placeholder="50.00" className="col-span-2 rounded border border-slate-300 px-2 py-1.5 text-sm" required />
                  <input type="number" value={v.stock} onChange={e => handleVariantChange(idx, "stock", e.target.value)} placeholder="10" className="col-span-2 rounded border border-slate-300 px-2 py-1.5 text-sm" required />
                  <input type="text" value={v.sku} onChange={e => handleVariantChange(idx, "sku", e.target.value)} placeholder="SKU-01" className="col-span-3 rounded border border-slate-300 px-2 py-1.5 text-sm" />
                  <button type="button" onClick={() => removeVariantRow(idx)} className="col-span-1 text-red-500 hover:text-red-700 font-bold">✕</button>
                </div>
              ))}
              <button type="button" onClick={addVariantRow} className="text-sm font-bold text-purple-600 hover:underline mt-2">+ Add Another Variant</button>
            </div>
          </section>

          {/* Section 4: Shipping */}
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">4. Shipping</h2>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Weight (lbs)</label>
                <input type="number" step="0.1" value={weightLbs} onChange={e => setWeightLbs(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-purple-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Domestic Shipping ($)</label>
                <input type="number" step="0.01" value={domesticShipping} onChange={e => setDomesticShipping(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-purple-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">International ($)</label>
                <input type="number" step="0.01" value={internationalShipping} onChange={e => setInternationalShipping(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-purple-500 outline-none" />
              </div>
            </div>
          </section>

          <button type="submit" disabled={loading} className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-purple-700 transition disabled:opacity-50">
            {loading ? "Saving Product..." : "Publish Product to Market"}
          </button>
        </form>
      </div>
    </main>
  );
}
