<script setup lang="ts">
import { useHead } from "@unhead/vue";
import {
  computed,
  defineAsyncComponent,
  onMounted,
  onUnmounted,
  ref,
} from "vue";
import { useI18n } from "vue-i18n";
import AuthorNote from "@/components/AuthorNote.vue";
import FaqSection from "@/components/FaqSection.vue";
import HowToGuide from "@/components/HowToGuide.vue";
import MixParameters from "@/components/MixParameters.vue";
import MoldConfigurator from "@/components/MoldConfigurator.vue";
import ObjectConfigurator from "@/components/ObjectConfigurator.vue";
import ResultPanel from "@/components/ResultPanel.vue";
import SiteFooter from "@/components/SiteFooter.vue";
import SiteHeader from "@/components/SiteHeader.vue";
import PwaInstallPrompt from "@/components/ui/PwaInstallPrompt.vue";
import SegmentedControl from "@/components/ui/SegmentedControl.vue";

const SceneViewer = defineAsyncComponent(
  () => import("@/components/SceneViewer.vue"),
);

const sceneSlot = ref<HTMLElement | null>(null);
const sceneVisible = ref(false);
let sceneObserver: IntersectionObserver | null = null;

onMounted(() => {
  if (!sceneSlot.value) return;
  sceneObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        sceneVisible.value = true;
        sceneObserver?.disconnect();
        sceneObserver = null;
      }
    },
    { rootMargin: "200px" },
  );
  sceneObserver.observe(sceneSlot.value);
});

onUnmounted(() => {
  sceneObserver?.disconnect();
  sceneObserver = null;
});

import { track } from "@/analytics";
import { useCalculator } from "@/composables/useCalculator";
import { useLocalStorage } from "@/composables/useLocalStorage";
import { markEngaged } from "@/composables/usePwaInstall";
import {
  AUTHOR_URL,
  hreflangLinks,
  LOCALE_META,
  pageFor,
  pageUrl,
  SITE_PAGES,
  SITE_URL,
} from "@/seo";
import type {
  MixParams,
  PersistedState,
  RatioMode,
  UnitPrefs,
  UnitSystem,
} from "@/types";
import { provideUnits } from "@/units";

const { t, tm, rt, locale } = useI18n();

const yourPlasterParagraphs = computed(
  () => tm("yourPlaster.paragraphs") as string[],
);
const ratioValueCols = computed(
  () => tm("guide.ratioTable.valueCols") as string[],
);
const ratioRows = computed(
  () =>
    tm("guide.ratioTable.rows") as {
      ratio: string;
      result: string;
      use: string;
      values: string[];
    }[],
);

// Per-locale SEO head. Pre-rendered by vite-ssg into each route's HTML and
// reactive on the client when the locale switches. JSON-LD is built from the
// same i18n data shown on the page, so schema always matches the visible copy.
const OG_IMAGE = `${SITE_URL}/og-image.png`;

useHead(() => {
  const page = pageFor("calculator", locale.value);
  const localeMeta = LOCALE_META[page.locale];
  const canonical = pageUrl(page.path);
  const inLanguage = localeMeta.inLanguage;
  const alternateOgLocales = SITE_PAGES.filter(
    (p) => p.group === page.group && p.locale !== page.locale,
  ).map((p) => LOCALE_META[p.locale].ogLocale);

  const appSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "GypSum",
    description: t("meta.schemaApp"),
    keywords: t("meta.keywords"),
    url: canonical,
    applicationCategory: "UtilityApplication",
    operatingSystem: "Any",
    inLanguage,
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: localeMeta.currency,
    },
    author: {
      "@type": "Person",
      name: "Cédric Ruiu",
      url: AUTHOR_URL,
      sameAs: ["https://github.com/Cedric-ruiu"],
    },
    dateModified: page.lastModified,
  };

  const howToSchema = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: t("howto.title"),
    description: t("howto.intro"),
    inLanguage,
    step: (tm("howto.steps") as { title: string; text: string }[]).map(
      (s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: rt(s.title),
        text: rt(s.text),
      }),
    ),
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage,
    mainEntity: (tm("faq.items") as { q: string; a: string }[]).map((it) => ({
      "@type": "Question",
      name: rt(it.q),
      acceptedAnswer: { "@type": "Answer", text: rt(it.a) },
    })),
  };

  return {
    htmlAttrs: { lang: page.locale },
    title: t("meta.title"),
    meta: [
      { name: "description", content: t("meta.description") },
      { name: "keywords", content: t("meta.keywords") },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "GypSum" },
      { property: "og:locale", content: localeMeta.ogLocale },
      ...alternateOgLocales.map((content) => ({
        property: "og:locale:alternate",
        content,
      })),
      { property: "og:title", content: t("meta.ogTitle") },
      { property: "og:description", content: t("meta.ogDescription") },
      { property: "og:url", content: canonical },
      { property: "og:image", content: OG_IMAGE },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: t("meta.ogTitle") },
      { name: "twitter:description", content: t("meta.twitterDescription") },
      { name: "twitter:image", content: OG_IMAGE },
    ],
    link: [
      { rel: "canonical", href: canonical },
      ...hreflangLinks(page).map((l) => ({ rel: "alternate", ...l })),
    ],
    script: [
      { type: "application/ld+json", innerHTML: JSON.stringify(appSchema) },
      { type: "application/ld+json", innerHTML: JSON.stringify(howToSchema) },
      { type: "application/ld+json", innerHTML: JSON.stringify(faqSchema) },
    ],
  };
});

const defaults: PersistedState = {
  mold: {
    shape: "box",
    dimensions: { length: 18, width: 17, height: 10 },
  },
  object: {
    shape: "none",
    dimensions: null,
    manualVolume: null,
  },
  mix: {
    ratio: 1.5,
    margin: 0.1,
  },
};

const state = useLocalStorage<PersistedState>("plaster-calc-state", defaults);

// Every visitor edit goes through these setters; the localStorage restore
// writes `state` directly, so it is never counted as a use. One event per
// page load, on the first value that actually changes (a blur re-emits the
// same value).
let calculatorUseTracked = false;
function updateState(patch: Partial<PersistedState>) {
  const next = { ...state.value, ...patch };
  if (
    !calculatorUseTracked &&
    JSON.stringify(next) !== JSON.stringify(state.value)
  ) {
    calculatorUseTracked = true;
    track("calculator-use", { lang: locale.value });
    markEngaged();
  }
  state.value = next;
}

const mold = computed({
  get: () => state.value.mold,
  set: (v) => updateState({ mold: v }),
});
const object = computed({
  get: () => state.value.object,
  set: (v) => updateState({ object: v }),
});

const mix = computed<MixParams>({
  get: () => ({ ...state.value.mix, gypsumDensity: 2.58 }),
  set: (v) => updateState({ mix: { ratio: v.ratio, margin: v.margin } }),
});

const result = useCalculator(mold, object, mix);

// Unit preferences are display-only and stored apart from the calculator
// state: switching units is not a calculator use. The French page is always
// metric; the stored choice applies to the English page only.
const unitPrefs = useLocalStorage<UnitPrefs>("plaster-calc-units", {
  system: "metric",
  ratioMode: "ratio",
});
const unitsSwitchable = computed(() => locale.value === "en");
const unitSystem = computed<UnitSystem>(() =>
  unitsSwitchable.value && unitPrefs.value.system === "us" ? "us" : "metric",
);
const ratioMode = computed<RatioMode>(() =>
  unitsSwitchable.value && unitPrefs.value.ratioMode === "consistency"
    ? "consistency"
    : "ratio",
);
provideUnits({
  system: unitSystem,
  ratioMode,
  switchable: unitsSwitchable,
  setRatioMode: (mode) => {
    unitPrefs.value = { ...unitPrefs.value, ratioMode: mode };
  },
});

const unitOptions = computed(() => [
  { value: "metric", label: t("unitSystem.metric") },
  { value: "us", label: t("unitSystem.us") },
]);
function setUnitSystem(v: string) {
  unitPrefs.value = { ...unitPrefs.value, system: v as UnitSystem };
}
</script>

<template>
  <div class="min-h-full bg-white text-[color:var(--color-ink)]">
    <SiteHeader />

    <main class="mx-auto max-w-6xl px-6 py-8">
      <h1 class="mb-4 text-2xl font-light leading-tight tracking-tight text-ink sm:text-3xl">{{ t("intro.h1") }}</h1>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-8 items-start">
        <!-- Intro (left col, row 1) -->
        <div class="order-1 lg:order-0 lg:col-start-1 lg:row-start-1 max-w-2xl">
          <p class="text-base font-light leading-relaxed text-muted">{{ t("intro.lead") }}</p>
          <nav class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-light text-muted">
            <span class="uppercase tracking-widest">{{ t("toc.label") }}</span>
            <a href="#guide" class="hover:text-ink transition-colors duration-150">{{ t("toc.guide") }}</a>
            <a href="#your-plaster" class="hover:text-ink transition-colors duration-150">{{ t("toc.yourPlaster") }}</a>
            <a href="#how-to" class="hover:text-ink transition-colors duration-150">{{ t("toc.howto") }}</a>
            <a href="#faq" class="hover:text-ink transition-colors duration-150">{{ t("toc.faq") }}</a>
          </nav>
        </div>

        <!-- Configurators (left col, row 2) -->
        <div class="order-2 lg:order-0 lg:col-start-1 lg:row-start-2 flex flex-col gap-4">
          <SegmentedControl
            v-if="unitsSwitchable"
            :label="t('unitSystem.label')"
            :options="unitOptions"
            :model-value="unitSystem"
            @update:model-value="setUnitSystem"
          />
          <MoldConfigurator v-model="mold" :object-config="object" />
          <ObjectConfigurator v-model="object" />
          <MixParameters v-model="mix" />
        </div>

        <!-- Results + 3D scene (right col, sticky, spans all rows).
             On mobile: order 3 — between configurators and guide for quick access. -->
        <div
          class="order-3 lg:order-0 lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:self-start lg:sticky lg:top-6"
        >
          <ResultPanel :result="result">
            <template #scene>
              <div
                ref="sceneSlot"
                class="w-full bg-surface"
                style="aspect-ratio: 4 / 3"
              >
                <SceneViewer
                  v-if="sceneVisible"
                  :mold-config="mold"
                  :object-config="object"
                />
              </div>
            </template>
          </ResultPanel>
        </div>

        <!-- Guide (left col, row 3) -->
        <div id="guide" class="order-4 lg:order-0 lg:col-start-1 lg:row-start-3 scroll-mt-6">
          <h2 class="mb-4 text-xs font-medium tracking-widest uppercase text-muted">
            {{ t("guide.title") }}
          </h2>
          <div class="grid gap-3 text-sm font-light text-muted leading-relaxed">
            <p>{{ t("guide.answer") }}</p>
            <div class="overflow-x-auto">
            <table class="w-full border-collapse text-xs">
              <caption class="mb-1 text-left text-xs font-medium text-ink">
                {{ t("guide.ratioTable.caption") }}
              </caption>
              <thead>
                <tr class="border-b border-line text-left text-ink">
                  <th scope="col" class="py-1.5 pr-3 font-medium">{{ t("guide.ratioTable.colRatio") }}</th>
                  <th scope="col" class="py-1.5 pr-3 font-medium">{{ t("guide.ratioTable.colResult") }}</th>
                  <th scope="col" class="py-1.5 pr-3 font-medium">{{ t("guide.ratioTable.colUse") }}</th>
                  <th
                    v-for="(col, j) in ratioValueCols"
                    :key="j"
                    scope="col"
                    class="py-1.5 pr-3 font-medium last:pr-0"
                  >{{ rt(col) }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, i) in ratioRows" :key="i" class="border-b border-line last:border-0">
                  <td class="py-1.5 pr-3 font-mono text-ink">{{ rt(row.ratio) }}</td>
                  <td class="py-1.5 pr-3">{{ rt(row.result) }}</td>
                  <td class="py-1.5 pr-3">{{ rt(row.use) }}</td>
                  <td
                    v-for="(value, j) in row.values"
                    :key="j"
                    class="py-1.5 pr-3 font-mono whitespace-nowrap last:pr-0"
                  >{{ rt(value) }}</td>
                </tr>
              </tbody>
            </table>
            </div>
            <p>{{ t("guide.pourOrder") }}</p>
            <p>{{ t("guide.immersion") }}</p>
            <p>{{ t("guide.physics") }}</p>
            <p class="font-mono text-xs text-ink">{{ t("guide.formula") }}</p>
          </div>

          <section id="your-plaster" class="mt-10 scroll-mt-6">
            <h2 class="mb-4 text-xs font-medium tracking-widest uppercase text-muted">
              {{ t("yourPlaster.title") }}
            </h2>
            <div class="grid gap-3 text-sm font-light text-muted leading-relaxed">
              <p v-for="(para, i) in yourPlasterParagraphs" :key="i">{{ rt(para) }}</p>
            </div>
          </section>
        </div>
      </div>

      <div class="mt-12 grid max-w-2xl gap-12">
        <HowToGuide />
        <AuthorNote />
        <FaqSection />
      </div>
    </main>

    <SiteFooter />

    <PwaInstallPrompt />
  </div>
</template>
