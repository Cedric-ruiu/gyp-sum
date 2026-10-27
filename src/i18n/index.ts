import { createI18n } from "vue-i18n";
import de from "./locales/de.json";
import en from "./locales/en.json";
import es from "./locales/es.json";
import fr from "./locales/fr.json";
import it from "./locales/it.json";

export const SUPPORTED_LOCALES = ["fr", "en", "es", "de", "it"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

// Create a fresh i18n instance per app. During SSG, vite-ssg calls the app
// factory once per route; a shared singleton would leak the locale across
// pages (the global locale is mutated by the router guard).
export function createAppI18n() {
  return createI18n({
    legacy: false,
    locale: "fr",
    fallbackLocale: "fr",
    messages: { fr, en, es, de, it },
  });
}
