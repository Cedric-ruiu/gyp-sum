<script setup lang="ts">
import { ref } from "vue";

defineProps<{ text: string }>();

const open = ref(false);
</script>

<template>
  <span class="relative inline-flex items-center">
    <button
      type="button"
      class="ml-1 inline-flex h-4 w-4 items-center justify-center border border-line text-[10px] font-light normal-case tracking-normal text-muted hover:text-ink hover:border-ink transition-colors cursor-pointer"
      @mouseenter="open = true"
      @mouseleave="open = false"
      @focus="open = true"
      @blur="open = false"
      aria-label="info"
    >
      ?
    </button>
    <span
      v-if="open"
      class="absolute left-6 top-1/2 z-10 -translate-y-1/2 w-64 border border-line bg-white p-2 text-xs font-light normal-case tracking-normal text-ink"
    >
      {{ text }}
    </span>
  </span>
</template>
