import LeadGate from "@/components/LeadGate";
import Link from "next/link";

export default function SuiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <LeadGate />
      <Link href="/guide" className="fixed bottom-5 left-5 z-50 rounded-full bg-slate-700 px-4 py-2 text-sm font-bold text-white shadow-xl hover:bg-slate-600">📘 Guide</Link>
      {children}
    </>
  );
}