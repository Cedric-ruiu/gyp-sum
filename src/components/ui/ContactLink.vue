<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

// Anti-harvesting: the address never appears in clear text, neither in the
// pre-rendered HTML nor in the JS bundle. It is decoded only after mount, so
// the server render and the first client render stay identical (no
// hydration mismatch) and scrapers reading the static HTML get nothing.
const ENCODED_ADDRESS = "Y29udGFjdEBjZWRyaWMtcnVpdS5mcg==";

const address = ref<string | null>(null);
const canCopy = ref(false);
const copied = ref(false);
let copiedTimer: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  address.value = atob(ENCODED_ADDRESS);
  canCopy.value = !!navigator.clipboard;
});

onUnmounted(() => clearTimeout(copiedTimer));

const href = computed(() =>
  address.value
    ? `mailto:${address.value}?subject=${encodeURIComponent(t("footer.contactSubject"))}`
    : undefined,
);

// The mailto link does nothing without a configured mail app (common on
// desktop with webmail), so the address is shown and can be copied.
async function copyAddress() {
  if (!address.value) return;
  try {
    await navigator.clipboard.writeText(address.value);
    copied.value = true;
    clearTimeout(copiedTimer);
    copiedTimer = setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    // Clipboard permission denied: the address stays visible anyway.
  }
}
</script>

<template>
  <div class="flex flex-wrap items-center gap-x-3">
    <a
      :href="href"
      class="inline-flex min-h-12 items-center gap-2 text-xs font-light text-muted hover:text-ink transition-colors duration-150 sm:min-h-0"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="1" />
        <path d="m3 7 9 6 9-6" />
      </svg>
      {{ address ?? t("footer.contactCta") }}
    </a>
    <button
      v-if="canCopy"
      type="button"
      class="inline-flex min-h-12 cursor-pointer items-center text-xs font-light text-muted underline decoration-line underline-offset-2 hover:text-ink hover:decoration-current transition-colors duration-150 sm:min-h-0"
      @click="copyAddress"
    >
      <span aria-live="polite">{{ copied ? t("footer.contactCopied") : t("footer.contactCopy") }}</span>
    </button>
  </div>
</template>
