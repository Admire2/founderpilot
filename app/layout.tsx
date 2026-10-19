import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import KaraKataAuthBar from "@/components/KaraKataAuthBar";
import KarakataTopHeader from "@/components/KarakataTopHeader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FounderPilot | KaraKata Ecosystem",
  description: "The unified FounderPilot Ecosystem",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 text-slate-900`}>
        <div className="flex min-h-screen">
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
      </body>
    </html>
  );
}
