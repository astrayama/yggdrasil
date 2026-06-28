import type { Metadata } from "next";
import { Carattere } from "next/font/google";
import { HomePage } from "@/components/home/HomePage";

const carattere = Carattere({
  subsets: ["latin"],
  weight: "400",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Yggdrasil Journal | Turn your journal into a living map",
  description:
    "Yggdrasil reads every journal entry and reveals the themes, emotions, people, and hidden connections across your writing.",
  keywords: [
    "Yggdrasil Journal",
    "semantic journaling",
    "AI journal",
    "knowledge graph journal",
    "reflective writing",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Yggdrasil Journal",
    description:
      "Turn your journal into a living map of patterns, connections, and insights.",
    url: "/",
    siteName: "Yggdrasil Journal",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Yggdrasil Journal",
    description:
      "Turn your journal into a living map of patterns, connections, and insights.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const homepageJsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Yggdrasil Journal",
  applicationCategory: "LifestyleApplication",
  operatingSystem: "Web",
  description:
    "Yggdrasil reads every journal entry and reveals the themes, emotions, people, and hidden connections across your writing.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homepageJsonLd) }}
      />
      <HomePage scriptClassName={carattere.className} />
    </>
  );
}
