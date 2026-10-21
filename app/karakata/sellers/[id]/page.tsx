"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SellerDetailPage() {
  const params = useParams();
  const sellerId = params.id as string;

  const [seller, setSeller] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "general",
    message: ""
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const fetchSeller = async () => {
      const { data, error } = await sb
        .from("sellers")
        .select("*")
        .eq("id", sellerId)
        .single();
      
      if (data) {
        setSeller(data);
        const { data: reviewsData } = await sb
          .from("kara_reviews")
          .select("*")
          .eq("seller_id", sellerId)
          .order("created_at", { ascending: false });
        if (reviewsData) setReviews(reviewsData);
      }
      setLoading(false);
    };
    if (sellerId) fetchSeller();
  }, [sellerId]);

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    
    const { error } = await sb.from("kara_seller_messages").insert({
      seller_id: parseInt(sellerId),
      buyer_name: contactForm.name,
      buyer_email: contactForm.email,
      subject: contactForm.subject,
      message: contactForm.message,
      status: "unread"
    });
    
    if (!error) {
      setSent(true);
      setContactForm({ name: "", email: "", subject: "general", message: "" });
    }
    setSending(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white flex items-center justify-center">
        <p className="text-lg">Loading seller details...</p>
      </main>
    );
  }

  if (!seller) {
    return (
      <main className="min-h-screen bg-slate-950 p-6 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl mb-4">Seller not found</p>
          <Link href="/karakata/sellers" className="text-cyan-400 hover:underline">Back to sellers</Link>
        </div>
      </main>
    );
  }

  const avgRating = seller.avg_rating || 0;
  const starCount = Math.round(avgRating);
  const locationText = seller.city + (seller.country ? ", " + seller.country : "");

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="max-w-6xl mx-auto">
        <Link href="/karakata/sellers" className="text-sm font-bold text-cyan-400 hover:underline mb-6 inline-block">
          Back to sellers
        </Link>

        <div className="rounded-xl bg-slate-800 border border-slate-700 p-8 mb-8">
          <h1 className="text-4xl font-bold mb-4">{seller.shop_name}</h1>
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-yellow-400 text-2xl">{"?".repeat(starCount)}{"?".repeat(5 - starCount)}</span>
              <span className="text-slate-300 text-lg">{avgRating.toFixed(1)} ({reviews.length} reviews)</span>
            </div>
          </div>
          {seller.category && <p className="text-slate-400 mb-2">Category: {seller.category}</p>}
          <p className="text-slate-400">Location: {locationText}</p>
          {seller.description && <p className="text-slate-300 mt-4">{seller.description}</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
            {reviews.length === 0 ? (
              <div className="rounded-xl bg-slate-800 border border-slate-700 p-6 text-center">
                <p className="text-slate-400">No reviews yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((review: any) => {
                  const rStars = Math.round(review.rating || 0);
                  return (
                    <div key={review.id} className="rounded-xl bg-slate-800 border border-slate-700 p-6">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-yellow-400">{"?".repeat(rStars)}{"?".repeat(5 - rStars)}</span>
                          <span className="font-bold">{review.buyer_name || "Anonymous"}</span>
                        </div>
                        <span className="text-xs text-slate-500">{new Date(review.created_at).toLocaleDateString()}</span>
                      </div>
                      <p className="text-slate-300">{review.comment || review.message}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-2xl font-bold mb-4">Contact Seller</h2>
            <p className="text-slate-400 mb-6">Have a question, complaint, or feedback? Send a message directly to this seller.</p>

            {sent ? (
              <div className="rounded-xl bg-emerald-900/30 border border-emerald-500 p-6 text-center">
                <p className="text-emerald-400 text-lg font-bold mb-2">Message Sent!</p>
                <p className="text-slate-300">The seller will respond to your message soon.</p>
                <button onClick={() => setSent(false)} className="mt-4 text-cyan-400 hover:underline">Send another message</button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="rounded-xl bg-slate-800 border border-slate-700 p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Your Name</label>
                  <input type="text" required value={contactForm.name} onChange={(e) => setContactForm({...contactForm, name: e.target.value})} className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none" placeholder="John Doe" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Your Email</label>
                  <input type="email" required value={contactForm.email} onChange={(e) => setContactForm({...contactForm, email: e.target.value})} className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none" placeholder="john@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Subject</label>
                  <select value={contactForm.subject} onChange={(e) => setContactForm({...contactForm, subject: e.target.value})} className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none">
                    <option value="general">General Inquiry</option>
                    <option value="complaint">Product/Service Complaint</option>
                    <option value="refund">Refund Request</option>
                    <option value="shipping">Shipping Issue</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Message</label>
                  <textarea required rows={5} value={contactForm.message} onChange={(e) => setContactForm({...contactForm, message: e.target.value})} className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-white focus:border-emerald-500 focus:outline-none resize-none" placeholder="Describe your issue or question..." />
                </div>
                <button type="submit" disabled={sending} className="w-full rounded-lg bg-emerald-600 hover:bg-emerald-500 px-6 py-3 font-bold text-white disabled:opacity-50 transition">
                  {sending ? "Sending..." : "Send Message"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
