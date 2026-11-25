<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { CalculationResult } from "@/types";
import { useUnits } from "@/units";

// Phone reminder of the results while the inputs are being filled in. Shown
// only while the results panel (`target`) sits below the viewport; once it is
// on screen or scrolled past, the bar would only repeat it.
const props = defineProps<{
  result: CalculationResult;
  target: HTMLElement | null;
}>();

const { t, n } = useI18n();
const units = useUnits();

const visible = ref(false);
// Space kept below the panel's top edge: it counts as seen once its totals
// clear the bar.
const SEEN_INSET = 160;
let frame = 0;

function fmt(v: number): string {
  return n(v, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

// Scroll position rather than IntersectionObserver: a jump straight from below
// the panel to above it (anchor link, scroll to top) crosses no threshold and
// would leave the bar in its old state.
function update() {
  frame = 0;
  const el = props.target;
  visible.value =
    !!el && el.getBoundingClientRect().top > window.innerHeight - SEEN_INSET;
}

function schedule() {
  if (!frame) frame = requestAnimationFrame(update);
}

onMounted(() => {
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule, { passive: true });
  update();
});
// Inputs can resize the form above the panel without any scroll.
watch([() => props.target, () => props.result], schedule);
onUnmounted(() => {
  window.removeEventListener("scroll", schedule);
  window.removeEventListener("resize", schedule);
  cancelAnimationFrame(frame);
});

function showResults() {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  props.target?.scrollIntoView({
    behavior: reduce ? "auto" : "smooth",
    block: "start",
  });
}
</script>

<template>
  <Transition
    enter-active-class="transition-transform duration-200"
    enter-from-class="translate-y-full"
    leave-active-class="transition-transform duration-200"
    leave-to-class="translate-y-full"
  >
    <button
      v-if="visible"
      type="button"
      class="flex min-h-14 w-full cursor-pointer items-center gap-4 border-t border-line bg-surface px-6 py-2 text-left lg:hidden"
      @click="showResults"
    >
      <template v-if="result.isValid">
        <span class="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-5 gap-y-0.5">
          <span class="whitespace-nowrap">
            <span class="mr-1.5 text-[11px] font-light tracking-widest uppercase text-muted">{{ t("results.water") }}</span>
            <span class="font-mono tnum text-lg font-light text-accent">{{ fmt(units.convert("volume", result.waterWithMargin)) }}</span>
            <span class="ml-1 text-xs text-muted">{{ t(units.labelKey("volume")) }}</span>
          </span>
          <span class="whitespace-nowrap">
            <span class="mr-1.5 text-[11px] font-light tracking-widest uppercase text-muted">{{ t("results.plaster") }}</span>
            <span class="font-mono tnum text-lg font-light text-accent">{{ fmt(units.convert("mass", result.plasterWithMargin)) }}</span>
            <span class="ml-1 text-xs text-muted">{{ t(units.labelKey("mass")) }}</span>
          </span>
        </span>
      </template>
      <span v-else class="min-w-0 flex-1 text-sm font-light text-danger">
        {{ result.errorMessage ? t(result.errorMessage) : "" }}
      </span>
      <span class="sr-only">{{ t("results.show") }}</span>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="h-4 w-4 shrink-0 text-muted" aria-hidden="true">
        <path d="m6 9 6 6 6-6" />
      </svg>
    </button>
  </Transition>
</template>
