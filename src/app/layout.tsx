import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { CompareDrawer } from "@/components/site/compare-drawer";
import { getCartCount } from "@/lib/cart";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: { default: "DieselPro Brands", template: "%s | DieselPro Brands" },
  description:
    "Premium diesel parts for agricultural, highway, construction, and marine industries. Turbochargers, fuel injectors, fuel pumps and more with the longest warranty in the business.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: { url: "/apple-icon.png", sizes: "180x180" },
  },
  openGraph: {
    title: "DieselPro Brands",
    description: "Premium diesel parts & components.",
    type: "website",
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const cartCount = await getCartCount();
  return (
    <html lang="en" className={`dark ${inter.variable}`}>
      <body className="min-h-screen bg-bg font-sans text-ink antialiased">
        <SiteHeader cartCount={cartCount} />
        <main className="min-h-[calc(100dvh-4rem)]">{children}</main>
        <CompareDrawer />
        <SiteFooter />
      </body>
    </html>
  );
}
