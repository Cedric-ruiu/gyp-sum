// Build-time only: sitemap.xml generated from the pre-rendered routes
// (called from vite.config.ts once vite-ssg has written the pages).
import { findPage, hreflangLinks, pageUrl } from "./seo.ts";

export function buildSitemap(routePaths: string[]): string {
  const urls = routePaths.map((path) => {
    const page = findPage(path);
    if (!page) {
      throw new Error(
        `[sitemap] route "${path}" has no entry in SITE_PAGES (src/seo.ts)`,
      );
    }
    const alternates = hreflangLinks(page)
      .map(
        (l) =>
          `    <xhtml:link rel="alternate" hreflang="${l.hreflang}" href="${l.href}" />`,
      )
      .join("\n");
    return [
      "  <url>",
      `    <loc>${pageUrl(page.path)}</loc>`,
      alternates,
      `    <lastmod>${page.lastModified}</lastmod>`,
      "  </url>",
    ].join("\n");
  });

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    ...urls,
    "</urlset>",
    "",
  ].join("\n");
}
