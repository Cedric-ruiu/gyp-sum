<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { useI18n } from "vue-i18n";
import InfoTooltip from "@/components/ui/InfoTooltip.vue";
import NumberInput from "@/components/ui/NumberInput.vue";
import ShapeSelector from "@/components/ui/ShapeSelector.vue";
import { moldShapeRegistry } from "@/shapes/registry";
import type { Dimensions, MoldConfig, ObjectConfig } from "@/types";

const props = defineProps<{
  modelValue: MoldConfig;
  objectConfig?: ObjectConfig | null;
}>();
const emit = defineEmits<(e: "update:modelValue", v: MoldConfig) => void>();

const adaptMargin = ref(2.5);
const editingMargin = ref(false);
const marginRaw = ref("");
const marginInputEl = ref<HTMLInputElement | null>(null);

const adaptMarginDisplay = computed(() =>
  String(adaptMargin.value).replace(".", ","),
);

function startEditMargin() {
  marginRaw.value = String(adaptMargin.value);
  editingMargin.value = true;
  nextTick(() => marginInputEl.value?.select());
}

function commitMargin() {
  const parsed = Number(marginRaw.value.replace(",", "."));
  if (!Number.isNaN(parsed) && parsed >= 0.1) {
    adaptMargin.value = Math.round(parsed * 10) / 10;
  }
  editingMargin.value = false;
}

function cancelEdit() {
  editingMargin.value = false;
}

function stepMargin(delta: number) {
  const current = Number(marginRaw.value.replace(",", "."));
  const base = Number.isNaN(current) ? adaptMargin.value : current;
  const next = Math.max(0.1, Math.round((base + delta) * 10) / 10);
  marginRaw.value = String(next);
}

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

const canAdapt = computed(() => {
  const obj = props.objectConfig;
  return (
    !!obj &&
    obj.shape !== "none" &&
    obj.manualVolume === null &&
    !!obj.dimensions
  );
});

function adaptToObject() {
  const obj = props.objectConfig;
  if (!obj?.dimensions) return;

  const d = obj.dimensions;
  const m = adaptMargin.value;
  const moldShape = props.modelValue.shape;
  let dims: Dimensions | null = null;

  if (moldShape === "box") {
    if (obj.shape === "box") {
      dims = {
        length: (d.length || 0) + 2 * m,
        width: (d.width || 0) + 2 * m,
        height: (d.height || 0) + m,
      };
    } else if (obj.shape === "cylinder") {
      const diam = d.diameter || 0;
      dims = {
        length: diam + 2 * m,
        width: diam + 2 * m,
        height: (d.height || 0) + m,
      };
    } else if (obj.shape === "sphere") {
      const diam = d.diameter || 0;
      dims = { length: diam + 2 * m, width: diam + 2 * m, height: diam + m };
    } else if (obj.shape === "half-sphere") {
      const diam = d.diameter || 0;
      dims = {
        length: diam + 2 * m,
        width: diam + 2 * m,
        height: diam / 2 + m,
      };
    }
  } else if (moldShape === "cylinder") {
    if (obj.shape === "box") {
      const l = d.length || 0;
      const w = d.width || 0;
      // diagonal to fully encompass box corners in the cylinder
      dims = {
        diameter: Math.sqrt(l * l + w * w) + 2 * m,
        height: (d.height || 0) + m,
      };
    } else if (obj.shape === "cylinder") {
      dims = {
        diameter: (d.diameter || 0) + 2 * m,
        height: (d.height || 0) + m,
      };
    } else if (obj.shape === "sphere") {
      const diam = d.diameter || 0;
      dims = { diameter: diam + 2 * m, height: diam + m };
    } else if (obj.shape === "half-sphere") {
      const diam = d.diameter || 0;
      dims = { diameter: diam + 2 * m, height: diam / 2 + m };
    }
  }

  if (dims)
    emit("update:modelValue", { ...props.modelValue, dimensions: dims });
}
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

    <div class="mt-3 flex items-center gap-1.5">
      <button
        type="button"
        class="inline-flex cursor-pointer items-center gap-1.5 rounded border border-line px-3 py-1.5 text-xs font-light text-muted transition-colors duration-150 hover:border-accent hover:bg-accent/5 hover:text-accent disabled:cursor-not-allowed disabled:opacity-35"
        :disabled="!canAdapt"
        @click="adaptToObject"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="h-3.5 w-3.5 shrink-0" aria-hidden="true">
          <rect x="5.5" y="5.5" width="5" height="5" />
          <path d="M1 4V1h3M12 1h3v3M1 12v3h3M12 15h3v-3" />
        </svg>
        {{ t("mold.adaptToObject") }}
      </button>
      <span class="flex items-center gap-0.5 select-none text-xs font-light text-muted">
        {{ t("mold.margin") }}
        <button
          v-if="!editingMargin"
          type="button"
          class="p-2 font-mono text-ink underline decoration-dashed underline-offset-2 transition-colors duration-150 hover:text-accent"
          :title="t('mold.marginEditHint')"
          @click="startEditMargin"
        >{{ adaptMarginDisplay }}</button>
        <input
          v-else
          ref="marginInputEl"
          v-model="marginRaw"
          type="text"
          inputmode="decimal"
          class="w-8 border-b border-ink bg-transparent font-mono text-xs text-ink outline-none text-center"
          @blur="commitMargin"
          @keydown.enter.prevent="commitMargin"
          @keydown.escape="cancelEdit"
          @keydown.up.prevent="stepMargin(0.5)"
          @keydown.down.prevent="stepMargin(-0.5)"
        />
        {{ t("units.cm") }}
      </span>
      <InfoTooltip :text="t('mold.adaptToObjectTooltip')" />
    </div>

    <p class="mt-4 text-xs font-light text-muted">
      {{ t("mold.volume") }} :
      <span class="font-mono tnum text-ink">
        {{ n(volume, { maximumFractionDigits: 2, minimumFractionDigits: 2 }) }} {{ t("units.liters") }}
      </span>
    </p>
  </section>
</template>
