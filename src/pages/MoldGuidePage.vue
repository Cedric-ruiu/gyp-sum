<script setup lang="ts">
import { useHead } from "@unhead/vue";
import { computed } from "vue";
import { I18nT, useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";
import SiteFooter from "@/components/SiteFooter.vue";
import SiteHeader from "@/components/SiteHeader.vue";
import {
  AUTHOR_SCHEMA,
  hreflangLinks,
  LOCALE_META,
  OG_IMAGE,
  pageFor,
  pageUrl,
} from "@/seo";

interface GuideSection {
  id: string;
  title: string;
  paragraphs?: string[];
  steps?: string[];
  list?: string[];
  example?: string;
  note?: string;
  table?: { caption: string; cols: string[]; rows: string[][] };
}

const { t, tm, rt, locale } = useI18n();

const sections = computed(() => tm("moldGuide.sections") as GuideSection[]);
const calculatorPath = computed(() => pageFor("calculator", locale.value).path);

// SEO head, pre-rendered by vite-ssg. The Article schema is built from the
// same i18n keys as the visible copy.
useHead(() => {
  const page = pageFor("moldGuide", locale.value);
  const localeMeta = LOCALE_META[page.locale];
  const canonical = pageUrl(page.path);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: t("moldGuide.h1"),
    description: t("moldGuide.meta.description"),
    inLanguage: localeMeta.inLanguage,
    image: OG_IMAGE,
    author: AUTHOR_SCHEMA,
    datePublished: page.published,
    dateModified: page.lastModified,
    mainEntityOfPage: canonical,
  };

  return {
    htmlAttrs: { lang: page.locale },
    title: t("moldGuide.meta.title"),
    meta: [
      { name: "description", content: t("moldGuide.meta.description") },
      { property: "og:type", content: "article" },
      { property: "og:site_name", content: "GypSum" },
      { property: "og:locale", content: localeMeta.ogLocale },
      { property: "og:title", content: t("moldGuide.meta.ogTitle") },
      {
        property: "og:description",
        content: t("moldGuide.meta.ogDescription"),
      },
      { property: "og:url", content: canonical },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: t("moldGuide.meta.ogTitle") },
      {
        name: "twitter:description",
        content: t("moldGuide.meta.ogDescription"),
      },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    link: [
      { rel: "canonical", href: canonical },
      ...hreflangLinks(page).map((l) => ({ rel: "alternate", ...l })),
    ],
    script: [
      { type: "application/ld+json", innerHTML: JSON.stringify(articleSchema) },
    ],
  };
});
</script>

<template>
  <div class="min-h-full bg-white text-[color:var(--color-ink)]">
    <SiteHeader group="moldGuide" />

    <main class="mx-auto max-w-2xl px-6 py-8">
      <article>
        <h1 class="mb-4 text-2xl font-light leading-tight tracking-tight text-ink sm:text-3xl">{{ t("moldGuide.h1") }}</h1>
        <p class="text-base font-light leading-relaxed text-muted">{{ t("moldGuide.lead") }}</p>

        <nav class="mt-6 border-y border-line py-4 text-sm font-light text-muted">
          <p class="mb-2 text-xs uppercase tracking-widest">{{ t("moldGuide.tocLabel") }}</p>
          <ol class="grid gap-1">
            <li v-for="section in sections" :key="rt(section.id)">
              <a
                :href="`#${rt(section.id)}`"
                class="link inline-flex min-h-12 items-center sm:min-h-0"
              >{{ rt(section.title) }}</a>
            </li>
          </ol>
        </nav>

        <section
          v-for="(section, i) in sections"
          :id="rt(section.id)"
          :key="rt(section.id)"
          class="mt-10 scroll-mt-6"
        >
          <h2 class="mb-4 text-lg font-normal leading-snug text-ink">{{ rt(section.title) }}</h2>
          <div class="grid gap-4 text-base font-light leading-relaxed text-muted">
            <p v-for="(para, j) in section.paragraphs ?? []" :key="`p${j}`">{{ rt(para) }}</p>

            <ol v-if="section.steps" class="grid gap-3">
              <li v-for="(_, j) in section.steps" :key="`s${j}`" class="flex gap-3">
                <span class="shrink-0 pt-0.5 font-mono text-sm font-light text-accent">{{ j + 1 }}</span>
                <!-- I18nT so a step can embed the {calculator} link -->
                <I18nT :keypath="`moldGuide.sections.${i}.steps.${j}`" tag="span">
                  <template #calculator>
                    <RouterLink
                      :to="calculatorPath"
                      class="link"
                    >{{ t("moldGuide.calculatorCta") }}</RouterLink>
                  </template>
                </I18nT>
              </li>
            </ol>

            <ul v-if="section.list" class="grid list-disc gap-2 pl-5">
              <li v-for="(item, j) in section.list" :key="`l${j}`">{{ rt(item) }}</li>
            </ul>

            <div v-if="section.table" class="overflow-x-auto">
              <table class="w-full border-collapse text-sm">
                <caption class="mb-1 text-left text-sm font-medium text-ink">
                  {{ rt(section.table.caption) }}
                </caption>
                <thead>
                  <tr class="border-b border-line text-left text-ink">
                    <th
                      v-for="(col, j) in section.table.cols"
                      :key="j"
                      scope="col"
                      class="py-2 pr-3 font-medium last:pr-0"
                    >{{ rt(col) }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="(row, j) in section.table.rows"
                    :key="j"
                    class="border-b border-line align-top last:border-0"
                  >
                    <td
                      v-for="(cell, k) in row"
                      :key="k"
                      class="py-2 pr-3 last:pr-0"
                      :class="k === 0 ? 'text-ink' : ''"
                    >{{ rt(cell) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p v-if="section.example" class="rounded border border-line bg-surface p-4">{{ rt(section.example) }}</p>

            <p v-if="section.note" class="border-l-2 border-accent-soft pl-3 text-ink">{{ rt(section.note) }}</p>
          </div>
        </section>

        <p class="mt-12">
          <RouterLink
            :to="calculatorPath"
            class="inline-flex min-h-12 items-center rounded border border-line px-4 text-sm font-normal text-ink hover:border-ink transition-colors duration-150"
          >{{ t("moldGuide.backToCalculator") }} →</RouterLink>
        </p>
      </article>
    </main>

    <SiteFooter />
  </div>
</template>
