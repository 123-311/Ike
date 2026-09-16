import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { getSetting } from "@/lib/settings";
import { SETTING_KEYS } from "@/lib/constants/settings";
import { prisma } from "@/lib/db";
import SiteHeader from "@/components/layout/SiteHeader";
import BottomNav from "@/components/layout/BottomNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mtaani Deals — Genuine Local Deals in Kenya",
  description:
    "Discover genuine local deals from businesses in your mtaani. Browse offers by category and county across Kenya.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0c7a3d",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  const tagline = await getSetting(SETTING_KEYS.BRAND_TAGLINE);
  const hasBusiness = user
    ? (await prisma.business.count({ where: { ownerId: user.id } })) > 0
    : false;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SiteHeader user={user} tagline={tagline} hasBusiness={hasBusiness} />
        <main className="flex-1 w-full max-w-5xl mx-auto px-4 pb-24 pt-4 sm:pb-8">
          {children}
        </main>
        <BottomNav user={user} hasBusiness={hasBusiness} />
      </body>
    </html>
  );
}
