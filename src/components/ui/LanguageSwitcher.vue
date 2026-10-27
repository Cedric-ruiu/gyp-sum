<script setup lang="ts">
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";
import { SUPPORTED_LOCALES } from "@/i18n";
import { localePage } from "@/seo";

const props = withDefaults(defineProps<{ group?: string }>(), {
  group: "calculator",
});

const { t, locale } = useI18n();

// Distinct indexable URLs, one route per locale: the translations of the
// current page group. RouterLink renders real <a href> (crawlable) and
// navigates client-side; the router guard swaps the locale. Order follows
// SUPPORTED_LOCALES.
const links = SUPPORTED_LOCALES.flatMap((code) => {
  const page = localePage(props.group, code);
  return page ? [{ code, to: page.path }] : [];
});
</script>

<template>
  <nav
    v-if="links.length > 1"
    :aria-label="t('lang.switcher')"
    class="inline-flex items-center overflow-hidden rounded border border-line text-xs font-light"
  >
    <RouterLink
      v-for="(link, i) in links"
      :key="link.code"
      :to="link.to"
      :hreflang="link.code"
      :aria-label="t(`lang.${link.code}`)"
      :aria-current="locale === link.code ? 'true' : undefined"
      class="px-2.5 py-1 uppercase tracking-wide transition-colors duration-150"
      :class="[
        i > 0 ? 'border-l border-line' : '',
        locale === link.code ? 'text-ink' : 'text-muted hover:text-ink',
      ]"
    >
      {{ link.code.toUpperCase() }}
    </RouterLink>
  </nav>
</template>
