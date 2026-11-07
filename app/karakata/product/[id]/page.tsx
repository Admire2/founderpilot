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
  const [variantsData, setVariantsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyerId, setBuyerId] = useState<string | null>(null);
  
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedMaterial, setSelectedMaterial] = useState<string>("");
  const [activeVariant, setActiveVariant] = useState<any>(null);
  const [mainImage, setMainImage] = useState<string>("");
  const [cartAdded, setCartAdded] = useState(false);

  const [showContactModal, setShowContactModal] = useState(false);
  const [contactMessage, setContactMessage] = useState("");
  const [sendingInquiry, setSendingInquiry] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      const { data: { session } } = await sb.auth.getSession();
      if (session?.user) setBuyerId(session.user.id);

      const { data: listingData } = await sb
        .from("kara_listings")
        .select("*, sellers:seller_id(shop_name, city, country)")
        .eq("id", Number(id))
        .single();

      if (listingData) {
        setProduct(listingData);
        setMainImage(listingData.images?.[0] || listingData.image_url || "/placeholder.jpg");
        
        const { data: variants } = await sb
          .from("product_variants")
          .select("*")
          .eq("listing_id", Number(id));

        const variantsList = variants || [];
        setVariantsData(variantsList);
        
        if (variantsList.length > 0) {
          setSelectedColor(variantsList[0].color || "");
          setSelectedSize(variantsList[0].size || "");
          setSelectedMaterial(variantsList[0].material || "");
          setActiveVariant(variantsList[0]);
        }
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  useEffect(() => {
    if (variantsData.length === 0) return;
    
    const match = variantsData.find(
      (v: any) => 
        (v.color || "") === (selectedColor || "") && 
        (v.size || "") === (selectedSize || "") && 
        (v.material || "") === (selectedMaterial || "")
    );
    
    setActiveVariant(match || variantsData[0]);
  }, [selectedColor, selectedSize, selectedMaterial, variantsData]);

  // ✅ FALLBACK: If no variants exist, use the main product data as the "variant"
  const currentVariant = activeVariant || {
    id: product?.id,
    color: "",
    size: "",
    material: "",
    price_usd: product?.price_usd,
    stock_quantity: product?.inventory_count ?? 10,
    sku: "MAIN"
  };

  const handleAddToCart = () => {
    if (!currentVariant || !product) return;

    try {
      const savedCart = JSON.parse(localStorage.getItem("kara_cart") || "[]");
      
      const existingIndex = savedCart.findIndex((c: any) => 
        String(c.listing_id) === String(product.id) && 
        (c.variant?.color || "") === (currentVariant.color || "") &&
        (c.variant?.size || "") === (currentVariant.size || "") &&
        (c.variant?.material || "") === (currentVariant.material || "")
      );
      
      const cartItem = {
        id: product.id,
        listing_id: product.id,
        variant_id: currentVariant.id,
        title: product.title,
        price_usd: Number(currentVariant.price_usd),
        price: Number(currentVariant.price_usd),
        image_url: mainImage,
        seller_id: product.seller_id,
        qty: 1,
        variant: {
          color: currentVariant.color,
          size: currentVariant.size,
          material: currentVariant.material,
          sku: currentVariant.sku
        },
        it: { 
          title: product.title, 
          price_usd: Number(currentVariant.price_usd), 
          price: Number(currentVariant.price_usd), 
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

  const handleSendInquiry = async () => {
    if (!contactMessage.trim()) return;
    if (!buyerId) {
      router.push(`/auth?callbackUrl=/karakata/product/${id}`);
      return;
    }

    setSendingInquiry(true);
    const threadId = crypto.randomUUID(); 

    const { error } = await sb.from("kara_seller_messages").insert({
      thread_id: threadId,
      seller_id: product.seller_id,
      buyer_id: buyerId,
      buyer_name: "Buyer", 
      subject: `Inquiry about: ${product.title}`,
      message: contactMessage,
      sender_type: "buyer",
      status: "unread"
    });

    if (!error) {
      setContactMessage("");
      setShowContactModal(false);
      alert("✅ Message sent securely! The seller will reply shortly.");
    } else {
      alert("Failed to send message: " + error.message);
    }
    setSendingInquiry(false);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="animate-pulse font-bold text-slate-600">Loading product...</p></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="font-bold text-slate-600">Product not found.</p></div>;

  const availableColors = [...new Set(variantsData.map((v: any) => v.color).filter(Boolean))];
  const availableSizes = [...new Set(variantsData.map((v: any) => v.size).filter(Boolean))];
  const availableMaterials = [...new Set(variantsData.map((v: any) => v.material).filter(Boolean))];

  return (
    <main className="min-h-screen bg-slate-50 py-12 px-4 text-slate-900">
      <div className="max-w-6xl mx-auto">
        <Link href="/karakata" className="text-sm font-bold text-emerald-700 hover:underline mb-6 inline-block">← Back to Market</Link>
        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 md:p-10">
            
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

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">{product.title}</h1>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <Link href={`/karakata/sellers/${product.seller_id}`} className="flex items-center gap-1 text-purple-700 font-bold hover:underline transition">
                    🏪 {product.sellers?.shop_name || "Unknown Seller"}
                  </Link>
                  <span>📍 {product.sellers?.city}, {product.sellers?.country}</span>
                </div>
              </div>

              <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                <p className="text-sm text-purple-700 font-bold mb-1">Price</p>
                <p className="text-4xl font-bold text-slate-900">
                  ${Number(currentVariant.price_usd).toFixed(2)}
                </p>
                {Number(currentVariant.stock_quantity) < 5 && Number(currentVariant.stock_quantity) > 0 && (
                  <p className="text-sm text-red-600 font-bold mt-2">🔥 Only {currentVariant.stock_quantity} left in stock!</p>
                )}
              </div>

              {availableColors.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-slate-700 mb-2">Color: <span className="text-slate-900">{selectedColor || "Any"}</span></p>
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
              )}

              {availableSizes.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-slate-700 mb-2">Size: <span className="text-slate-900">{selectedSize || "Any"}</span></p>
                  <div className="flex flex-wrap gap-2">
                    {availableSizes.map((size: string) => {
                      const isAvailable = variantsData.some((v: any) => 
                        (v.color || "") === (selectedColor || "") && 
                        v.size === size && 
                        (v.material || "") === (selectedMaterial || "") &&
                        Number(v.stock_quantity) > 0
                      );
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
              )}

              {availableMaterials.length > 0 && (
                <div>
                  <p className="text-sm font-bold text-slate-700 mb-2">Material: <span className="text-slate-900">{selectedMaterial || "Any"}</span></p>
                  <div className="flex flex-wrap gap-2">
                    {availableMaterials.map((material: string) => {
                      const isAvailable = variantsData.some((v: any) => 
                        (v.color || "") === (selectedColor || "") && 
                        (v.size || "") === (selectedSize || "") && 
                        v.material === material &&
                        Number(v.stock_quantity) > 0
                      );
                      return (
                        <button
                          key={material}
                          disabled={!isAvailable}
                          onClick={() => isAvailable && setSelectedMaterial(material)}
                          className={`px-4 py-2 rounded-lg border text-sm font-bold transition ${
                            selectedMaterial === material && isAvailable
                              ? "border-purple-600 bg-purple-50 text-purple-700 ring-1 ring-purple-600"
                              : !isAvailable
                              ? "border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed line-through"
                              : "border-slate-300 bg-white text-slate-700 hover:border-slate-400"
                          }`}
                        >
                          {material}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {/* ✅ FIXED: Button now uses currentVariant and is never disabled unless truly out of stock */}
                <button 
                  onClick={handleAddToCart}
                  disabled={Number(currentVariant.stock_quantity) === 0 || cartAdded}
                  className={`w-full py-4 rounded-xl font-bold text-lg transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                    cartAdded 
                      ? "bg-emerald-500 text-white shadow-emerald-200" 
                      : "bg-purple-600 text-white hover:bg-purple-700 shadow-purple-200"
                  }`}
                >
                  {Number(currentVariant.stock_quantity) === 0 
                    ? "Out of Stock" 
                    : cartAdded 
                      ? "✅ Added to Cart!" 
                      : `Add to Cart - $${Number(currentVariant.price_usd).toFixed(2)}`
                  }
                </button>

                <button 
                  onClick={() => setShowContactModal(true)}
                  className="w-full py-3 rounded-xl font-bold text-sm border-2 border-slate-200 text-slate-700 hover:border-purple-300 hover:text-purple-700 hover:bg-purple-50 transition flex items-center justify-center gap-2"
                >
                   💬 Contact Seller with Questions
                </button>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <h3 className="text-lg font-bold text-slate-900 mb-3">Description</h3>
                <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{product.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showContactModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Contact {product.sellers?.shop_name}</h2>
                <p className="text-xs text-slate-500 mt-1">Regarding: <span className="font-semibold text-slate-700">{product.title}</span></p>
              </div>
              <button onClick={() => setShowContactModal(false)} className="text-slate-400 hover:text-slate-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-[11px] text-amber-800 font-bold flex items-center gap-1">
                🔒 Secure & Anonymous: Your email is hidden. The seller will reply via your KaraKata message center.
              </p>
            </div>

            <textarea
              value={contactMessage}
              onChange={(e) => setContactMessage(e.target.value)}
              placeholder="Hi, I have a question about the size, weight, or shipping of this item..."
              rows={4}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 mb-4"
            />

            <div className="flex gap-3">
              <button onClick={() => setShowContactModal(false)} className="flex-1 py-2.5 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button 
                onClick={handleSendInquiry} 
                disabled={sendingInquiry || !contactMessage.trim()} 
                className="flex-1 py-2.5 rounded-lg bg-purple-600 text-sm font-bold text-white hover:bg-purple-700 transition disabled:opacity-50"
              >
                {sendingInquiry ? "Sending..." : "Send Message"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
