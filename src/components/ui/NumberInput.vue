<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    modelValue: number | null;
    label?: string;
    unit?: string;
    min?: number;
    max?: number;
    step?: number;
    invalid?: boolean;
    placeholder?: string;
  }>(),
  {
    step: 0.5,
  },
);

const emit = defineEmits<(e: "update:modelValue", v: number) => void>();

const display = computed<string>(() =>
  props.modelValue === null || props.modelValue === undefined
    ? ""
    : String(props.modelValue),
);

function clamp(v: number): number {
  if (props.min !== undefined && v < props.min) return props.min;
  if (props.max !== undefined && v > props.max) return props.max;
  return v;
}

function roundToStep(v: number): number {
  const decimals = (String(props.step).split(".")[1] || "").length;
  return Number(v.toFixed(decimals));
}

function onBeforeInput(e: InputEvent) {
  if (e.data === null) return;
  if (!/^[0-9.,]+$/.test(e.data)) e.preventDefault();
}

function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(",", ".");
  if (raw === "" || raw === ".") {
    emit("update:modelValue", 0);
    return;
  }
  const n = Number(raw);
  if (!Number.isNaN(n)) emit("update:modelValue", n);
}

function onBlur(e: Event) {
  const raw = (e.target as HTMLInputElement).value.replace(",", ".");
  const n = Number(raw);
  if (!Number.isNaN(n) && raw !== "") {
    emit("update:modelValue", clamp(Math.round(n * 10) / 10));
  }
}

function increment() {
  const cur = props.modelValue ?? 0;
  emit("update:modelValue", clamp(roundToStep(cur + props.step)));
}

function decrement() {
  const cur = props.modelValue ?? 0;
  emit("update:modelValue", clamp(roundToStep(cur - props.step)));
}

const canDecrement = computed(() => {
  const v = props.modelValue ?? 0;
  return props.min === undefined || v > props.min;
});

const canIncrement = computed(() => {
  const v = props.modelValue ?? 0;
  return props.max === undefined || v < props.max;
});

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
    <span v-if="label" class="text-xs font-light text-muted uppercase tracking-wide">
      {{ label }}
    </span>
    <span
      class="relative flex items-stretch border bg-white transition-colors duration-150"
      :class="isInvalid ? 'border-danger' : 'border-line focus-within:border-accent'"
    >
      <button
        type="button"
        aria-label="−"
        tabindex="-1"
        :disabled="!canDecrement"
        class="flex w-9 shrink-0 items-center justify-center border-r border-line text-base font-light text-muted transition-colors duration-150 hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        @click="decrement"
      >
        −
      </button>
      <input
        type="text"
        inputmode="decimal"
        :value="display"
        :placeholder="placeholder"
        class="w-full min-w-0 bg-transparent px-3 py-2 font-mono text-sm font-light tnum text-ink outline-none"
        @beforeinput="onBeforeInput"
        @input="onInput"
        @blur="onBlur"
        @keydown.up.prevent="increment"
        @keydown.down.prevent="decrement"
      />
      <span
        v-if="unit"
        class="flex shrink-0 items-center pr-2 font-mono text-xs font-light text-muted"
      >
        {{ unit }}
      </span>
      <button
        type="button"
        aria-label="+"
        tabindex="-1"
        :disabled="!canIncrement"
        class="flex w-9 shrink-0 items-center justify-center border-l border-line text-base font-light text-muted transition-colors duration-150 hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
        @click="increment"
      >
        +
      </button>
    </span>
  </label>
</template>
