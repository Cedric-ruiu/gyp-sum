<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";
import AppLogo from "@/components/ui/AppLogo.vue";
import LanguageSwitcher from "@/components/ui/LanguageSwitcher.vue";
import { pageFor } from "@/seo";

// `group`: the page group whose translations the language switcher offers
// (hidden when the page exists in a single language).
withDefaults(defineProps<{ group?: string }>(), { group: "calculator" });

const { t, locale } = useI18n();

const homePath = computed(() => pageFor("calculator", locale.value).path);
</script>

<template>
  <header class="border-b border-line py-1 sm:py-4">
    <!-- Phone: 48px row so the language button is a full touch target. -->
    <div class="mx-auto min-h-12 max-w-6xl px-6 sm:min-h-0 flex flex-wrap items-center justify-between gap-x-3 gap-y-3">
      <RouterLink :to="homePath" aria-label="GypSum">
        <AppLogo class="-ml-1.25 h-6 w-27 sm:h-7 sm:w-31.25" />
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
