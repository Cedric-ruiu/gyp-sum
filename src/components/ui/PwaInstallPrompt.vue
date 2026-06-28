<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { usePwaInstall } from "@/composables/usePwaInstall";

const { t } = useI18n();
const { showBanner, deferredAvailable, promptInstall, dismiss } =
  usePwaInstall();
</script>

<template>
  <Transition
    enter-active-class="transition-transform duration-200"
    enter-from-class="translate-y-full"
    leave-active-class="transition-transform duration-200"
    leave-to-class="translate-y-full"
  >
    <div
      v-if="showBanner"
      role="dialog"
      :aria-label="t('pwa.title')"
      class="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white"
    >
      <div class="mx-auto max-w-6xl px-6 py-3 flex items-center gap-3">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="hidden sm:block h-6 w-6 shrink-0 text-accent"
          aria-hidden="true"
        >
          <rect x="6" y="2" width="12" height="20" rx="2" />
          <path d="M12 18h.01" />
        </svg>

        <div class="min-w-0 flex-1">
          <p class="text-sm font-medium text-ink">{{ t("pwa.title") }}</p>
          <p class="mt-0.5 text-xs font-light text-muted leading-snug">
            <template v-if="deferredAvailable">{{ t("pwa.body") }}</template>
            <span v-else class="inline-flex items-center gap-1">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round"
                class="h-3.5 w-3.5 shrink-0"
                aria-hidden="true"
              >
                <path d="M12 16V4M8 8l4-4 4 4M5 14v5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5" />
              </svg>
              {{ t("pwa.iosInstruction") }}
            </span>
          </p>
        </div>

        <button
          v-if="deferredAvailable"
          type="button"
          class="shrink-0 rounded border border-accent px-3 py-1.5 text-xs font-medium text-accent transition-colors duration-150 hover:bg-accent hover:text-white"
          @click="promptInstall"
        >
          {{ t("pwa.installButton") }}
        </button>

        <button
          type="button"
          :aria-label="t('pwa.dismissLabel')"
          class="shrink-0 rounded p-1 text-muted transition-colors duration-150 hover:text-ink"
          @click="dismiss"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>
    </div>
  </Transition>
</template>
