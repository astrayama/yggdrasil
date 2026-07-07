import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Yggdrasil — Semantic Journaling",
    short_name: "Yggdrasil",
    description:
      "AI-powered semantic journaling. A living map of your inner world.",
    start_url: "/journal",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0F1A14",
    theme_color: "#0F1A14",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
