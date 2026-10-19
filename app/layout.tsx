import KarakataTopHeader from "@/components/KarakataTopHeader";
import KaraKataAuthBar from "@/components/KaraKataAuthBar";
import Sidebar from "@/components/Sidebar";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import MobileNav from "@/components/MobileNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FounderPilot AI - KAWS",
  description: "KaraKata AI Web Services - Real Estate AI Suite",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0" />
        <meta name="theme-color" content="#020617" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="KAWS" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className="bg-slate-50">
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
      <KarakataTopHeader />
        <div className="bg-slate-900 p-4 flex justify-end">
          <KaraKataAuthBar />
          </div>
        <div className="md:hidden">
          <MobileNav>{children}</MobileNav>
        </div>
        <div className="hidden md:flex h-screen">
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
            </div>
    </div>
  </body>
    </html>
  );
}

