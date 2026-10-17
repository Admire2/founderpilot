"use client";
import { usePathname } from "next/navigation";

export default function Footer() {
  const p = usePathname() || "";
  const health = p.indexOf("/suite/ilera") === 0 || p.indexOf("/suite/healthcare") === 0 || p.indexOf("/suite/ounje") === 0 || p === "/why-ilera";
  const market = p.indexOf("/karakata") === 0 || p.indexOf("/suite/marketplace") === 0 || p.indexOf("/suite/commerce") === 0;
  return (
    <footer className="border-t border-white/10 px-6 py-6 text-center">
      {health && (
        <p className="text-[11px] text-slate-400">All services are educational only and do not constitute professional advice. Consult licensed professionals for medical, legal, financial, or nutrition guidance.</p>
      )}
      {market && (
        <p className="text-[11px] text-slate-400">KaraKata is an online marketplace connecting independent buyers and sellers. Listings, prices, availability and lead times are set by third-party sellers, who are solely responsible for product accuracy, quality and fulfillment. Transactions are subject to the KaraKata Terms of Sale, Buyer Protection Policy and Privacy Notice (publishing at launch). KaraKata does not manufacture, inspect or warrant seller goods except where expressly stated. Report a listing or open a dispute via Contact &amp; Support.</p>
      )}
      {!health && !market && (
        <p className="text-[11px] text-slate-400">FounderPilot AI outputs are AI-generated guidance for planning and education. Verify with licensed professionals before acting on legal, financial, medical or engineering content.</p>
      )}
      <p className="mt-2 text-[10px] text-slate-500">© 2026 FounderPilot AI. All rights reserved. Full legal center (Terms, Privacy, DMCA, Accessibility) publishes at launch.</p>
    </footer>
  );
}
