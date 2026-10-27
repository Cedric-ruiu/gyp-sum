// Canonical public URLs, shared by the SEO head and the share button.
export const SITE_URL = "https://cedric-ruiu.github.io/gyp-sum";
export const FR_URL = `${SITE_URL}/`;
export const EN_URL = `${SITE_URL}/en/`;

export interface SitePage {
  // Route path, as declared in the router (relative to the `/gyp-sum/` base).
  path: string;
  locale: string;
  // Pages sharing a group are translations of each other (hreflang set).
  group: string;
  // Date of the last change to the visible content (YYYY-MM-DD): sitemap
  // <lastmod> and JSON-LD dateModified. Bump it when the copy changes, not on
  // code-only or styling changes.
  lastModified: string;
}

// Every pre-rendered route must be listed here: the sitemap build fails on a
// route without an entry.
export const SITE_PAGES: SitePage[] = [
  { path: "/", locale: "fr", group: "calculator", lastModified: "2026-10-27" },
  {
    path: "/en/",
    locale: "en",
    group: "calculator",
    lastModified: "2026-10-27",
  },
];

// Locale whose page is served as x-default.
const DEFAULT_LOCALE = "fr";

export function pageUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

export function findPage(path: string): SitePage | undefined {
  return SITE_PAGES.find((p) => p.path === path);
}

// Reciprocal hreflang set of a page, x-default last.
export function hreflangLinks(page: SitePage) {
  const siblings = SITE_PAGES.filter((p) => p.group === page.group);
  const links = siblings.map((p) => ({
    hreflang: p.locale,
    href: pageUrl(p.path),
  }));
  const fallback = siblings.find((p) => p.locale === DEFAULT_LOCALE);
  if (fallback)
    links.push({ hreflang: "x-default", href: pageUrl(fallback.path) });
  return links;
}
