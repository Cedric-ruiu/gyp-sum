<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t, tm, rt } = useI18n();

// Written by the author from his own practice; the section stays hidden
// until the paragraphs are filled in.
const paragraphs = computed(() => tm("author.paragraphs") as string[]);
</script>

<template>
  <section v-if="paragraphs.length" id="author" class="scroll-mt-6">
    <h2 class="mb-4 text-xs font-medium tracking-widest uppercase text-muted">
      {{ t("author.title") }}
    </h2>
    <div class="grid gap-3 text-sm font-light leading-relaxed text-muted">
      <p v-for="(para, i) in paragraphs" :key="i">{{ rt(para) }}</p>
    </div>
  </section>
</template>
