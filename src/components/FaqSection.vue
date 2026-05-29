<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t, tm, rt } = useI18n();

const items = computed(() => tm("faq.items") as { q: string; a: string }[]);
</script>

<template>
  <section id="faq" class="scroll-mt-6">
    <h2 class="mb-4 text-xs font-medium tracking-widest uppercase text-muted">
      {{ t("faq.title") }}
    </h2>
    <div class="grid gap-2">
      <details
        v-for="(item, i) in items"
        :key="i"
        class="group rounded border border-line px-4 py-3"
      >
        <summary
          class="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-ink [&::-webkit-details-marker]:hidden"
        >
          {{ rt(item.q) }}
          <span
            class="shrink-0 font-mono text-xs font-light text-muted transition-transform duration-150 group-open:rotate-45"
            aria-hidden="true"
          >
            +
          </span>
        </summary>
        <p class="mt-2 text-sm font-light leading-relaxed text-muted">
          {{ rt(item.a) }}
        </p>
      </details>
    </div>
  </section>
</template>
