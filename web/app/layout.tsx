import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ToastViewport } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://shopsphere.in"),
  title: {
    default: "ShopSphere — Considered pieces for everyday life",
    template: "%s · ShopSphere",
  },
  description:
    "Thoughtfully made clothing, homeware and everyday essentials. Free shipping over ₹999, 7-day returns and secure payments.",
  keywords: ["online shopping", "clothing", "home decor", "India", "ShopSphere"],
  openGraph: {
    title: "ShopSphere",
    description: "Considered pieces for everyday life. Designed in India, made to be kept.",
    type: "website",
    locale: "en_IN",
  },
};

const themeScript = `
try {
  var stored = localStorage.getItem('ss-theme');
  if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  }
} catch (error) {}
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" className={inter.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-bg font-sans text-text antialiased">
        {children}
        <ToastViewport />
      </body>
    </html>
  );
}
