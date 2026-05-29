<script setup lang="ts">
import {
  computed,
  defineAsyncComponent,
  onMounted,
  onUnmounted,
  ref,
} from "vue";
import { useI18n } from "vue-i18n";
import MixParameters from "@/components/MixParameters.vue";
import MoldConfigurator from "@/components/MoldConfigurator.vue";
import ObjectConfigurator from "@/components/ObjectConfigurator.vue";
import ResultPanel from "@/components/ResultPanel.vue";

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

import { useCalculator } from "@/composables/useCalculator";
import { useLocalStorage } from "@/composables/useLocalStorage";
import type { MixParams, PersistedState } from "@/types";

const { t } = useI18n();

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

const mold = computed({
  get: () => state.value.mold,
  set: (v) => {
    state.value = { ...state.value, mold: v };
  },
});
const object = computed({
  get: () => state.value.object,
  set: (v) => {
    state.value = { ...state.value, object: v };
  },
});

const mix = computed<MixParams>({
  get: () => ({ ...state.value.mix, gypsumDensity: 2.58 }),
  set: (v) => {
    state.value = { ...state.value, mix: { ratio: v.ratio, margin: v.margin } };
  },
});

const result = useCalculator(mold, object, mix);
</script>

<template>
  <div class="min-h-full bg-white text-[color:var(--color-ink)]">
    <header class="border-b border-[color:var(--color-line)] py-4">
      <div class="mx-auto max-w-6xl px-6 flex items-center justify-between">
        <a href="." aria-label="GypSum">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 190 44" class="-ml-1.25 h-7 w-31.25" aria-hidden="true">
            <g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
              <path d="M4 10h30v30H4zM4 10l6-6h30l-6 6zM34 10l6-6M34 40l6-6M40 4v30"/>
            </g>
            <g stroke="#2563eb" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
              <path d="M4 27h30M34 27l6-6"/>
            </g>
            <text x="54" y="34" fill="currentColor" font-family="Inter, system-ui, sans-serif" font-size="36" font-weight="300" letter-spacing="-.5">GypSum</text>
          </svg>
        </a>
        <p class="text-xs font-light text-[color:var(--color-muted)] hidden sm:block">
          {{ t("app.subtitle") }}
        </p>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-6 py-8">
      <h1 class="mb-4 text-xs font-medium tracking-widest uppercase flex items-center">{{ t("intro.h1") }}</h1>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-8 items-start">
        <!-- Intro (left col, row 1) -->
        <div class="order-1 lg:order-0 lg:col-start-1 lg:row-start-1 max-w-2xl">
          <p class="text-sm font-light leading-relaxed text-muted">{{ t("intro.p1") }}</p>
          <p class="mt-3 text-sm font-light leading-relaxed text-muted">{{ t("intro.p2") }}</p>
          <p class="mt-3 text-sm font-light leading-relaxed text-muted">{{ t("intro.p3") }}</p>
        </div>

        <!-- Configurators (left col, row 2) -->
        <div class="order-2 lg:order-0 lg:col-start-1 lg:row-start-2 flex flex-col gap-4">
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
        <div class="order-4 lg:order-0 lg:col-start-1 lg:row-start-3">
          <h2 class="mb-4 text-xs font-medium tracking-widest uppercase text-muted">
            {{ t("guide.title") }}
          </h2>
          <div class="grid gap-3 text-sm font-light text-muted leading-relaxed">
            <p>{{ t("guide.ratioExplain") }}</p>
            <p>{{ t("guide.pourOrder") }}</p>
            <p>{{ t("guide.immersion") }}</p>
            <p class="font-mono text-xs text-ink">{{ t("guide.formula") }}</p>
          </div>
        </div>
      </div>
    </main>

    <footer class="border-t border-line">
      <div class="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row gap-8 justify-between">
        <div class="flex flex-col gap-2">
          <p class="text-xs font-light tracking-widest uppercase text-muted">GypSum</p>
          <p class="text-xs font-light text-muted leading-relaxed max-w-xs">{{ t("footer.tagline") }}</p>
          <p class="mt-1 text-xs font-light text-muted">
            {{ t("footer.createdBy") }} <span class="text-ink">Cédric Ruiu</span>.
          </p>
        </div>

        <div class="flex flex-col gap-3">
          <p class="text-xs font-light tracking-widest uppercase text-muted">{{ t("footer.contribute") }}</p>
          <a
            href="https://github.com/Cedric-ruiu/gyp-sum"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-2 text-xs font-light text-muted hover:text-ink transition-colors duration-150"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 shrink-0" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Cedric-ruiu/gyp-sum
          </a>
          <p class="text-xs font-light text-muted max-w-xs leading-relaxed">{{ t("footer.openSource") }}</p>
        </div>
      </div>
    </footer>
  </div>
</template>
