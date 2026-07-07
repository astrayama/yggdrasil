import type { Metadata, Viewport } from "next";
import { Inter, Cormorant_Garamond, JetBrains_Mono } from "next/font/google";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "700"],
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["300", "400", "500"],
  style: ["normal", "italic"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400"],
});

const siteTitle = "Yggdrasil — Semantic Journaling";
const siteDescription =
  "AI-powered semantic journaling. A living map of your inner world.";

export const metadata: Metadata = {
  metadataBase: new URL("https://yggdrasil-497923.web.app"),
  title: {
    default: siteTitle,
    template: "%s | Yggdrasil",
  },
  description: siteDescription,
  applicationName: "Yggdrasil",
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", type: "image/x-icon" },
      { url: "/icons/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [
      {
        url: "/icons/apple-touch-icon.png",
        type: "image/png",
        sizes: "180x180",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    title: "Yggdrasil",
    statusBarStyle: "black-translucent",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "Yggdrasil",
    title: siteTitle,
    description: siteDescription,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Yggdrasil — Semantic Journaling",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0F1A14",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${cormorant.variable} ${jetbrainsMono.variable} font-sans antialiased`} suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: 'var(--surface)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
            },
            className: 'font-sans'
          }} 
        />
      </body>
    </html>
  );
}
