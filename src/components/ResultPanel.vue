<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { CalculationResult } from "@/types";
import { useUnits } from "@/units";

defineProps<{ result: CalculationResult }>();

const { t, n } = useI18n();
const units = useUnits();

function fmt(v: number): string {
  return n(v, { maximumFractionDigits: 2, minimumFractionDigits: 2 });
}

// US fluid ounces and ounces, shown under the cups / pounds totals.
function fmtSmall(v: number): string {
  return n(v, { maximumFractionDigits: 1, minimumFractionDigits: 1 });
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
          {{ fmt(units.convert("volume", result.waterWithMargin)) }}
          <span class="ml-1 text-base text-muted">{{ t(units.labelKey("volume")) }}</span>
        </div>
        <div v-if="units.system.value === 'us'" class="mt-1 text-xs font-light text-muted">
          = <span class="font-mono tnum">{{ fmtSmall(units.convert("smallVolume", result.waterWithMargin)) }} {{ t(units.labelKey("smallVolume")) }}</span>
        </div>
        <div class="mt-1 text-xs font-light text-muted">
          {{ t("format.label", { label: t("results.withoutMargin") }) }}
          <span class="font-mono tnum">{{ fmt(units.convert("volume", result.water)) }} {{ t(units.labelKey("volume")) }}</span>
        </div>
      </div>

      <div>
        <div class="text-[11px] font-light tracking-widest uppercase text-muted">
          {{ t("results.plaster") }}
          <span class="ml-1 normal-case tracking-normal">({{ t("results.withMargin") }})</span>
        </div>
        <div class="mt-1 font-mono tnum text-3xl font-light text-accent">
          {{ fmt(units.convert("mass", result.plasterWithMargin)) }}
          <span class="ml-1 text-base text-muted">{{ t(units.labelKey("mass")) }}</span>
        </div>
        <div v-if="units.system.value === 'us'" class="mt-1 text-xs font-light text-muted">
          = <span class="font-mono tnum">{{ fmtSmall(units.convert("smallMass", result.plasterWithMargin)) }} {{ t(units.labelKey("smallMass")) }}</span>
        </div>
        <div class="mt-1 text-xs font-light text-muted">
          {{ t("format.label", { label: t("results.withoutMargin") }) }}
          <span class="font-mono tnum">{{ fmt(units.convert("mass", result.plaster)) }} {{ t(units.labelKey("mass")) }}</span>
        </div>
      </div>
    </div>

    <div v-if="result.isValid" class="mt-5 text-xs font-light text-muted">
      {{ t("format.label", { label: t("results.netVolume") }) }}
      <span class="font-mono tnum text-ink">
        {{ fmt(units.convert("volume", result.netVolume)) }} {{ t(units.labelKey("volume")) }}
      </span>
    </div>

    <div class="mt-5">
      <slot name="scene" />
    </div>
  </section>
</template>
