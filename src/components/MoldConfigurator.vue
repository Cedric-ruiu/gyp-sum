<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import InfoTooltip from "@/components/ui/InfoTooltip.vue";
import NumberInput from "@/components/ui/NumberInput.vue";
import ShapeSelector from "@/components/ui/ShapeSelector.vue";
import { moldShapeRegistry } from "@/shapes/registry";
import type { Dimensions, MoldConfig } from "@/types";

const props = defineProps<{ modelValue: MoldConfig }>();
const emit = defineEmits<(e: "update:modelValue", v: MoldConfig) => void>();

const { t, n } = useI18n();

const currentShape = computed(
  () =>
    moldShapeRegistry.find((s) => s.type === props.modelValue.shape) ??
    moldShapeRegistry[0],
);

function updateShape(type: string) {
  const def = moldShapeRegistry.find((s) => s.type === type);
  if (!def) return;
  const dims: Dimensions = {};
  for (const f of def.fields) {
    dims[f.key] = props.modelValue.dimensions?.[f.key] ?? f.defaultValue;
  }
  emit("update:modelValue", {
    shape: type as MoldConfig["shape"],
    dimensions: dims,
  });
}

function updateField(key: string, val: number) {
  const dims: Dimensions = { ...props.modelValue.dimensions, [key]: val };
  emit("update:modelValue", { ...props.modelValue, dimensions: dims });
}

const volume = computed(() => {
  const def = currentShape.value;
  const dims = props.modelValue.dimensions;
  const values = def.fields.map((f) => Number(dims?.[f.key]) || 0);
  return def.computeVolume(values);
});
</script>

<template>
  <section class="rounded border border-line bg-blue-50/40 px-5 py-5">
    <h2 class="mb-4 text-xs font-medium tracking-widest uppercase text-accent flex items-center">
      {{ t("mold.title") }}<InfoTooltip :text="t('mold.titleTooltip')" />
    </h2>

    <ShapeSelector
      :shapes="moldShapeRegistry"
      :model-value="modelValue.shape"
      @update:model-value="updateShape"
    />

    <div
      class="mt-4 grid gap-3"
      :style="{ gridTemplateColumns: `repeat(${currentShape.fields.length}, minmax(0, 1fr))` }"
    >
      <NumberInput
        v-for="field in currentShape.fields"
        :key="field.key"
        :label="t(field.labelKey)"
        :unit="t(field.unitKey)"
        :min="field.min"
        :model-value="modelValue.dimensions[field.key] ?? field.defaultValue"
        @update:model-value="updateField(field.key, $event)"
      />
    </div>

    <p class="mt-4 text-xs font-light text-muted">
      {{ t("mold.volume") }} :
      <span class="font-mono tnum text-ink">
        {{ n(volume, { maximumFractionDigits: 2, minimumFractionDigits: 2 }) }} {{ t("units.liters") }}
      </span>
    </p>
  </section>
</template>
