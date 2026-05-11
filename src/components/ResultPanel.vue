<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { CalculationResult } from "@/types";

defineProps<{ result: CalculationResult }>();

const { t, n } = useI18n();

function fmt(v: number): string {
  return n(v, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}
</script>

<template>
  <section class="rounded border border-line bg-surface px-5 py-6">
    <h2 class="mb-5 text-xs font-medium tracking-widest uppercase text-ink">
      {{ t("results.title") }}
    </h2>

    <div v-if="!result.isValid" class="text-sm font-light text-danger">
      {{ result.errorMessage ? t(result.errorMessage) : "" }}
    </div>

    <div v-else class="grid grid-cols-2 gap-6">
      <div>
        <div class="text-[11px] font-light tracking-widest uppercase text-muted">
          {{ t("results.water") }}
          <span class="ml-1 normal-case tracking-normal">({{ t("results.withMargin") }})</span>
        </div>
        <div class="mt-1 font-mono tnum text-3xl font-light text-accent">
          {{ fmt(result.waterWithMargin) }}
          <span class="ml-1 text-base text-muted">{{ t("units.liters") }}</span>
        </div>
        <div class="mt-1 text-xs font-light text-muted">
          {{ t("results.withoutMargin") }} :
          <span class="font-mono tnum">{{ fmt(result.water) }} {{ t("units.liters") }}</span>
        </div>
      </div>

      <div>
        <div class="text-[11px] font-light tracking-widest uppercase text-muted">
          {{ t("results.plaster") }}
          <span class="ml-1 normal-case tracking-normal">({{ t("results.withMargin") }})</span>
        </div>
        <div class="mt-1 font-mono tnum text-3xl font-light text-accent">
          {{ fmt(result.plasterWithMargin) }}
          <span class="ml-1 text-base text-muted">{{ t("units.kg") }}</span>
        </div>
        <div class="mt-1 text-xs font-light text-muted">
          {{ t("results.withoutMargin") }} :
          <span class="font-mono tnum">{{ fmt(result.plaster) }} {{ t("units.kg") }}</span>
        </div>
      </div>
    </div>

    <div v-if="result.isValid" class="mt-5 text-xs font-light text-muted">
      {{ t("results.netVolume") }} :
      <span class="font-mono tnum text-ink">
        {{ fmt(result.netVolume) }} {{ t("units.liters") }}
      </span>
    </div>

    <div class="mt-5">
      <slot name="scene" />
    </div>
  </section>
</template>
