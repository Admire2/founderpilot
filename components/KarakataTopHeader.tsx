"use client";
import { useState } from "react";
import Link from "next/link";
import CartBadge from "@/components/CartBadge";

export default function KarakataTopHeader() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Force a full page reload to ensure the market page resets its state
      window.location.href = "/karakata?q=" + encodeURIComponent(searchQuery);
    }
  };

  return (
    <header className="w-full flex items-center justify-between gap-3">
      {/* Use standard <a> tag to force hard reload and clear search state */}
      <a href="/karakata" className="text-lg font-bold text-amber-400 flex-shrink-0 hover:text-amber-300 transition">
        KaraKata
      </a>
      
      <form onSubmit={handleSearch} className="flex flex-1 max-w-md mx-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products, services..."
          className="w-full rounded-l-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
        />
        <button type="submit" className="rounded-r-md bg-amber-400 px-3 py-1.5 text-slate-900 hover:bg-amber-300 font-bold text-sm">
          Search
        </button>
      </form>
      
      {/* ✅ INDUSTRY STANDARD: Uniform slate-300 default, turning pure white on hover */}
      <div className="flex items-center gap-4 text-sm font-medium">
        <Link href="/karakata/sellercenter/dashboard" className="text-slate-300 hover:text-white transition whitespace-nowrap">
          Seller Center
        </Link>
        <Link href="/karakata/sellers" className="text-slate-300 hover:text-white transition whitespace-nowrap">
          Sellers
        </Link>
        <Link href="/karakata/build" className="text-slate-300 hover:text-white transition whitespace-nowrap">
          Build your Store 
        </Link>
        
        <CartBadge />
      </div>
    </header>
  );
}
