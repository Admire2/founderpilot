"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const CATS = [
  "Jewelry & Gems", "Fashion & Clothing", "Shoes & Leather", "Electronics", 
  "Electrical & Solar", "Home & Kitchen", "Groceries & Consumables", 
  "Beauty & Personal Care", "Health & Wellness", "Baby & Kids", 
  "Sports & Outdoors", "Artisan Services", "Vehicles & Auto Parts", "Other"
];

export default function AddProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sellerId, setSellerId] = useState<string | number | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(CATS[0]);
  const [condition, setCondition] = useState("new");
  const [genderUse, setGenderUse] = useState("unisex");

  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [videoUrl, setVideoUrl] = useState("");
  const [uploadingImages, setUploadingImages] = useState(false);

  const [variants, setVariants] = useState([{ size: "", color: "", price: "", stock: "", sku: "" }]);
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

  const handleImageFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith("image/")) {
        setMessage({ type: "error", text: `${file.name} is not an image file.` });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: "error", text: `${file.name} is too large. Max 5MB.` });
        return;
      }
      newFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    });

    setImageFiles((prev) => [...prev, ...newFiles]);
    setImagePreviews((prev) => [...prev, ...newPreviews]);
    setMessage(null);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  // ✅ BULLETPROOF UPLOAD FUNCTION
  const uploadImagesToStorage = async (): Promise<string[]> => {
    if (imageFiles.length === 0) return [];
    setUploadingImages(true);
    const uploadedUrls: string[] = [];

    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      console.log(`📤 Attempting to upload: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      
      const fileName = `listings/${Date.now()}-${i}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;

      try {
        const { data, error } = await sb.storage
          .from("kara")
          .upload(fileName, file, { 
            upsert: true, 
            cacheControl: "3600",
            contentType: file.type 
          });

        if (error) {
          console.error("❌ Supabase Upload Error:", error);
          throw error;
        }

        const { data: { publicUrl } } = sb.storage.from("kara").getPublicUrl(fileName);
        console.log(`✅ Successfully uploaded: ${publicUrl}`);
        uploadedUrls.push(publicUrl);
      } catch (error: any) {
        console.error("❌ Upload failed for", file.name, error);
        setMessage({ 
          type: "error", 
          text: `Failed to upload ${file.name}. Check browser console (F12) for details. Error: ${error.message}` 
        });
        setUploadingImages(false);
        return [];
      }
    }

    setUploadingImages(false);
    return uploadedUrls;
  };

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

    if (imageFiles.length === 0) {
      setMessage({ type: "error", text: "Please upload at least one product image." });
      setLoading(false);
      return;
    }

    const validVariants = variants.filter(v => v.price && v.stock);
    if (validVariants.length === 0) {
      setMessage({ type: "error", text: "Please add at least one variant with price and stock." });
      setLoading(false);
      return;
    }

    try {
      console.log("🚀 Starting image upload process...");
      const uploadedUrls = await uploadImagesToStorage();
      
      if (uploadedUrls.length === 0) {
        console.log("⚠️ Upload returned empty array, aborting save.");
        setLoading(false);
        return;
      }

      console.log("💾 Saving product to database with URLs:", uploadedUrls);
      const res = await fetch("/api/karakata/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seller_id: sellerId,
          title, description, category, condition, gender_use: genderUse,
          images: uploadedUrls, video_url: videoUrl, variants: validVariants,
          weight_lbs: weightLbs, domestic_shipping: domesticShipping, international_shipping: internationalShipping
        }),
      });
      
      const data = await res.json();
      if (data.ok) {
        setMessage({ type: "success", text: "✅ Product created successfully!" });
        imagePreviews.forEach(url => URL.revokeObjectURL(url));
        setTimeout(() => router.push("/karakata"), 1500);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to save product." });
      }
    } catch (err: any) {
      console.error("💥 Fatal error during submit:", err);
      setMessage({ type: "error", text: "Network error. Check console." });
    } finally {
      setLoading(false);
    }
  };

  if (!sellerId) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="animate-pulse font-bold text-slate-600">Loading...</p></div>;

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 text-slate-900">
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
          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">1. Basic Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Product Title *</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g., Premium Leather Cap-Toe Oxford Shoes" className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none" required />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="Describe the product features, materials, and condition..." className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 placeholder-slate-400 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-purple-500 outline-none">
                    {CATS.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Condition</label>
                  <select value={condition} onChange={e => setCondition(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-purple-500 outline-none">
                    <option value="new">New</option><option value="used">Used</option><option value="refurbished">Refurbished</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Gender / Target Use</label>
                  <select value={genderUse} onChange={e => setGenderUse(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-purple-500 outline-none">
                    <option value="unisex">Unisex / Universal</option><option value="men">Men</option><option value="women">Women</option><option value="boys">Boys</option><option value="girls">Girls</option><option value="kids">Kids (General)</option>
                  </select>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">2. Media Gallery</h2>
            <p className="text-xs text-slate-500 mb-4">Upload high-quality photos. First image will be the main thumbnail.</p>
            <div className="mb-4">
              <label className="block text-sm font-bold text-slate-700 mb-2">Product Images (JPG, PNG, WebP - Max 5MB each)</label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-purple-500 transition cursor-pointer bg-slate-50">
                <input type="file" accept="image/jpeg,image/png,image/webp,image/jpg" multiple onChange={handleImageFileSelect} className="hidden" id="image-upload" />
                <label htmlFor="image-upload" className="cursor-pointer block">
                  <svg className="mx-auto h-12 w-12 text-slate-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <p className="mt-2 text-sm text-slate-600"><span className="font-bold text-purple-600">Click to upload</span> or drag and drop</p>
                </label>
              </div>
            </div>

            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {imagePreviews.map((preview, idx) => (
                  <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                    <img src={preview} alt={`Preview ${idx + 1}`} className="w-full h-32 object-cover" />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <button type="button" onClick={() => removeImage(idx)} className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </div>
                    <div className="absolute top-1 left-1 bg-slate-900 text-white text-xs px-2 py-1 rounded">{idx === 0 ? "🎯 Main" : `#${idx + 1}`}</div>
                  </div>
                ))}
              </div>
            )}

            {uploadingImages && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800 font-bold text-center animate-pulse">
                📤 Uploading images to KaraKata storage...
              </div>
            )}

            <div className="mt-4">
              <label className="block text-sm font-bold text-slate-700 mb-1">Video URL (Optional)</label>
              <input type="url" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-purple-500 outline-none" />
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">3. Variants (Size, Color, Price, Stock)</h2>
            <div className="space-y-3 border border-slate-200 rounded-xl p-4 bg-slate-50">
              <div className="grid grid-cols-12 gap-2 text-xs font-bold text-slate-600 uppercase">
                <div className="col-span-2">Size</div><div className="col-span-2">Color</div><div className="col-span-2">Price ($)</div><div className="col-span-2">Stock</div><div className="col-span-3">SKU</div><div className="col-span-1"></div>
              </div>
              {variants.map((v, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                  <input type="text" value={v.size} onChange={e => handleVariantChange(idx, "size", e.target.value)} placeholder="e.g., 42" className="col-span-2 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 placeholder-slate-400" />
                  <input type="text" value={v.color} onChange={e => handleVariantChange(idx, "color", e.target.value)} placeholder="e.g., Black" className="col-span-2 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 placeholder-slate-400" />
                  <input type="number" step="0.01" value={v.price} onChange={e => handleVariantChange(idx, "price", e.target.value)} placeholder="50.00" className="col-span-2 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 placeholder-slate-400" required />
                  <input type="number" value={v.stock} onChange={e => handleVariantChange(idx, "stock", e.target.value)} placeholder="10" className="col-span-2 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 placeholder-slate-400" required />
                  <input type="text" value={v.sku} onChange={e => handleVariantChange(idx, "sku", e.target.value)} placeholder="SKU-01" className="col-span-3 rounded border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 placeholder-slate-400" />
                  <button type="button" onClick={() => removeVariantRow(idx)} className="col-span-1 text-red-500 hover:text-red-700 font-bold">✕</button>
                </div>
              ))}
              <button type="button" onClick={addVariantRow} className="text-sm font-bold text-purple-600 hover:underline mt-2">+ Add Another Variant</button>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 mb-4">4. Shipping</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="block text-sm font-bold text-slate-700 mb-1">Weight (lbs)</label><input type="number" step="0.1" value={weightLbs} onChange={e => setWeightLbs(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-purple-500 outline-none" /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">Domestic Shipping ($)</label><input type="number" step="0.01" value={domesticShipping} onChange={e => setDomesticShipping(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-purple-500 outline-none" /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-1">International ($)</label><input type="number" step="0.01" value={internationalShipping} onChange={e => setInternationalShipping(e.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-purple-500 outline-none" /></div>
            </div>
          </section>

          <button type="submit" disabled={loading || uploadingImages} className="w-full bg-purple-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-purple-700 transition disabled:opacity-50">
            {loading ? "Saving Product..." : uploadingImages ? "Uploading Images..." : "Publish Product to Market"}
          </button>
        </form>
      </div>
    </main>
  );
}
