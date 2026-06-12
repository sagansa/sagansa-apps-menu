import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { WebsiteJsonLd } from "@/components/seo/JsonLd";
import { AutoBreadcrumb } from "@/components/seo/AutoBreadcrumb";

const inter = Inter({ subsets: ["latin"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://menu.sagansa.id";
const SITE_NAME = "Web Order by Sagansa";
const SITE_DESCRIPTION =
  "Pesan menu makanan & minuman langsung dari HP kamu. Sistem pemesanan online untuk restoran, kafe, dan bisnis F&B yang terhubung dengan SAGANSA.";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0A0A0A",
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "pesan makanan online",
    "menu digital",
    "ordering system",
    "restoran online",
    "kafe online",
    "SAGANSA",
    "web order",
    "digital menu",
    "QR menu",
    "pemesanan restoran",
    "food ordering",
    "F&B Indonesia",
    "point of sale",
  ],
  authors: [{ name: "SAGANSA", url: "https://sagansa.id" }],
  creator: "SAGANSA",
  publisher: "SAGANSA",
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: {
      default: `${SITE_NAME} - Pesan Menu Online`,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/og-image.png`,
        width: 1200,
        height: 630,
        alt: `${SITE_NAME} - Sistem Pemesanan Online`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: {
      default: `${SITE_NAME} - Pesan Menu Online`,
      template: `%s | ${SITE_NAME}`,
    },
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/og-image.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <head>
        <link rel="dns-prefetch" href="//api-mobile.sagansa.id" />
        <link rel="preconnect" href="https://api-mobile.sagansa.id" />
      </head>
      <body className={inter.className}>
        <WebsiteJsonLd />
        <AutoBreadcrumb />
        <AuthProvider>
          <CartProvider>
            {children}
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}