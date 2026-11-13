import type { MetadataRoute } from "next";

/** A private app: ask search engines not to crawl or list it. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
