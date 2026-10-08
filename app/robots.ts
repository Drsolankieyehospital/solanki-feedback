import type { MetadataRoute } from "next";

// Patient data is health-adjacent — keep the whole app out of search engines.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", disallow: "/" },
  };
}
