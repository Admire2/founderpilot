"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

// SVG Icon Components
const CartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
);
const BriefcaseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
);
const WrenchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
);
const HospitalIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.56 5.01c.45-.45 1.18-.45 1.63 0l.7.7c.45.45.45 1.18 0 1.63l-.7.7c-.45.45-1.18.45-1.63 0l-.7-.7c-.45-.45-.45-1.18 0-1.63zM19.85 9.85c.45-.45.45-1.18 0-1.63l-.7-.7c-.45-.45-1.18-.45-1.63 0l-.7.7c-.45.45-.45 1.18 0 1.63l.7.7c.45.45 1.18.45 1.63 0z"/><path d="M12 2v20M2 12h20"/></svg>
);
const GlobeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
);
const RocketIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
);

export default function Sidebar() {
  const pathname = usePathname();
  
  // Each item now has an iconColor (for the icon itself) and activeColor (for the background when clicked)
  const navItems = [
    { href: "/karakata", label: "KaraKata Market", Icon: CartIcon, iconColor: "text-amber-500", activeColor: "bg-amber-500", title: "Shopping Cart" },
    { href: "/suite/business", label: "Business Suite", Icon: BriefcaseIcon, iconColor: "text-cyan-500", activeColor: "bg-cyan-600", title: "Business Tools" },
    { href: "/suite/engineering", label: "Engineering Suite", Icon: WrenchIcon, iconColor: "text-yellow-400", activeColor: "bg-yellow-500", title: "Engineering Tools" },
    { href: "/suite/healthcare", label: "Healthcare Suite", Icon: HospitalIcon, iconColor: "text-rose-500", activeColor: "bg-rose-500", title: "Healthcare Tools" },
    { href: "/suite/kaws", label: "KAWS", Icon: GlobeIcon, iconColor: "text-cyan-400", activeColor: "bg-cyan-600", title: "KaraKata AI Web Services" },
    { href: "/launch", label: "Launch", Icon: RocketIcon, iconColor: "text-purple-500", activeColor: "bg-purple-600", title: "Launch Your Project" },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 h-screen sticky top-0 p-4 flex flex-col">
      <div className="mb-8 px-4">
        <h1 className="text-xl font-bold text-cyan-400 mb-1">FounderPilot</h1>
        <p className="text-xs text-slate-400">KAWS</p>
      </div>
      
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.title}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? `${item.activeColor} text-white shadow-lg` 
                  : "text-slate-300 hover:bg-slate-800"
              }`}
            >
              {/* The icon gets its own permanent theme color */}
              <span className={item.iconColor}>
                <item.Icon />
              </span>
              <span className="font-medium text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-4 border-t border-slate-800">
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-1">Wallet Balance</p>
          <p className="text-lg font-bold text-emerald-400">20 Credits</p>
        </div>
      </div>
    </aside>
  );
}
