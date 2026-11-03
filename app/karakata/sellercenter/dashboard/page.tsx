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
  const [lowStockVariants, setLowStockVariants] = useState<any[]>([]); // ✅ NEW: Low stock state
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

      if (!sellerData) {
        router.push("/account");
        return;
      }

      if (sellerData.status === 'pending') {
        setSeller({ ...sellerData, _guard: 'pending' });
        setLoading(false);
        return;
      }

      if (sellerData.status === 'rejected') {
        setSeller({ ...sellerData, _guard: 'rejected' });
        setLoading(false);
        return;
      }
      
      setSeller(sellerData);

      // ✅ Fetch Orders and Listings
      const [ordersRes, listingsRes] = await Promise.all([
        sb.from("kara_orders").select("id, status, total_amount, created_at, buyer_email").eq("seller_id", sellerData.id).order("created_at", { ascending: false }),
        sb.from("kara_listings").select("id, title").eq("seller_id", sellerData.id)
      ]);

      const orders = ordersRes.data || [];
      const listings = listingsRes.data || [];

      const revenue = orders
        .filter(o => o.status === "completed" || o.status === "delivered")
        .reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      
      const activeOrders = orders.filter(o => ["escrow_active", "shipped", "dispute_open"].includes(o.status)).length;
      const pendingShip = orders.filter(o => o.status === "escrow_active").length;

      setStats({ revenue, activeOrders, pendingShip, products: listings.length });
      setRecentOrders(orders.slice(0, 5));

      // ✅ NEW: Fetch Low Stock Variants (stock_quantity <= 5)
      const listingIds = listings.map((l: any) => l.id);
      if (listingIds.length > 0) {
        const { data: variants } = await sb
          .from("product_variants")
          .select("id, size, color, material, stock_quantity, sku, listing_id")
          .in("listing_id", listingIds)
          .lte("stock_quantity", 5)
          .order("stock_quantity", { ascending: true })
          .limit(5); // Top 5 most critical
        
        if (variants) {
          const enrichedVariants = variants.map((v: any) => {
            const listing = listings.find((l: any) => l.id === v.listing_id);
            return { ...v, title: listing?.title || "Unknown Product" };
          });
          setLowStockVariants(enrichedVariants);
        }
      }

      setLoading(false);
    };

    initDashboard();
  }, [router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="animate-pulse font-bold text-slate-600">Loading Dashboard...</p></div>;

  if (seller?._guard === 'pending') {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-amber-200 shadow-lg p-8 text-center max-w-md w-full animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">⏳</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Under Review</h2>
          <p className="text-slate-600 mb-6 leading-relaxed">
            Thank you for applying to sell on KaraKata! Our admin team is currently reviewing your shop profile to ensure marketplace quality. 
            <br /><br />
            We will notify you via email the moment your account is approved.
          </p>
          <Link href="/karakata" className="w-full block bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition">
            Return to Marketplace
          </Link>
        </div>
      </main>
    );
  }

  if (seller?._guard === 'rejected') {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-rose-200 shadow-lg p-8 text-center max-w-md w-full animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">❌</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Not Approved</h2>
          <p className="text-slate-600 mb-6 leading-relaxed">
            Unfortunately, your seller application did not meet our current marketplace guidelines. 
            <br /><br />
            If you believe this is an error, please contact our support team.
          </p>
          <Link href="/karakata" className="w-full block bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition">
            Return to Marketplace
          </Link>
        </div>
      </main>
    );
  }

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
            <h1 className="text-2xl font-bold text-slate-900">Welcome back, {seller.shop_name || "Seller"}! 👋</h1>
            <p className="text-sm text-slate-500 mt-1">Here's what's happening with your store today.</p>
          </div>
          <Link href="/karakata/sellercenter/inventory/new" className="bg-purple-600 text-white px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-purple-700 transition shadow-sm">
            ➕ Add New Product
          </Link>
        </header>

        {/* ✅ CLICKABLE STATS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link href="/karakata/sellercenter/orders" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition cursor-pointer group">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Revenue</p>
            <p className="text-3xl font-bold text-emerald-600 mt-2 group-hover:text-emerald-700">{formatCurrency(stats.revenue)}</p>
            <p className="text-xs text-slate-400 mt-1">From completed orders →</p>
          </Link>
          
          <Link href="/karakata/sellercenter/orders" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition cursor-pointer group">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Orders</p>
            <p className="text-3xl font-bold text-blue-600 mt-2 group-hover:text-blue-700">{stats.activeOrders}</p>
            <p className="text-xs text-slate-400 mt-1">In progress or shipped →</p>
          </Link>
          
          <Link href="/karakata/sellercenter/orders" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-300 transition cursor-pointer group">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pending Shipments</p>
            <p className="text-3xl font-bold text-amber-600 mt-2 group-hover:text-amber-700">{stats.pendingShip}</p>
            <p className="text-xs text-slate-400 mt-1">Awaiting your action →</p>
          </Link>
          
          <Link href="/karakata/sellercenter/inventory/new" className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-purple-300 transition cursor-pointer group">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Products</p>
            <p className="text-3xl font-bold text-purple-600 mt-2 group-hover:text-purple-700">{stats.products}</p>
            <p className="text-xs text-slate-400 mt-1">Add or manage listings →</p>
          </Link>
        </div>

        {/* ✅ NEW: LOW STOCK ALERTS SECTION */}
        {lowStockVariants.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-2xl">⚠️</span>
              <h2 className="text-lg font-bold text-amber-900">Low Stock Alerts</h2>
            </div>
            <p className="text-sm text-amber-800 mb-4">The following variants have 5 or fewer units in stock. Consider restocking soon to avoid lost sales.</p>
            <div className="bg-white rounded-lg border border-amber-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-amber-100/50 border-b border-amber-200">
                  <tr>
                    <th className="px-4 py-3 font-bold text-amber-900">Product</th>
                    <th className="px-4 py-3 font-bold text-amber-900">Variant Details</th>
                    <th className="px-4 py-3 font-bold text-amber-900 text-right">Stock Left</th>
                    <th className="px-4 py-3 font-bold text-amber-900 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100">
                  {lowStockVariants.map((variant) => (
                    <tr key={variant.id} className="hover:bg-amber-50/50 transition">
                      <td className="px-4 py-3 font-medium text-slate-900">{variant.title}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {variant.size && <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-xs mr-1 mb-1">Size: {variant.size}</span>}
                        {variant.color && <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-xs mr-1 mb-1">Color: {variant.color}</span>}
                        {variant.material && <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-xs mr-1 mb-1">Mat: {variant.material}</span>}
                        {variant.sku && <span className="inline-block bg-slate-100 px-2 py-0.5 rounded text-xs mb-1">SKU: {variant.sku}</span>}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-rose-600">{variant.stock_quantity}</td>
                      <td className="px-4 py-3 text-right">
                        <Link href="/karakata/sellercenter/inventory/new" className="text-xs font-bold text-purple-600 hover:underline">Restock →</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
