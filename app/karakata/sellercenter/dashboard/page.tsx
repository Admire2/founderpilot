"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

// Navigation Items
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

      // ✅ Fetch the MOST RECENT seller profile (consistent with our previous fix)
      const { data: sellerData } = await sb
        .from("sellers")
        .select("*")
        .eq("email", session.user.email)
        .order("created_at", { ascending: false })
        .single();

      if (!sellerData) {
        router.push("/karakata/sellercenter"); // Redirect to onboarding if no profile
        return;
      }
      setSeller(sellerData);

      // ✅ Fetch Dashboard Metrics
      const [ordersRes, listingsRes] = await Promise.all([
        sb.from("kara_orders").select("id, status, total_amount, created_at, buyer_email").eq("seller_id", sellerData.id).order("created_at", { ascending: false }),
        sb.from("kara_listings").select("id").eq("seller_id", sellerData.id)
      ]);

      const orders = ordersRes.data || [];
      const products = listingsRes.data || [];

      // Calculate Stats
      const revenue = orders
        .filter(o => o.status === "completed" || o.status === "delivered")
        .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      
      const activeOrders = orders.filter(o => ["escrow_active", "shipped", "dispute_open"].includes(o.status)).length;
      const pendingShip = orders.filter(o => o.status === "escrow_active").length;

      setStats({
        revenue,
        activeOrders,
        pendingShip,
        products: products.length
      });

      setRecentOrders(orders.slice(0, 5)); // Last 5 orders
      setLoading(false);
    };

    initDashboard();
  }, [router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="animate-pulse font-bold text-slate-600">Loading Dashboard...</p></div>;

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* ✅ SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col fixed h-full">
        <div className="p-6 border-b border-slate-200">
          <Link href="/karakata" className="text-xl font-bold text-slate-900 flex items-center gap-2">
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
          <Link href="/karakata" className="block w-full text-center px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition">
            ← Back to Market
          </Link>
        </div>
      </aside>

      {/* ✅ MAIN CONTENT AREA */}
      <main className="flex-1 ml-64 p-8">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Welcome back, {seller.shop_name || "Seller"}! 👋</h1>
            <p className="text-sm text-slate-500 mt-1">Here's what's happening with your store today.</p>
          </div>
          <Link href="/karakata/sellercenter/inventory/new" className="bg-purple-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-purple-700 transition shadow-sm">
            ➕ Add New Product
          </Link>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</p>
            <p className="text-3xl font-bold text-emerald-600 mt-2">{formatCurrency(stats.revenue)}</p>
            <p className="text-xs text-slate-400 mt-1">From completed orders</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Orders</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{stats.activeOrders}</p>
            <p className="text-xs text-slate-400 mt-1">In progress or shipped</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Shipments</p>
            <p className="text-3xl font-bold text-amber-600 mt-2">{stats.pendingShip}</p>
            <p className="text-xs text-slate-400 mt-1">Awaiting your action</p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Products</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">{stats.products}</p>
            <p className="text-xs text-slate-400 mt-1">Active listings</p>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
            <Link href="/karakata/sellercenter/orders" className="text-sm font-bold text-purple-600 hover:underline">View All →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 font-bold text-slate-600">Order ID</th>
                  <th className="px-6 py-3 font-bold text-slate-600">Buyer</th>
                  <th className="px-6 py-3 font-bold text-slate-600">Total</th>
                  <th className="px-6 py-3 font-bold text-slate-600">Status</th>
                  <th className="px-6 py-3 font-bold text-slate-600">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500 font-medium">No orders yet. Start selling!</td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">#{String(order.id).slice(0, 8)}</td>
                      <td className="px-6 py-4 text-slate-700">{order.buyer_email || "Guest"}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(Number(order.total_amount) || 0)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                          order.status === "escrow_active" ? "bg-blue-100 text-blue-800" :
                          order.status === "shipped" ? "bg-purple-100 text-purple-800" :
                          order.status === "completed" ? "bg-emerald-100 text-emerald-800" :
                          "bg-slate-100 text-slate-800"
                        }`}>
                          {order.status.replace("_", " ").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{new Date(order.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
