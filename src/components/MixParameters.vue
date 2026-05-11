<script setup lang="ts">
import { useI18n } from "vue-i18n";
import InfoTooltip from "@/components/ui/InfoTooltip.vue";
import NumberInput from "@/components/ui/NumberInput.vue";
import type { MixParams } from "@/types";

const props = defineProps<{ modelValue: MixParams }>();
const emit = defineEmits<(e: "update:modelValue", v: MixParams) => void>();

const { t } = useI18n();

function updateRatio(v: number) {
  emit("update:modelValue", { ...props.modelValue, ratio: v });
}
function updateMargin(v: number) {
  emit("update:modelValue", { ...props.modelValue, margin: v / 100 });
}
</script>

<template>
  <section class="rounded border border-line px-5 py-5">
    <h2 class="mb-4 text-xs font-medium tracking-widest uppercase text-muted flex items-center">
      {{ t("mix.title") }}<InfoTooltip :text="t('mix.titleTooltip')" />
    </h2>

    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div>
        <NumberInput
          :label="t('mix.ratio')"
          :model-value="modelValue.ratio"
          :min="0.1"
          :max="3"
          :step="0.1"
          @update:model-value="updateRatio"
        />
        <p class="mt-1 text-[11px] font-light text-muted">
          {{ t("mix.ratioHint") }}
        </p>
        <p class="mt-0.5 text-[11px] font-light text-muted font-mono">
          {{ t("mix.ratioScale") }}
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
      <span>{{ t("mix.density") }} :</span>
      <span class="ml-2 font-mono tnum text-ink">
        {{ modelValue.gypsumDensity }} {{ t("units.kg") }}/{{ t("units.liters") }}
      </span>
      <InfoTooltip :text="t('mix.densityTooltip')" />
    </div>
  </section>
</template>
