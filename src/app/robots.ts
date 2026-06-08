import type { MetadataRoute } from "next";

import { SITE_CONFIG } from "@/constants/site";

const SITE_URL = SITE_CONFIG.url.replace(/\/$/, "");

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/auth/",
        "/edit/",
        "/editor/",
        "/profile",
        "/search",
        "/sign-in",
        "/sign-up",
        "/write",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
