<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { EN_URL, FR_URL } from "@/seo";

const { t, locale } = useI18n();

// Rendered during pre-render so the footer keeps its final layout (no CLS).
// Hidden after mount only when neither the native share sheet nor the
// clipboard fallback is available.
const supported = ref(true);
const copied = ref(false);
// Desktop share sheets (macOS, Windows) offer few relevant targets, so the
// native sheet is reserved for touch devices; desktop just copies the link.
const useNativeShare = ref(false);
let copiedTimer: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  useNativeShare.value =
    typeof navigator.share === "function" &&
    window.matchMedia("(pointer: coarse)").matches;
  supported.value = useNativeShare.value || !!navigator.clipboard;
});

onUnmounted(() => clearTimeout(copiedTimer));

async function share() {
  const url = locale.value === "en" ? EN_URL : FR_URL;
  if (useNativeShare.value) {
    try {
      await navigator.share({
        title: "GypSum",
        text: t("meta.ogDescription"),
        url,
      });
    } catch {
      // User dismissed the share sheet: nothing to do.
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(url);
    copied.value = true;
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    // Clipboard permission denied: fail silently.
  }
}
</script>

<template>
  <button
    v-if="supported"
    type="button"
    class="inline-flex min-h-12 cursor-pointer items-center gap-2 text-left text-xs font-light text-muted hover:text-ink transition-colors duration-150 sm:min-h-0"
    @click="share"
  >
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0" aria-hidden="true">
      <circle cx="18" cy="5" r="2.5" />
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="19" r="2.5" />
      <path d="m8.2 10.8 7.6-4.4M8.2 13.2l7.6 4.4" />
    </svg>
    <span aria-live="polite">{{ copied ? t("footer.shareCopied") : t("footer.share") }}</span>
  </button>
</template>
