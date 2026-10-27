"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [activeVariant, setActiveVariant] = useState<any>(null);
  const [mainImage, setMainImage] = useState<string>("");
  const [cartAdded, setCartAdded] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      const { data, error } = await sb
        .from("kara_listings")
        .select("*, sellers:seller_id(shop_name, city, country)")
        .eq("id", Number(id))
        .single();

      if (data) {
        setProduct(data);
        setMainImage(data.images?.[0] || data.image_url || "/placeholder.jpg");
        
        const variants = data.metadata?.variants || [];
        if (variants.length > 0) {
          setSelectedColor(variants[0].color);
          setSelectedSize(variants[0].size);
          setActiveVariant(variants[0]);
        }
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (!product?.metadata?.variants) return;
    const variants = product.metadata.variants;
    const match = variants.find(
      (v: any) => v.color === selectedColor && v.size === selectedSize
    );
    setActiveVariant(match || variants[0]);
  }, [selectedColor, selectedSize, product]);

  const handleAddToCart = () => {
    if (!activeVariant || !product) return;

    try {
      const savedCart = JSON.parse(localStorage.getItem("kara_cart") || "[]");
      const existingIndex = savedCart.findIndex((c: any) => String(c.id) === String(product.id));
      
      const cartItem = {
        id: product.id,
        listing_id: product.id,
        title: product.title,
        price_usd: Number(activeVariant.price),
        price: Number(activeVariant.price),
        image_url: mainImage,
        seller_id: product.seller_id,
        qty: 1,
        variant: {
          color: activeVariant.color,
          size: activeVariant.size,
          sku: activeVariant.sku
        },
        it: { 
          title: product.title, 
          price_usd: Number(activeVariant.price), 
          price: Number(activeVariant.price), 
          image_url: mainImage, 
          seller_id: product.seller_id 
        }
      };

      if (existingIndex > -1) {
        savedCart[existingIndex].qty += 1;
      } else {
        savedCart.push(cartItem);
      }

      localStorage.setItem("kara_cart", JSON.stringify(savedCart));
      window.dispatchEvent(new Event("kara_cart_updated"));
      
      setCartAdded(true);
      setTimeout(() => setCartAdded(false), 2000);
      
    } catch (error) {
      console.error("Failed to add to cart:", error);
      alert("There was an error adding this item to your cart.");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="animate-pulse font-bold text-slate-600">Loading product...</p></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="font-bold text-slate-600">Product not found.</p></div>;

  const variants = product.metadata?.variants || [];
  const availableColors = [...new Set(variants.map((v: any) => v.color))];
  const availableSizes = [...new Set(variants.map((v: any) => v.size))];

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 text-slate-900">
      <div className="max-w-6xl mx-auto">
        <Link href="/karakata" className="text-sm font-bold text-emerald-700 hover:underline mb-6 inline-block">← Back to Market</Link>
        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-10">
            
            {/* Left: Image Gallery */}
            <div className="space-y-4">
              <div className="aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 flex items-center justify-center">
                <img src={mainImage} alt={product.title} className="w-full h-full object-cover" />
              </div>
              {product.images && product.images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2">
                  {product.images.map((img: string, idx: number) => (
                    <button 
                      key={idx} 
                      onClick={() => setMainImage(img)}
                      className={`flex-shrink-0 w-20 h-20 rounded-lg border-2 overflow-hidden transition ${mainImage === img ? 'border-purple-600' : 'border-slate-200 hover:border-purple-300'}`}
                    >
                      <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Product Details & Variants */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{product.title}</h1>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  {/* ✅ UPDATED: Clickable Seller Storefront Link */}
                  <Link href={`/karakata/sellers/${product.seller_id}`} className="flex items-center gap-1 text-purple-700 font-bold hover:underline transition">
                    🏪 {product.sellers?.shop_name || "Unknown Seller"}
                  </Link>
                  <span>📍 {product.sellers?.city}, {product.sellers?.country}</span>
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <p className="text-sm text-purple-700 font-bold mb-1">Price</p>
                <p className="text-4xl font-bold text-slate-900">
                  ${activeVariant ? Number(activeVariant.price).toFixed(2) : Number(product.price_usd).toFixed(2)}
                </p>
                {activeVariant && Number(activeVariant.stock) < 5 && (
                  <p className="text-sm text-red-600 font-bold mt-2">⚠️ Only {activeVariant.stock} left in stock!</p>
                )}
              </div>

              {/* Variant Selectors */}
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-bold text-slate-700 mb-2">Color: <span className="text-slate-900">{selectedColor}</span></p>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map((color: string) => (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 rounded-lg border text-sm font-bold transition ${
                          selectedColor === color 
                            ? "border-purple-600 bg-purple-50 text-purple-700 ring-1 ring-purple-600" 
                            : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                        }`}
                      >
                        {color}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-700 mb-2">Size: <span className="text-slate-900">{selectedSize}</span></p>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size: string) => {
                      const isAvailable = variants.some((v: any) => v.color === selectedColor && v.size === size && Number(v.stock) > 0);
                      return (
                        <button
                          key={size}
                          disabled={!isAvailable}
                          onClick={() => isAvailable && setSelectedSize(size)}
                          className={`px-4 py-2 rounded-lg border text-sm font-bold transition ${
                            selectedSize === size && isAvailable
                              ? "border-purple-600 bg-purple-50 text-purple-700 ring-1 ring-purple-600"
                              : !isAvailable
                              ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed line-through"
                              : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button 
                onClick={handleAddToCart}
                disabled={!activeVariant || Number(activeVariant.stock) === 0 || cartAdded}
                className={`w-full py-4 rounded-xl font-bold text-lg transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  cartAdded 
                    ? "bg-emerald-500 text-white shadow-emerald-200" 
                    : "bg-purple-600 text-white hover:bg-purple-700 shadow-purple-200"
                }`}
              >
                {Number(activeVariant?.stock) === 0 
                  ? "Out of Stock" 
                  : cartAdded 
                    ? "✅ Added to Cart!" 
                    : `Add to Cart - $${Number(activeVariant?.price).toFixed(2)}`
                }
              </button>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-bold text-slate-900 mb-3">Description</h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
