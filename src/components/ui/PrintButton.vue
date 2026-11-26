<script setup lang="ts">
import { useId } from "vue";
import { useI18n } from "vue-i18n";
import { printFromButton } from "@/composables/usePrint";

// Prints the workshop sheet (PrintSheet.vue), which the print styles swap in
// for the page. The `print` event is sent on `beforeprint` (useTrackPrints).
defineProps<{ disabled?: boolean }>();

const { t } = useI18n();
const hintId = useId();
</script>

<template>
  <div>
    <button
      type="button"
      :disabled="disabled"
      :aria-describedby="hintId"
      class="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded border border-accent bg-white px-4 text-sm font-normal text-accent transition-colors duration-150 enabled:hover:bg-accent enabled:hover:text-white disabled:cursor-not-allowed disabled:border-line disabled:text-muted sm:min-h-10"
      @click="printFromButton"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 shrink-0" aria-hidden="true">
        <path d="M6 9V3h12v6" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" rx="1" />
      </svg>
      {{ t("print.button") }}
    </button>
    <p :id="hintId" class="mt-2 text-center text-xs font-light text-muted">{{ t("print.hint") }}</p>
  </div>
</template>
