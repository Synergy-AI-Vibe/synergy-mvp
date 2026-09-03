import type { MetadataRoute } from "next";

// 파비콘 패키지의 site.webmanifest를 App Router 규약으로 옮긴 것.
// PWA 아이콘은 안드로이드가 원형·물방울로 잘라내므로 maskable — 마크가 가운데 58%에만 있다.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "레시비",
    short_name: "레시비",
    icons: [
      {
        src: "/web-app-manifest-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/web-app-manifest-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    theme_color: "#111111",
    background_color: "#ffffff",
    display: "standalone",
  };
}
