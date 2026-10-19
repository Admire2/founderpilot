import Sidebar from "@/components/Sidebar";
import KaraKataAuthBar from "@/components/KaraKataAuthBar";
import KarakataTopHeader from "@/components/KarakataTopHeader";

export default function SuiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <div className="bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 py-2 gap-4">
          <KarakataTopHeader />
          <KaraKataAuthBar />
        </div>
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
