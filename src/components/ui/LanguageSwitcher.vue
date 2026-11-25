<script setup lang="ts">
import { onUnmounted, ref } from "vue";
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

// Phone menu: a native <details> (works without JS). The page component is
// reused across locales, so the menu is closed by hand on navigation, outside
// click and Escape.
const menu = ref<HTMLDetailsElement | null>(null);

function close() {
  if (menu.value) menu.value.open = false;
}

function onOutside(e: Event) {
  if (!menu.value?.contains(e.target as Node)) close();
}

function onKey(e: KeyboardEvent) {
  if (e.key !== "Escape") return;
  close();
  menu.value?.querySelector("summary")?.focus();
}

function onToggle() {
  if (menu.value?.open) {
    document.addEventListener("click", onOutside);
    document.addEventListener("keydown", onKey);
  } else {
    document.removeEventListener("click", onOutside);
    document.removeEventListener("keydown", onKey);
  }
}

onUnmounted(() => {
  document.removeEventListener("click", onOutside);
  document.removeEventListener("keydown", onKey);
});
</script>

<template>
  <template v-if="links.length > 1">
    <!-- Phone: one 48px button opening the list of translations. -->
    <details ref="menu" class="group relative sm:hidden" @toggle="onToggle">
      <summary
        :aria-label="t('lang.switcher')"
        class="-mr-3 flex min-h-12 min-w-12 cursor-pointer list-none items-center justify-center gap-1.5 px-3 text-xs font-light uppercase tracking-wide text-ink [&::-webkit-details-marker]:hidden"
      >
        {{ locale.toUpperCase() }}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5 text-muted transition-transform duration-150 group-open:rotate-180" aria-hidden="true">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <nav
        :aria-label="t('lang.switcher')"
        class="absolute right-0 top-full z-50 min-w-40 rounded border border-line bg-white py-1"
      >
        <RouterLink
          v-for="link in links"
          :key="link.code"
          :to="link.to"
          :hreflang="link.code"
          :lang="link.code"
          :aria-current="locale === link.code ? 'true' : undefined"
          class="flex min-h-12 items-center justify-between gap-4 px-4 text-sm font-light transition-colors duration-150"
          :class="locale === link.code ? 'text-ink' : 'text-muted hover:text-ink'"
          @click="close"
        >
          {{ t(`lang.${link.code}`) }}
          <span class="text-xs uppercase tracking-wide" aria-hidden="true">{{ link.code }}</span>
        </RouterLink>
      </nav>
    </details>

    <!-- Wider screens: the compact row of codes. -->
    <nav
      :aria-label="t('lang.switcher')"
      class="hidden items-center overflow-hidden rounded border border-line text-xs font-light sm:inline-flex"
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
</template>
