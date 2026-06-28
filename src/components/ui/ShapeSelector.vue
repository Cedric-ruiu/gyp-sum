<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { ShapeDefinition } from "@/shapes/types";

const props = defineProps<{
  shapes: ShapeDefinition[];
  modelValue: string;
  noneOption?: { value: string; labelKey: string };
  variant?: "accent" | "accent-soft";
}>();

const activeClass = computed(() =>
  props.variant === "accent-soft"
    ? "border-accent-soft text-accent-soft-strong"
    : "border-accent text-accent",
);

defineEmits<(e: "update:modelValue", v: string) => void>();

const { t } = useI18n();
</script>

<template>
  <div class="flex flex-wrap gap-2">
    <button
      v-if="noneOption"
      type="button"
      class="flex items-center gap-1.5 border px-2.5 py-1.5 text-[11px] font-light tracking-wide uppercase transition-colors duration-150 cursor-pointer"
      :class="
        modelValue === noneOption.value
          ? activeClass
          : 'border-line text-muted hover:text-ink'
      "
      @click="$emit('update:modelValue', noneOption.value)"
    >
      <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true" class="w-3.5 h-3.5 shrink-0">
        <line x1="4" y1="10" x2="16" y2="10"/>
      </svg>
      {{ t(noneOption.labelKey) }}
    </button>
    <button
      v-for="shape in shapes"
      :key="shape.type"
      type="button"
      class="flex items-center gap-1.5 border px-2.5 py-1.5 text-[11px] font-light tracking-wide uppercase transition-colors duration-150 cursor-pointer"
      :class="
        modelValue === shape.type
          ? activeClass
          : 'border-line text-muted hover:text-ink'
      "
      @click="$emit('update:modelValue', shape.type)"
    >
      <svg v-if="shape.icon === 'box'" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true" class="w-3.5 h-3.5 shrink-0">
        <rect x="3" y="7" width="10" height="9"/>
        <polygon points="3,7 7,3 17,3 13,7"/>
        <line x1="13" y1="7" x2="13" y2="16"/>
        <line x1="13" y1="16" x2="17" y2="12"/>
        <line x1="17" y1="3" x2="17" y2="12"/>
      </svg>
      <svg v-else-if="shape.icon === 'cylinder'" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true" class="w-3.5 h-3.5 shrink-0">
        <ellipse cx="10" cy="5" rx="7" ry="2.5"/>
        <line x1="3" y1="5" x2="3" y2="15"/>
        <line x1="17" y1="5" x2="17" y2="15"/>
        <ellipse cx="10" cy="15" rx="7" ry="2.5"/>
      </svg>
      <svg v-else-if="shape.icon === 'frustum'" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true" class="w-3.5 h-3.5 shrink-0">
        <ellipse cx="10" cy="5" rx="4" ry="1.5"/>
        <line x1="6" y1="5" x2="3" y2="15"/>
        <line x1="14" y1="5" x2="17" y2="15"/>
        <ellipse cx="10" cy="15" rx="7" ry="2.5"/>
      </svg>
      <svg v-else-if="shape.icon === 'sphere'" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true" class="w-3.5 h-3.5 shrink-0">
        <circle cx="10" cy="10" r="7"/>
        <ellipse cx="10" cy="10" rx="7" ry="3"/>
        <line x1="10" y1="3" x2="10" y2="17"/>
      </svg>
      <svg v-else-if="shape.icon === 'half-sphere'" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true" class="w-3.5 h-3.5 shrink-0">
        <path d="M3,11 A7,7 0 0,1 17,11"/>
        <ellipse cx="10" cy="11" rx="7" ry="2.5"/>
        <line x1="10" y1="4" x2="10" y2="11"/>
      </svg>
      <svg v-else-if="shape.icon === 'spherical-cap'" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1" aria-hidden="true" class="w-3.5 h-3.5 shrink-0">
        <path d="M3,13 A10,10 0 0,1 17,13"/>
        <ellipse cx="10" cy="13" rx="7" ry="2"/>
        <line x1="10" y1="8" x2="10" y2="13"/>
      </svg>
      <svg v-else-if="shape.icon === 'manual'" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1" stroke-dasharray="2,1.5" aria-hidden="true" class="w-3.5 h-3.5 shrink-0">
        <rect x="3" y="7" width="10" height="9"/>
        <polygon points="3,7 7,3 17,3 13,7"/>
        <line x1="13" y1="7" x2="13" y2="16"/>
        <line x1="13" y1="16" x2="17" y2="12"/>
        <line x1="17" y1="3" x2="17" y2="12"/>
      </svg>
      {{ t(shape.labelKey) }}
    </button>
  </div>
</template>
