<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import MoldDrawing from "@/components/MoldDrawing.vue";
import AppLogo from "@/components/ui/AppLogo.vue";
import { useTrackPrints } from "@/composables/usePrint";
import { pageFor, pageUrl } from "@/seo";
import { canFitMold, DEFAULT_FIT_MARGIN } from "@/shapes/fit";
import { moldShapeRegistry, objectShapeRegistry } from "@/shapes/registry";
import type { ShapeDefinition } from "@/shapes/types";
import type {
  CalculationResult,
  Dimensions,
  MixParams,
  MoldConfig,
  ObjectConfig,
} from "@/types";
import { type Quantity, type SmallQuantity, useUnits } from "@/units";

// Workshop sheet: hidden on screen, it replaces the whole page when printing
// (button or browser shortcut alike). Sized to fit one A4 or Letter page.
const props = defineProps<{
  mold: MoldConfig;
  object: ObjectConfig;
  mix: MixParams;
  result: CalculationResult;
}>();

const { t, tm, rt, n, locale } = useI18n();
const units = useUnits();
useTrackPrints();

const isUs = computed(() => units.system.value === "us");
const unit = (q: Quantity | SmallQuantity) => t(units.labelKey(q));
const fixed = (v: number, digits: number) =>
  n(v, { minimumFractionDigits: digits, maximumFractionDigits: digits });
const volume = (liters: number) =>
  `${fixed(units.convert("volume", liters), 2)} ${unit("volume")}`;

const date = new Intl.DateTimeFormat(locale.value, {
  dateStyle: "long",
}).format(new Date());

const url = computed(() =>
  pageUrl(pageFor("calculator", locale.value).path).replace(/^https?:\/\//, ""),
);

const quantities = computed(() => {
  const r = props.result;
  return [
    {
      label: t("results.water"),
      value: fixed(units.convert("volume", r.waterWithMargin), 2),
      unit: unit("volume"),
      small: isUs.value
        ? `${fixed(units.convert("smallVolume", r.waterWithMargin), 1)} ${unit("smallVolume")}`
        : "",
      raw: volume(r.water),
    },
    {
      label: t("results.plaster"),
      value: fixed(units.convert("mass", r.plasterWithMargin), 2),
      unit: unit("mass"),
      small: isUs.value
        ? `${fixed(units.convert("smallMass", r.plasterWithMargin), 1)} ${unit("smallMass")}`
        : "",
      raw: `${fixed(units.convert("mass", r.plaster), 2)} ${unit("mass")}`,
    },
  ];
});

interface Row {
  label: string;
  value: string;
  note?: string;
}

function fieldRows(def: ShapeDefinition, dims: Dimensions): Row[] {
  return def.fields.map((f) => {
    const q = units.fieldQuantity(f.unitKey);
    const value = n(units.toInput(q, Number(dims[f.key]) || 0), {
      maximumFractionDigits: isUs.value ? 2 : 1,
    });
    return { label: t(f.labelKey), value: `${value} ${unit(q)}` };
  });
}

const objectColumn = computed(() => {
  const o = props.object;
  const volumeRow = {
    label: t("fields.volume"),
    value: volume(props.result.objectVolume),
  };
  if (o.shape === "none") return { shape: t("object.shape.none"), rows: [] };
  if (o.manualVolume != null) {
    return { shape: t("shapes.manual"), rows: [volumeRow] };
  }
  const def = objectShapeRegistry.find((s) => s.type === o.shape);
  if (!def || !o.dimensions) return { shape: "", rows: [] };
  return {
    shape: t(def.labelKey),
    rows: [...fieldRows(def, o.dimensions), volumeRow],
  };
});

const moldColumn = computed(() => {
  const m = props.mold;
  const def =
    moldShapeRegistry.find((s) => s.type === m.shape) ?? moldShapeRegistry[0];
  const fitted = !!m.fit && canFitMold(m.shape, props.object);
  const margin = n(units.toInput("length", m.fitMargin ?? DEFAULT_FIT_MARGIN), {
    maximumFractionDigits: isUs.value ? 2 : 1,
  });
  return {
    shape: t(def.labelKey),
    note: fitted
      ? t("print.fitted", { margin: `${margin} ${unit("length")}` })
      : "",
    rows: [
      ...fieldRows(def, m.dimensions),
      { label: t("fields.volume"), value: volume(props.result.moldVolume) },
    ],
  };
});

const mixRows = computed<Row[]>(() => {
  const { ratio, margin } = props.mix;
  const consistency = units.ratioMode.value === "consistency";
  const ratioText = `${fixed(ratio, 2)} ${t("units.kg")}/${t("units.liters")}`;
  // The English page also gives the other notation, as under the field.
  const ratioRow: Row = consistency
    ? {
        label: t("mix.consistency"),
        value: n(units.ratioToInput(ratio)),
        note: t("mix.equivalentRatio", { value: fixed(ratio, 2) }),
      }
    : {
        label: t("mix.ratio"),
        value: ratioText,
        note:
          units.switchable.value && ratio > 0
            ? t("mix.equivalentConsistency", {
                value: n(100 / ratio, { maximumFractionDigits: 0 }),
              })
            : undefined,
      };
  return [
    ratioRow,
    {
      label: t("mix.margin"),
      value: n(margin, { style: "percent", maximumFractionDigits: 0 }),
    },
    { label: t("results.netVolume"), value: volume(props.result.netVolume) },
  ];
});

const columns = computed(() => [
  {
    title: t("object.title"),
    color: "text-accent-soft-strong",
    shape: objectColumn.value.shape,
    note: "",
    rows: objectColumn.value.rows as Row[],
  },
  {
    title: t("mold.title"),
    color: "text-accent",
    ...moldColumn.value,
  },
  {
    title: t("mix.title"),
    color: "text-muted",
    shape: "",
    note: "",
    rows: mixRows.value,
  },
]);

// The weighing steps only when there are amounts to weigh.
const steps = computed(() => {
  const general = (tm("print.steps") as string[]).map((s) => rt(s));
  if (!props.result.isValid) return general;
  const [water, plaster] = quantities.value;
  return [
    t("print.weigh", { plaster: `${plaster.value} ${plaster.unit}` }),
    t("print.measure", { water: `${water.value} ${water.unit}` }),
    ...general,
  ];
});
</script>

<template>
  <article class="print-sheet mx-auto hidden max-w-[210mm] px-[12mm] py-[11mm] text-[9pt] leading-snug text-ink print:block">
    <header class="flex items-end justify-between border-b border-ink pb-[3mm]">
      <div>
        <AppLogo class="-ml-[0.6mm] h-[7mm] w-[31.25mm] overflow-visible" />
        <p class="mt-[1mm] text-[8pt] text-muted">{{ t("app.subtitle") }}</p>
      </div>
      <div class="text-right">
        <p class="text-[8pt] font-medium tracking-widest uppercase">{{ t("print.title") }}</p>
        <p class="mt-[1mm] text-[8pt] text-muted">{{ date }}</p>
      </div>
    </header>

    <section v-if="result.isValid" class="mt-[6mm] grid grid-cols-2 gap-[6mm]">
      <div
        v-for="q in quantities"
        :key="q.label"
        class="rounded border border-line px-[5mm] py-[4mm]"
      >
        <p class="text-[7.5pt] tracking-widest uppercase text-muted">
          {{ q.label }}
          <span class="ml-[1mm] tracking-normal normal-case">({{ t("results.withMargin") }})</span>
        </p>
        <p class="mt-[2mm] font-mono text-[26pt] leading-none font-light tnum text-accent">
          {{ q.value }}<span class="ml-[2mm] text-[12pt] text-muted">{{ q.unit }}</span>
        </p>
        <p v-if="q.small" class="mt-[1.5mm] text-[8pt] text-muted">
          = <span class="font-mono tnum">{{ q.small }}</span>
        </p>
        <p class="mt-[2mm] text-[8pt] text-muted">
          {{ t("format.label", { label: t("results.withoutMargin") }) }}
          <span class="font-mono tnum text-ink">{{ q.raw }}</span>
        </p>
      </div>
    </section>
    <p v-else class="mt-[6mm] rounded border border-danger px-[5mm] py-[4mm] text-danger">
      {{ result.errorMessage ? t(result.errorMessage) : "" }}
    </p>

    <MoldDrawing class="mt-[7mm]" :mold="mold" :object="object" />

    <section class="mt-[6mm] grid grid-cols-3 gap-[6mm] border-t border-line pt-[4mm]">
      <div v-for="(col, i) in columns" :key="col.title">
        <h2 class="text-[7.5pt] font-medium tracking-widest uppercase" :class="col.color">
          <span class="mr-[1.5mm] font-mono font-light">{{ i + 1 }}</span>{{ col.title }}
        </h2>
        <p v-if="col.shape" class="mt-[1.5mm]">{{ col.shape }}</p>
        <p v-if="col.note" class="text-[7.5pt] text-muted">{{ col.note }}</p>
        <dl class="mt-[1.5mm]">
          <div
            v-for="row in col.rows"
            :key="row.label"
            class="border-b border-line py-[0.9mm] last:border-0"
          >
            <div class="flex items-baseline justify-between gap-[2mm]">
              <dt class="text-muted">{{ row.label }}</dt>
              <dd class="font-mono whitespace-nowrap tnum">{{ row.value }}</dd>
            </div>
            <p v-if="row.note" class="text-right text-[7.5pt] text-muted">{{ row.note }}</p>
          </div>
        </dl>
      </div>
    </section>

    <section class="mt-[6mm] grid grid-cols-2 gap-[6mm] border-t border-line pt-[4mm]">
      <div>
        <h2 class="text-[7.5pt] font-medium tracking-widest uppercase text-muted">{{ t("print.prep") }}</h2>
        <ul class="mt-[2.5mm] grid gap-[2mm]">
          <li v-for="step in steps" :key="step" class="flex items-start gap-[2.5mm]">
            <span class="mt-[0.3mm] size-[3.2mm] shrink-0 rounded-[0.5mm] border border-ink" aria-hidden="true" />
            {{ step }}
          </li>
        </ul>
      </div>
      <div>
        <h2 class="text-[7.5pt] font-medium tracking-widest uppercase text-muted">{{ t("print.notes") }}</h2>
        <div v-for="i in 6" :key="i" class="h-[7mm] border-b border-line" />
      </div>
    </section>

    <footer class="mt-[7mm] border-t border-line pt-[2mm] text-[7pt] text-muted">
      {{ t("print.footer", { url }) }}
    </footer>
  </article>
</template>
