<script setup lang="ts">
import { nextTick, onUnmounted, ref } from "vue";

defineProps<{ text: string }>();

const open = ref(false);
const buttonRef = ref<HTMLButtonElement | null>(null);
const tooltipRef = ref<HTMLElement | null>(null);
const tooltipStyle = ref<Record<string, string>>({});

function position() {
  if (!buttonRef.value || !tooltipRef.value) return;
  const btn = buttonRef.value.getBoundingClientRect();
  const tip = tooltipRef.value.getBoundingClientRect();
  const pad = 8;
  const gap = 8;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const rightFits = btn.right + gap + tip.width + pad <= vw;
  const leftFits = btn.left - gap - tip.width - pad >= 0;

  let left: number;
  let top: number;

  if (rightFits) {
    left = btn.right + gap;
    top = btn.top + btn.height / 2 - tip.height / 2;
  } else if (leftFits) {
    left = btn.left - tip.width - gap;
    top = btn.top + btn.height / 2 - tip.height / 2;
  } else {
    left = btn.left + btn.width / 2 - tip.width / 2;
    const belowFits = btn.bottom + gap + tip.height + pad <= vh;
    top = belowFits ? btn.bottom + gap : btn.top - tip.height - gap;
  }

  left = Math.max(pad, Math.min(left, vw - tip.width - pad));
  top = Math.max(pad, Math.min(top, vh - tip.height - pad));

  tooltipStyle.value = { top: `${top}px`, left: `${left}px` };
}

async function handleOpen() {
  open.value = true;
  await nextTick();
  position();
  window.addEventListener("scroll", position, true);
  window.addEventListener("resize", position);
}

function handleClose() {
  open.value = false;
  window.removeEventListener("scroll", position, true);
  window.removeEventListener("resize", position);
}

onUnmounted(handleClose);
</script>

<template>
  <span class="inline-flex items-center">
    <button
      ref="buttonRef"
      type="button"
      class="ml-1 inline-flex h-4 w-4 items-center justify-center border border-line text-[10px] font-light normal-case tracking-normal text-muted hover:text-ink hover:border-ink transition-colors cursor-help"
      @mouseenter="handleOpen"
      @mouseleave="handleClose"
      @focus="handleOpen"
      @blur="handleClose"
      aria-label="info"
    >
      ?
    </button>
    <Teleport to="body">
      <span
        v-if="open"
        ref="tooltipRef"
        :style="tooltipStyle"
        class="pointer-events-none fixed z-50 w-64 max-w-[calc(100vw-1rem)] border border-line bg-white p-2 text-xs font-light normal-case tracking-normal text-ink"
      >
        {{ text }}
      </span>
    </Teleport>
  </span>
</template>
