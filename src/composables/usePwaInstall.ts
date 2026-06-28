import { computed, onMounted, ref } from "vue";

// PWA install + offline orchestration. Mobile-only by design: the service
// worker is registered only on phones/tablets, so desktop has no install
// affordance at all. iOS has no programmatic install, so it gets an
// instructional banner instead of a button.

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "pwa-install-dismissed";
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // re-offer after ~30 days

// Module-scoped shared state: every caller (banner + footer link) reads the
// same flags, and the beforeinstallprompt event is captured even if it fires
// before any component has mounted. All guarded for the vite-ssg server render.
const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
const isIosSafari = ref(false);
const isInstalled = ref(false);
const isMobileDevice = ref(false);
const dismissed = ref(false);
const ready = ref(false);

let initialized = false;

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt.value = e as BeforeInstallPromptEvent;
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt.value = null;
    isInstalled.value = true;
  });
}

function isMobile(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ reports a desktop UA but exposes touch points.
  const iPadOS = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return /Android|iPhone|iPad|iPod/i.test(ua) || iPadOS;
}

function detectIosSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS =
    /iPhone|iPad|iPod/i.test(ua) ||
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  // Only Safari can add to the home screen on iOS — exclude other iOS browsers.
  const isSafari = !/CriOS|FxiOS|EdgiOS|OPiOS|mercury/i.test(ua);
  return iOS && isSafari;
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function readDismissed(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

function init(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;

  isMobileDevice.value = isMobile();
  isIosSafari.value = detectIosSafari();
  isInstalled.value = isStandalone();
  dismissed.value = readDismissed();
  ready.value = true;

  // Register the service worker on mobile only — desktop is intentionally
  // excluded (no SW => no install prompt, no omnibox install icon).
  if (isMobileDevice.value && "serviceWorker" in navigator) {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .catch(() => {
        // Offline support is best-effort; ignore registration failures.
      });
  }
}

export function usePwaInstall() {
  onMounted(init);

  const deferredAvailable = computed(() => deferredPrompt.value !== null);

  // The banner shows on mobile when not installed, not dismissed, and we have
  // either an Android prompt to fire or an iOS Safari session to instruct.
  const showBanner = computed(
    () =>
      ready.value &&
      isMobileDevice.value &&
      !isInstalled.value &&
      !dismissed.value &&
      (deferredAvailable.value || isIosSafari.value),
  );

  // The footer link is the way back after dismissing the banner.
  const showFooterLink = computed(
    () => ready.value && isMobileDevice.value && !isInstalled.value,
  );

  async function promptInstall(): Promise<void> {
    const evt = deferredPrompt.value;
    if (!evt) return;
    await evt.prompt();
    await evt.userChoice;
    deferredPrompt.value = null;
  }

  function dismiss(): void {
    dismissed.value = true;
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // ignore quota / access errors
    }
  }

  function reopen(): void {
    dismissed.value = false;
    try {
      localStorage.removeItem(DISMISS_KEY);
    } catch {
      // ignore access errors
    }
  }

  // Footer entry point: fire the native Android prompt directly when held,
  // otherwise re-show the banner (iOS instructions / wait for the event).
  async function triggerInstall(): Promise<void> {
    if (deferredPrompt.value) {
      await promptInstall();
    } else {
      reopen();
    }
  }

  return {
    showBanner,
    showFooterLink,
    isIosSafari,
    deferredAvailable,
    promptInstall,
    dismiss,
    triggerInstall,
  };
}
