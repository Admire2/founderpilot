"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function KarakataTopHeader() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push('/karakata?q=' + encodeURIComponent(searchQuery));
    }
  };

  return (
    <header className="w-full bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between gap-3">
      {/* Branding */}
      <Link href="/karakata" className="text-lg font-bold text-amber-400 flex-shrink-0">
        KaraKata
      </Link>

      {/* Search Bar - Compact */}
      <form onSubmit={handleSearch} className="flex flex-1 max-w-xl mx-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products, services..."
          className="w-full rounded-l-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
        />
        <button type="submit" className="rounded-r-md bg-amber-400 px-3 py-1.5 text-slate-900 hover:bg-amber-300 font-bold text-sm">
          ??
        </button>
      </form>

      {/* Right Links - Clean Emojis */}
      <div className="flex items-center gap-3 text-xs font-bold text-white">
        <Link href="/karakata/sellers" className="hover:text-amber-400 transition whitespace-nowrap">
           Sellers
        </Link>
        <Link href="/karakata/build" className="hover:text-amber-400 transition text-amber-400 whitespace-nowrap">
          ??? Build my store free
        </Link>
        <Link href="/karakata/checkout" className="hover:text-amber-400 transition flex items-center gap-1 whitespace-nowrap">
          ?? Cart
        </Link>
      </div>
    </header>
  );
}
