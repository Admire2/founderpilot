"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

const NAV_ITEMS = [
  { name: "Dashboard", href: "/karakata/sellercenter/dashboard", icon: "📊" },
  { name: "Add Product", href: "/karakata/sellercenter/inventory/new", icon: "➕" },
  { name: "Orders", href: "/karakata/sellercenter/orders", icon: "📦" },
  { name: "Messages", href: "/karakata/sellercenter/messages", icon: "💬" },
  { name: "Shipping Profiles", href: "/karakata/sellercenter/shipping", icon: "🚚" },
];

export default function SellerDashboard() {
  const router = useRouter();
  const [seller, setSeller] = useState<any>(null);
  const [stats, setStats] = useState({ revenue: 0, activeOrders: 0, pendingShip: 0, products: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initDashboard = async () => {
      const { data: { session } } = await sb.auth.getSession();
      if (!session?.user) {
        router.push("/auth?callbackUrl=/karakata/sellercenter/dashboard");
        return;
      }

      const { data: sellerData } = await sb
        .from("sellers")
        .select("*")
        .eq("email", session.user.email)
        .order("created_at", { ascending: false })
        .single();

      // ✅ ROLE GUARD: If no seller profile exists, this user is a buyer. Redirect to buyer hub.
      if (!sellerData) {
        router.push("/account");
        return;
      }
      
      setSeller(sellerData);

      const [ordersRes, listingsRes] = await Promise.all([
        sb.from("kara_orders").select("id, status, total_amount, created_at, buyer_email").eq("seller_id", sellerData.id).order("created_at", { ascending: false }),
        sb.from("kara_listings").select("id").eq("seller_id", sellerData.id)
      ]);

      const orders = ordersRes.data || [];
      const products = listingsRes.data || [];

      const revenue = orders
        .filter(o => o.status === "completed" || o.status === "delivered")
        .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      
      const activeOrders = orders.filter(o => ["escrow_active", "shipped", "dispute_open"].includes(o.status)).length;
      const pendingShip = orders.filter(o => o.status === "escrow_active").length;

      setStats({ revenue, activeOrders, pendingShip, products: products.length });
      setRecentOrders(orders.slice(0, 5));
      setLoading(false);
    };

    initDashboard();
  }, [router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="animate-pulse font-bold text-slate-600">Loading Dashboard...</p></div>;

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full">
        <div className="p-6 border-b border-slate-200">
          <Link href="/karakata/sellercenter/dashboard" className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white">K</span>
            KaraKata
          </Link>
          <p className="text-xs text-slate-500 mt-2 font-medium">Seller Portal</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link 
              key={item.name} 
              href={item.href} 
              className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-700 rounded-lg hover:bg-slate-100 transition"
            >
              <span className="text-lg">{item.icon}</span>
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200 space-y-2">
          {seller && (
            <Link href={`/karakata/sellers/${seller.id}`} className="block w-full text-center px-4 py-2 text-sm font-bold text-purple-700 bg-purple-50 rounded-lg hover:bg-purple-100 transition">
              👁️ View My Storefront
            </Link>
          )}
          <Link href="/karakata/sellercenter/dashboard" className="block w-full text-center px-4 py-2 text-sm font-bold text-emerald-700 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition">
            🏠 Back to Dashboard
          </Link>
          <Link href="/karakata" className="block w-full text-center px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition">
            🛒 Back to Market
          </Link>
        </div>
      </aside>

      <main className="flex-1 ml-64 p-8">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text
