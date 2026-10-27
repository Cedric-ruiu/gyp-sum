<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import InfoTooltip from "@/components/ui/InfoTooltip.vue";
import NumberInput from "@/components/ui/NumberInput.vue";
import ShapeSelector from "@/components/ui/ShapeSelector.vue";
import { objectShapeRegistry } from "@/shapes/registry";
import type { Dimensions, ObjectConfig } from "@/types";
import { useUnits } from "@/units";

const props = defineProps<{ modelValue: ObjectConfig }>();
const emit = defineEmits<(e: "update:modelValue", v: ObjectConfig) => void>();

const { t, n } = useI18n();
const units = useUnits();

const isNone = computed(() => props.modelValue.shape === "none");
const isManual = computed(
  () =>
    props.modelValue.manualVolume !== null &&
    props.modelValue.manualVolume !== undefined,
);

const currentShape = computed(() =>
  objectShapeRegistry.find((s) => s.type === props.modelValue.shape),
);

function updateShape(type: string) {
  if (type === "none") {
    emit("update:modelValue", {
      shape: "none",
      dimensions: null,
      manualVolume: null,
    });
    return;
  }
  if (type === "manual") {
    emit("update:modelValue", {
      shape: "box",
      dimensions: props.modelValue.dimensions,
      manualVolume: props.modelValue.manualVolume ?? 0,
    });
    return;
  }
  const def = objectShapeRegistry.find((s) => s.type === type);
  if (!def) return;
  const dims: Dimensions = {};
  for (const f of def.fields) {
    dims[f.key] = props.modelValue.dimensions?.[f.key] ?? f.defaultValue;
  }
  emit("update:modelValue", {
    shape: type as ObjectConfig["shape"],
    dimensions: dims,
    manualVolume: null,
  });
}

function fieldValue(key: string, fallback: number): number {
  return props.modelValue.dimensions?.[key] ?? fallback;
}

function updateField(key: string, unitKey: string, shown: number) {
  const current = props.modelValue.dimensions?.[key] ?? 0;
  const val = units.fromInput(units.fieldQuantity(unitKey), shown, current);
  const dims: Dimensions = { ...props.modelValue.dimensions, [key]: val };
  emit("update:modelValue", { ...props.modelValue, dimensions: dims });
}

function updateManual(shown: number) {
  const current = props.modelValue.manualVolume ?? 0;
  const v = units.fromInput("volume", shown, current);
  emit("update:modelValue", { ...props.modelValue, manualVolume: v });
}

const volume = computed(() => {
  if (isNone.value) return 0;
  if (isManual.value) return Number(props.modelValue.manualVolume) || 0;
  const def = currentShape.value;
  if (!def) return 0;
  const dims = props.modelValue.dimensions;
  const values = def.fields.map((f) => Number(dims?.[f.key]) || 0);
  return def.computeVolume(values);
});
</script>

<template>
  <section class="rounded border border-line px-5 py-5" style="background: rgba(245,158,11,0.06)">
    <div class="mb-4 flex items-center">
      <h2 class="text-xs font-medium tracking-widest uppercase text-accent-soft-strong">
        {{ t("object.title") }}
      </h2>
      <InfoTooltip :text="t('object.titleTooltip')" :label="t('object.title')" />
    </div>

    <ShapeSelector
      :shapes="objectShapeRegistry"
      :model-value="isManual ? 'manual' : modelValue.shape"
      :none-option="{ value: 'none', labelKey: 'object.shape.none' }"
      variant="accent-soft"
      @update:model-value="updateShape"
    />

    <div v-if="!isNone" class="mt-4">
      <div v-if="isManual">
        <NumberInput
          :label="t('object.manualVolume')"
          :unit="t(units.labelKey('volume'))"
          :min="0"
          :decimals="units.system.value === 'us' ? 2 : 1"
          :model-value="units.toInput('volume', modelValue.manualVolume ?? 0)"
          @update:model-value="updateManual"
        />
      </div>

      <div v-else-if="currentShape" class="fields-grid-wrap">
        <div
          class="fields-grid"
          :style="{ '--fields-count': currentShape.fields.length }"
        >
          <NumberInput
            v-for="field in currentShape.fields"
            :key="field.key"
            :label="t(field.labelKey)"
            :unit="t(units.labelKey(units.fieldQuantity(field.unitKey)))"
            :min="field.min"
            :decimals="units.system.value === 'us' ? 2 : 1"
            :model-value="units.toInput(units.fieldQuantity(field.unitKey), fieldValue(field.key, field.defaultValue))"
            @update:model-value="updateField(field.key, field.unitKey, $event)"
          />
        </div>
      </div>

      <p class="mt-4 text-xs font-light text-muted">
        {{ t("object.volume") }} :
        <span class="font-mono tnum text-ink">
          {{ n(units.convert("volume", volume), { maximumFractionDigits: 2, minimumFractionDigits: 2 }) }} {{ t(units.labelKey("volume")) }}
        </span>
      </p>
    </div>
  </section>
</template>
