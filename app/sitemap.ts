import type { MetadataRoute } from "next";
import { siteConfig } from "@/site.config";
import { getAllPostMeta } from "@/lib/content";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = (siteConfig.siteUrl || "http://localhost:3000").replace(/\/+$/, "");
  const pages = ["", "/posts", "/archive", "/tags", "/moments", "/photos", "/music", "/tree", "/friends", "/about"];

  const staticEntries: MetadataRoute.Sitemap = pages.map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" || path === "/posts" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));

  const postEntries: MetadataRoute.Sitemap = getAllPostMeta().map((post) => ({
    url: `${base}/posts/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticEntries, ...postEntries];
}
