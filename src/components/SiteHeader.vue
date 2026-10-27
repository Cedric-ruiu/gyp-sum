<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher.vue";
import { pageFor } from "@/seo";

// `group`: the page group whose translations the language switcher offers
// (hidden when the page exists in a single language).
withDefaults(defineProps<{ group?: string }>(), { group: "calculator" });

const { t, locale } = useI18n();

const homePath = computed(() => pageFor("calculator", locale.value).path);
</script>

<template>
  <header class="border-b border-[color:var(--color-line)] py-4">
    <div class="mx-auto max-w-6xl px-6 flex flex-wrap items-center justify-between gap-x-3 gap-y-3">
      <RouterLink :to="homePath" aria-label="GypSum">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 190 44" class="-ml-1.25 h-6 w-27 sm:h-7 sm:w-31.25" aria-hidden="true">
          <g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
            <path d="M4 10h30v30H4zM4 10l6-6h30l-6 6zM34 10l6-6M34 40l6-6M40 4v30"/>
          </g>
          <g stroke="#2563eb" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
            <path d="M4 27h30M34 27l6-6"/>
          </g>
          <text x="54" y="34" fill="currentColor" font-family="Inter, system-ui, sans-serif" font-size="36" font-weight="300" letter-spacing="-.5">GypSum</text>
        </svg>
      </RouterLink>
      <div class="flex items-center gap-4">
        <p class="text-xs font-light text-muted hidden sm:block">
          {{ t("app.subtitle") }}
        </p>
        <LanguageSwitcher :group="group" />
      </div>
    </div>
  </header>
</template>
