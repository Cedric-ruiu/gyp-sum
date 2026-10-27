// Umami custom events. The tracker script is loaded with `defer` from the
// stats host and may be missing (SSR, ad blocker, network error, or a domain
// outside `data-domains`), so every call is a guarded no-op in that case.

type EventData = Record<string, string | number | boolean>;

declare global {
  interface Window {
    umami?: { track: (name: string, data?: EventData) => void };
  }
}

export function track(name: string, data?: EventData): void {
  if (typeof window === "undefined") return;
  try {
    window.umami?.track(name, data);
  } catch {
    // Analytics must never break the page.
  }
}
