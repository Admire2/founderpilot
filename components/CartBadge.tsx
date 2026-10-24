"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function CartBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Function to calculate total items in cart
    const updateCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("kara_cart") || "[]");
        const total = cart.reduce((sum: number, item: any) => sum + (item.qty || 1), 0);
        setCount(total);
      } catch {
        setCount(0);
      }
    };

    // Run on initial load
    updateCount();

    // ✅ Listen for changes from other tabs/pages instantly
    window.addEventListener("storage", updateCount);
    window.addEventListener("focus", updateCount);

    return () => {
      window.removeEventListener("storage", updateCount);
      window.removeEventListener("focus", updateCount);
    };
  }, []);

  return (
    <Link href="/karakata/checkout" className="relative flex items-center gap-1 text-slate-700 hover:text-amber-500 font-bold transition">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      <span>Cart</span>
      
      {/* ✅ THE LIVE RED BADGE */}
      {count > 0 && (
        <span className="absolute -top-2 -right-3 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-sm animate-pulse">
          {count}
        </span>
      )}
    </Link>
  );
}
