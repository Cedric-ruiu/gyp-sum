<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { useContactAddress } from "@/composables/useContactAddress";

const { t } = useI18n();

const { address, href, trackContact } = useContactAddress();
const canCopy = ref(false);
const copied = ref(false);
let copiedTimer: ReturnType<typeof setTimeout> | undefined;

onMounted(() => {
  canCopy.value = !!navigator.clipboard;
});

onUnmounted(() => clearTimeout(copiedTimer));

// Both ways of reaching out count as one contact event, told apart by method.
function onMailtoClick() {
  trackContact("mailto");
}

// The mailto link does nothing without a configured mail app (common on
// desktop with webmail), so the address is shown and can be copied.
async function copyAddress() {
  if (!address.value) return;
  try {
    await navigator.clipboard.writeText(address.value);
    copied.value = true;
    trackContact("copy");
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
  <div class="flex flex-wrap items-center gap-x-4">
    <a
      :href="href"
      @click="onMailtoClick"
      class="inline-flex min-h-12 items-center gap-2 text-sm font-light text-muted hover:text-ink transition-colors duration-150 sm:min-h-8 sm:text-xs"
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
      class="inline-flex min-h-12 cursor-pointer items-center text-sm font-light text-muted underline decoration-line underline-offset-2 hover:text-ink hover:decoration-current transition-colors duration-150 sm:min-h-8 sm:text-xs"
      @click="copyAddress"
    >
      <span aria-live="polite">{{ copied ? t("footer.contactCopied") : t("footer.contactCopy") }}</span>
    </button>
  </div>
</template>
