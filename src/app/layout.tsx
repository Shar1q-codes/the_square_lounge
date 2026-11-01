import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import { site } from "@/config/site";
import { SmoothScroll } from "@/components/layout/SmoothScroll";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const title = `${site.name} | ${site.tagline}`;

// Open Graph and Twitter images come from app/opengraph-image.tsx and app/twitter-image.tsx.
// LocalBusiness JSON-LD is rendered in app/page.tsx.
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title,
  description: site.description,
  applicationName: site.name,
  keywords: [
    "gaming lounge Malakpet",
    "PS5 gaming Hyderabad",
    "PlayStation lounge Hyderabad",
    "PS4 gaming cafe",
    "gaming zone Malakpet",
    "birthday gaming party Hyderabad",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: "/",
    siteName: site.name,
    title,
    description: site.description,
    locale: site.locale,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: site.description,
  },
  robots: { index: true, follow: true },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#07070A",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="bg-bg font-sans text-fg antialiased">
        <SmoothScroll>{children}</SmoothScroll>
      </body>
    </html>
  );
}
