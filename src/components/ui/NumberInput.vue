<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  modelValue: number | null;
  label?: string;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  invalid?: boolean;
  placeholder?: string;
}>();

const emit = defineEmits<(e: "update:modelValue", v: number) => void>();

const display = computed<string>(() =>
  props.modelValue === null || props.modelValue === undefined
    ? ""
    : String(props.modelValue),
);

function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(",", ".");
  if (raw === "") {
    emit("update:modelValue", 0);
    return;
  }
  const n = Number(raw);
  if (!Number.isNaN(n)) emit("update:modelValue", n);
}

const isInvalid = computed(() => {
  if (props.invalid) return true;
  const v = props.modelValue;
  if (v === null || v === undefined) return false;
  if (props.min !== undefined && v < props.min) return true;
  if (props.max !== undefined && v > props.max) return true;
  return false;
});
</script>

<template>
  <label class="flex flex-col gap-1">
    <span v-if="label" class="text-xs font-light text-[color:var(--color-muted)] uppercase tracking-wide">
      {{ label }}
    </span>
    <span
      class="relative flex items-center border bg-white transition-colors duration-150"
      :class="isInvalid ? 'border-[color:var(--color-danger)]' : 'border-[color:var(--color-line)] focus-within:border-[color:var(--color-accent)]'"
    >
      <input
        type="text"
        inputmode="decimal"
        :value="display"
        :placeholder="placeholder"
        class="w-full bg-transparent px-3 py-2 font-mono text-sm font-light tnum text-[color:var(--color-ink)] outline-none"
        @input="onInput"
      />
      <span
        v-if="unit"
        class="pr-3 text-xs font-light text-[color:var(--color-muted)] font-mono"
      >
        {{ unit }}
      </span>
    </span>
  </label>
</template>
