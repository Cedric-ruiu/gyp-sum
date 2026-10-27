<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { RouterLink } from "vue-router";
import { localePage } from "@/seo";

const { t, tm, rt, locale } = useI18n();

const moldGuidePage = computed(() => localePage("moldGuide", locale.value));

const steps = computed(
  () => tm("howto.steps") as { title: string; text: string }[],
);
</script>

<template>
  <section id="how-to" class="scroll-mt-6">
    <h2 class="mb-4 text-xs font-medium tracking-widest uppercase text-muted">
      {{ t("howto.title") }}
    </h2>
    <p class="mb-5 text-sm font-light leading-relaxed text-muted">
      {{ t("howto.intro") }}
    </p>
    <ol class="grid gap-4">
      <li v-for="(step, i) in steps" :key="i" class="flex gap-3">
        <span class="shrink-0 font-mono text-xs font-light text-accent">{{ i + 1 }}</span>
        <div>
          <p class="text-sm font-medium text-ink">{{ rt(step.title) }}</p>
          <p class="mt-1 text-sm font-light leading-relaxed text-muted">
            {{ rt(step.text) }}
          </p>
        </div>
      </li>
    </ol>
    <p v-if="moldGuidePage" class="mt-5 text-sm font-light leading-relaxed">
      <RouterLink
        :to="moldGuidePage.path"
        class="link"
      >{{ t("howto.moldGuideLink") }}</RouterLink>
    </p>
  </section>
</template>
