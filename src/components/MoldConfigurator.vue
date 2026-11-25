<script setup lang="ts">
import { computed, nextTick, ref, useId } from "vue";
import { useI18n } from "vue-i18n";
import InfoTooltip from "@/components/ui/InfoTooltip.vue";
import NumberInput from "@/components/ui/NumberInput.vue";
import ShapeSelector from "@/components/ui/ShapeSelector.vue";
import { canFitMold, DEFAULT_FIT_MARGIN } from "@/shapes/fit";
import { moldShapeRegistry } from "@/shapes/registry";
import type { ShapeField } from "@/shapes/types";
import type { Dimensions, MoldConfig, ObjectConfig } from "@/types";
import { useUnits } from "@/units";

const props = defineProps<{
  modelValue: MoldConfig;
  objectConfig?: ObjectConfig | null;
  step: number;
}>();
const emit = defineEmits<(e: "update:modelValue", v: MoldConfig) => void>();

const { t, n } = useI18n();
const units = useUnits();
const fitHelpId = useId();

const currentShape = computed(
  () =>
    moldShapeRegistry.find((s) => s.type === props.modelValue.shape) ??
    moldShapeRegistry[0],
);

// The dimensions themselves are derived in HomePage (fitMold), on every
// change to the object, the mold shape or the margin.
const canFit = computed(() =>
  canFitMold(props.modelValue.shape, props.objectConfig),
);
const fitActive = computed(() => canFit.value && !!props.modelValue.fit);

const fitHelp = computed(() => {
  if (!canFit.value) return t("mold.fitUnavailable");
  return fitActive.value ? t("mold.fitLinked") : t("mold.fitFree");
});

function setFit(e: Event) {
  const fit = (e.target as HTMLInputElement).checked;
  emit("update:modelValue", { ...props.modelValue, fit });
}

// Stored in cm; shown and edited in the current length unit.
const fitMargin = computed(
  () => props.modelValue.fitMargin ?? DEFAULT_FIT_MARGIN,
);
const editingMargin = ref(false);
const marginRaw = ref("");
const marginInputEl = ref<HTMLInputElement | null>(null);

const marginShown = computed(() => units.toInput("length", fitMargin.value));
const marginDisplay = computed(() =>
  n(marginShown.value, { maximumFractionDigits: 1 }),
);

async function startEditMargin() {
  marginRaw.value = String(marginShown.value);
  editingMargin.value = true;
  await nextTick();
  marginInputEl.value?.select();
}

function commitMargin() {
  const parsed = Number(marginRaw.value.replace(",", "."));
  if (!Number.isNaN(parsed) && parsed >= 0.1) {
    const margin = units.fromInput(
      "length",
      Math.round(parsed * 10) / 10,
      fitMargin.value,
    );
    if (margin !== fitMargin.value) {
      emit("update:modelValue", { ...props.modelValue, fitMargin: margin });
    }
  }
  editingMargin.value = false;
}

function cancelEdit() {
  editingMargin.value = false;
}

function stepMargin(delta: number) {
  const current = Number(marginRaw.value.replace(",", "."));
  const base = Number.isNaN(current) ? marginShown.value : current;
  const next = Math.max(0.1, Math.round((base + delta) * 10) / 10);
  marginRaw.value = String(next);
}

function updateShape(type: string) {
  const def = moldShapeRegistry.find((s) => s.type === type);
  if (!def) return;
  const dims: Dimensions = {};
  for (const f of def.fields) {
    dims[f.key] = props.modelValue.dimensions?.[f.key] ?? f.defaultValue;
  }
  emit("update:modelValue", {
    ...props.modelValue,
    shape: type as MoldConfig["shape"],
    dimensions: dims,
  });
}

function fieldValue(field: ShapeField): number {
  return props.modelValue.dimensions[field.key] ?? field.defaultValue;
}

function updateField(field: ShapeField, shown: number) {
  const current = fieldValue(field);
  const val = units.fromInput(
    units.fieldQuantity(field.unitKey),
    shown,
    current,
  );
  // A blur re-emits the shown value: only a real edit frees a fitted mold.
  if (val === current) return;
  const dims: Dimensions = { ...props.modelValue.dimensions, [field.key]: val };
  emit("update:modelValue", {
    ...props.modelValue,
    fit: false,
    dimensions: dims,
  });
}

function fieldDisplay(field: ShapeField): string {
  const shown = units.toInput(
    units.fieldQuantity(field.unitKey),
    fieldValue(field),
  );
  return n(shown, {
    maximumFractionDigits: units.system.value === "us" ? 2 : 1,
  });
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
    <h2 class="mb-4 text-xs font-medium tracking-widest uppercase text-accent">
      <span class="mr-2 font-mono font-light">{{ step }}</span>{{ t("mold.title") }}
    </h2>

    <h3 class="mb-2 text-xs font-medium text-ink">{{ t("mold.shapeTitle") }}</h3>
    <ShapeSelector
      :shapes="moldShapeRegistry"
      :model-value="modelValue.shape"
      @update:model-value="updateShape"
    />

    <div class="mt-3">
      <div class="flex flex-wrap items-center gap-x-3">
        <label
          class="inline-flex min-h-12 items-center gap-2 text-xs font-light sm:min-h-8"
          :class="canFit ? 'cursor-pointer text-ink' : 'cursor-not-allowed text-muted opacity-55'"
        >
          <input
            type="checkbox"
            class="h-4 w-4 cursor-[inherit] accent-accent"
            :checked="fitActive"
            :disabled="!canFit"
            :aria-describedby="fitHelpId"
            @change="setFit"
          />
          {{ t("mold.adaptToObject") }}
        </label>
        <span
          class="flex items-center gap-0.5 select-none text-xs font-light text-muted transition-opacity duration-150"
          :class="{ 'opacity-55': !fitActive }"
        >
          {{ t("mold.margin") }}
          <button
            v-if="!editingMargin"
            type="button"
            class="min-h-12 min-w-12 p-2 font-mono text-ink underline sm:min-h-0 sm:min-w-0 decoration-dashed underline-offset-2 transition-colors duration-150 enabled:hover:text-accent disabled:cursor-not-allowed disabled:no-underline"
            :title="t('mold.marginEditHint')"
            :disabled="!fitActive"
            @click="startEditMargin"
          >{{ marginDisplay }}</button>
          <input
            v-else
            ref="marginInputEl"
            v-model="marginRaw"
            type="text"
            inputmode="decimal"
            class="w-12 border-b border-ink bg-transparent font-mono text-base text-ink outline-none text-center sm:w-8 sm:text-xs"
            @blur="commitMargin"
            @keydown.enter.prevent="commitMargin"
            @keydown.escape="cancelEdit"
            @keydown.up.prevent="stepMargin(0.5)"
            @keydown.down.prevent="stepMargin(-0.5)"
          />
          {{ t(units.labelKey("length")) }}
        </span>
        <InfoTooltip
          :text="t('mold.adaptToObjectTooltip')"
          :label="t('mold.adaptToObject')"
        />
      </div>
      <p :id="fitHelpId" class="text-xs font-light text-muted">{{ fitHelp }}</p>
    </div>

    <div class="mt-4 border-t border-line pt-4">
      <div class="mb-2 flex items-center">
        <h3 class="text-xs font-medium text-ink">{{ t("mold.dimensionsTitle") }}</h3>
        <InfoTooltip :text="t('mold.titleTooltip')" :label="t('mold.dimensionsTitle')" />
      </div>

      <!-- Fitted: computed from the object, shown read-only. -->
      <dl v-if="fitActive" class="flex flex-wrap gap-x-8 gap-y-3">
        <div v-for="field in currentShape.fields" :key="field.key" class="flex flex-col gap-1">
          <dt class="text-xs font-light text-muted uppercase tracking-wide">{{ t(field.labelKey) }}</dt>
          <dd class="font-mono text-sm font-light tnum text-ink">
            {{ fieldDisplay(field) }}
            <span class="text-xs text-muted">{{ t(units.labelKey(units.fieldQuantity(field.unitKey))) }}</span>
          </dd>
        </div>
      </dl>
      <div v-else class="fields-grid-wrap">
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
          :model-value="units.toInput(units.fieldQuantity(field.unitKey), fieldValue(field))"
          @update:model-value="updateField(field, $event)"
        />
      </div>
      </div>

      <p class="mt-4 text-xs font-light text-muted">
        {{ t("format.label", { label: t("mold.volume") }) }}
        <span class="font-mono tnum text-ink">
          {{ n(units.convert("volume", volume), { maximumFractionDigits: 2, minimumFractionDigits: 2 }) }} {{ t(units.labelKey("volume")) }}
        </span>
      </p>
    </div>
  </section>
</template>
