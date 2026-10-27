<script setup lang="ts">
defineProps<{
  label: string;
  options: { value: string; label: string }[];
  modelValue: string;
}>();

defineEmits<(e: "update:modelValue", v: string) => void>();
</script>

<template>
  <div class="flex flex-wrap items-center gap-2" role="group" :aria-label="label">
    <span class="text-xs font-light text-muted uppercase tracking-wide">{{ label }}</span>
    <div class="flex">
      <button
        v-for="(opt, i) in options"
        :key="opt.value"
        type="button"
        :aria-pressed="modelValue === opt.value"
        class="min-h-12 cursor-pointer border px-3 text-xs font-light transition-colors duration-150 sm:min-h-0 sm:py-1.5"
        :class="[
          modelValue === opt.value
            ? 'relative z-10 border-accent text-accent'
            : 'border-line text-muted hover:text-ink',
          i > 0 ? '-ml-px' : '',
        ]"
        @click="$emit('update:modelValue', opt.value)"
      >
        {{ opt.label }}
      </button>
    </div>
  </div>
</template>
