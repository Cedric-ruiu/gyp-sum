// Canonical public URLs and pre-rendered pages, shared by the SEO head, the
// sitemap, the language switcher and the share button.
export const SITE_URL = "https://cedric-ruiu.github.io/gyp-sum";
export const AUTHOR_URL = "https://cedric-ruiu.fr";
export const OG_IMAGE = `${SITE_URL}/og-image.png`;

// schema.org author, shared by every page's JSON-LD.
export const AUTHOR_SCHEMA = {
  "@type": "Person",
  name: "Cédric Ruiu",
  url: AUTHOR_URL,
  sameAs: ["https://github.com/Cedric-ruiu"],
};

export interface SitePage {
  // Route path, as declared in the router (relative to the `/gyp-sum/` base).
  path: string;
  locale: string;
  // Pages sharing a group are translations of each other (hreflang set).
  group: string;
  // Publication date (YYYY-MM-DD), for pages carrying an Article schema.
  published?: string;
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
  {
    path: "/es/",
    locale: "es",
    group: "calculator",
    lastModified: "2026-10-27",
  },
  {
    path: "/moule-en-platre/",
    locale: "fr",
    group: "moldGuide",
    published: "2026-10-27",
    lastModified: "2026-10-27",
  },
  {
    path: "/en/how-to-make-a-plaster-mold/",
    locale: "en",
    group: "moldGuide",
    published: "2026-10-27",
    lastModified: "2026-10-27",
  },
];

// Fallback locale when a page group has no version in the requested one.
const DEFAULT_LOCALE = "fr";
// Locale served as x-default (visitors whose language has no version): the
// English page reaches an international audience. Falls back to
// DEFAULT_LOCALE when the group has no English page.
const X_DEFAULT_LOCALE = "en";

// Per-locale values of the SEO head (html lang, JSON-LD, Open Graph).
export const LOCALE_META: Record<
  string,
  { inLanguage: string; ogLocale: string; currency: string }
> = {
  fr: { inLanguage: "fr-FR", ogLocale: "fr_FR", currency: "EUR" },
  en: { inLanguage: "en-US", ogLocale: "en_US", currency: "USD" },
  es: { inLanguage: "es", ogLocale: "es_ES", currency: "EUR" },
};

// Page of `group` in exactly `locale`, if it exists.
export function localePage(
  group: string,
  locale: string,
): SitePage | undefined {
  return SITE_PAGES.find((p) => p.group === group && p.locale === locale);
}

// Page of `group` in `locale`, falling back to the default locale's page.
export function pageFor(group: string, locale: string): SitePage {
  const pages = SITE_PAGES.filter((p) => p.group === group);
  const page =
    pages.find((p) => p.locale === locale) ??
    pages.find((p) => p.locale === DEFAULT_LOCALE);
  if (!page) throw new Error(`[seo] no page for group "${group}"`);
  return page;
}

export function pageUrl(path: string): string {
  return `${SITE_URL}${path}`;
}

export function findPage(path: string): SitePage | undefined {
  return SITE_PAGES.find((p) => p.path === path);
}

// Reciprocal hreflang set of a page, x-default last. Empty for a page that
// has no translation.
export function hreflangLinks(page: SitePage) {
  const siblings = SITE_PAGES.filter((p) => p.group === page.group);
  if (siblings.length < 2) return [];
  const links = siblings.map((p) => ({
    hreflang: p.locale,
    href: pageUrl(p.path),
  }));
  const fallback =
    siblings.find((p) => p.locale === X_DEFAULT_LOCALE) ??
    siblings.find((p) => p.locale === DEFAULT_LOCALE);
  if (fallback)
    links.push({ hreflang: "x-default", href: pageUrl(fallback.path) });
  return links;
}
