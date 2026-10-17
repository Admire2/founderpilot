"use client";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

function ReviewContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const submit = async (stars: number) => {
    setRating(stars);
    try {
      await fetch(`/api/karakata/review?order=${orderId}&stars=${stars}`);
      setSubmitted(true);
    } catch (e) {
      console.error(e);
    }
  };

  if (submitted) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
        <h1 className="text-4xl font-bold text-emerald-400 mb-4">Thank You!</h1>
        <div className="text-5xl mb-4">{"⭐".repeat(rating)}</div>
        <p className="text-slate-300">Your feedback helps the KaraKata community thrive.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-6 text-center">
      <h1 className="text-3xl font-bold mb-2">How was your order?</h1>
      <p className="text-slate-400 mb-8">Click a star to rate your seller instantly:</p>
      <div className="flex gap-4">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onClick={() => submit(s)}
            className="text-5xl hover:scale-125 transition-transform cursor-pointer bg-transparent border-none p-2"
          >
            ⭐
          </button>
        ))}
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">Loading...</div>}>
      <ReviewContent />
    </Suspense>
  );
}