<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import InfoTooltip from "@/components/ui/InfoTooltip.vue";
import NumberInput from "@/components/ui/NumberInput.vue";
import SegmentedControl from "@/components/ui/SegmentedControl.vue";
import type { MixParams, RatioMode } from "@/types";
import { useUnits } from "@/units";

const props = defineProps<{ modelValue: MixParams }>();
const emit = defineEmits<(e: "update:modelValue", v: MixParams) => void>();

const { t, n } = useI18n();
const units = useUnits();

const isConsistency = computed(() => units.ratioMode.value === "consistency");

const ratioModeOptions = computed(() => [
  { value: "ratio", label: t("mix.modeRatio") },
  { value: "consistency", label: t("mix.modeConsistency") },
]);

// The other notation, shown under the field (English page only).
const ratioEquivalent = computed(() => {
  const ratio = props.modelValue.ratio;
  if (!units.switchable.value || !(ratio > 0)) return "";
  return isConsistency.value
    ? t("mix.equivalentRatio", {
        value: n(ratio, { maximumFractionDigits: 2, minimumFractionDigits: 2 }),
      })
    : t("mix.equivalentConsistency", {
        value: n(100 / ratio, { maximumFractionDigits: 0 }),
      });
});

function updateRatio(shown: number) {
  const ratio = units.ratioFromInput(shown, props.modelValue.ratio);
  emit("update:modelValue", { ...props.modelValue, ratio });
}
function updateMargin(v: number) {
  emit("update:modelValue", { ...props.modelValue, margin: v / 100 });
}
</script>

<template>
  <section class="rounded border border-line px-5 py-5">
    <div class="mb-4 flex items-center">
      <h2 class="text-xs font-medium tracking-widest uppercase text-muted">
        {{ t("mix.title") }}
      </h2>
      <InfoTooltip :text="t('mix.titleTooltip')" :label="t('mix.title')" />
    </div>

    <SegmentedControl
      v-if="units.switchable.value"
      class="mb-4"
      :label="t('mix.modeLabel')"
      :options="ratioModeOptions"
      :model-value="units.ratioMode.value"
      @update:model-value="units.setRatioMode($event as RatioMode)"
    />

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <NumberInput
          v-if="isConsistency"
          :label="t('mix.consistency')"
          :model-value="units.ratioToInput(modelValue.ratio)"
          :min="34"
          :max="1000"
          :step="1"
          @update:model-value="updateRatio"
        />
        <NumberInput
          v-else
          :label="t('mix.ratio')"
          :model-value="units.ratioToInput(modelValue.ratio)"
          :min="0.1"
          :max="3"
          :step="0.1"
          :decimals="2"
          @update:model-value="updateRatio"
        />
        <p class="mt-1 text-[11px] font-light text-muted">
          {{ isConsistency ? t("mix.consistencyHint") : t("mix.ratioHint") }}
        </p>
        <p class="mt-0.5 text-[11px] font-light text-muted font-mono">
          {{ isConsistency ? t("mix.consistencyScale") : t("mix.ratioScale") }}
        </p>
        <p v-if="ratioEquivalent" class="mt-0.5 text-[11px] font-light text-muted">
          {{ ratioEquivalent }}
        </p>
      </div>

      <div>
        <NumberInput
          :label="t('mix.margin')"
          :unit="t('units.percent')"
          :model-value="Math.round(modelValue.margin * 100)"
          :min="0"
          :max="50"
          :step="1"
          @update:model-value="updateMargin"
        />
      </div>
    </div>

    <div class="mt-4 flex items-center text-xs font-light text-muted">
      <span>{{ t("format.label", { label: t("mix.density") }) }}</span>
      <span class="ml-2 font-mono tnum text-ink">
        {{ modelValue.gypsumDensity }} {{ t("units.kg") }}/{{ t("units.liters") }}
      </span>
      <InfoTooltip :text="t('mix.densityTooltip')" :label="t('mix.density')" />
    </div>
  </section>
</template>
