import { createI18n } from "vue-i18n";
import en from "./locales/en.json";
import fr from "./locales/fr.json";

export const SUPPORTED_LOCALES = ["fr", "en"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

// Create a fresh i18n instance per app. During SSG, vite-ssg calls the app
// factory once per route; a shared singleton would leak the locale across
// pages (the global locale is mutated by the router guard).
export function createAppI18n() {
  return createI18n({
    legacy: false,
    locale: "fr",
    fallbackLocale: "fr",
    messages: { fr, en },
  });
}
