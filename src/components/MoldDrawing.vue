<script setup lang="ts">
import { computed, useId } from "vue";
import { useI18n } from "vue-i18n";
import { moldOutlines, objectOutlines } from "@/shapes/drawing";
import type { ShapeOutline } from "@/shapes/types";
import type { MoldConfig, ObjectConfig } from "@/types";
import { useUnits } from "@/units";

// Dimensioned drawing of the mold for the workshop sheet: a section (plaster
// hatched, object cut through) and a top view (object hidden, dashed). Both
// views share one scale; the dimensions are the mold's inner ones.
const props = defineProps<{ mold: MoldConfig; object: ObjectConfig }>();

const { t, n } = useI18n();
const units = useUnits();
const hatchId = useId();

// Layout in mm: the SVG spans the sheet's 186 mm content width, one view per
// half, each with a title band on top and a dimension band below and right.
const WIDTH = 186;
const HEIGHT = 70;
const HALF = WIDTH / 2;
const PAD = 4;
const TITLE = 8;
const DIM = 10;
const AVAIL_W = HALF - PAD - DIM;
const AVAIL_H = HEIGHT - TITLE - DIM;
// Never drawn larger than life size (mm per cm).
const MAX_SCALE = 10;
// Dimension lines: distance from the drawing, gap at the outline, overshoot
// past the line, tick half-size, label distance.
const OFFSET = 3.5;
const GAP = 1;
const OVER = 1.2;
const TICK = 0.7;
const LABEL = 3.3;

const COLOR_MOLD = "#2563eb";
const COLOR_OBJECT = "#d97706";

const outlines = computed(() => {
  const mold = moldOutlines(props.mold);
  return mold ? { mold, object: objectOutlines(props.object) } : null;
});

function extent(m: ShapeOutline, o: ShapeOutline | undefined) {
  return {
    w: Math.max(m.width, o?.width ?? 0),
    h: Math.max(m.height, o?.height ?? 0),
  };
}

const scale = computed(() => {
  const o = outlines.value;
  if (!o) return 1;
  const side = extent(o.mold.side, o.object?.side);
  const top = extent(o.mold.top, o.object?.top);
  return Math.min(
    AVAIL_W / Math.max(side.w, top.w),
    AVAIL_H / Math.max(side.h, top.h),
    MAX_SCALE,
  );
});

function lengthLabel(cm: number, round = false): string {
  const value = n(units.toInput("length", cm), {
    maximumFractionDigits: units.system.value === "us" ? 2 : 1,
  });
  return `${round ? "Ø " : ""}${value} ${t(units.labelKey("length"))}`;
}

interface Dim {
  lines: string;
  ticks: string;
  label: string;
  transform: string;
}

// Span [xa, xb], extension lines from the outline at yRef down to the line.
function hDim(
  xa: number,
  xb: number,
  yRef: number,
  y: number,
  label: string,
): Dim {
  return {
    lines: `M${xa} ${yRef + GAP}V${y + OVER}M${xb} ${yRef + GAP}V${y + OVER}M${xa} ${y}H${xb}`,
    ticks: `M${xa - TICK} ${y + TICK}L${xa + TICK} ${y - TICK}M${xb - TICK} ${y + TICK}L${xb + TICK} ${y - TICK}`,
    label,
    transform: `translate(${(xa + xb) / 2} ${y + LABEL})`,
  };
}

// Span [ya, yb], extension lines from the outline at xRef right to the line.
function vDim(
  ya: number,
  yb: number,
  xRef: number,
  x: number,
  label: string,
): Dim {
  return {
    lines: `M${xRef + GAP} ${ya}H${x + OVER}M${xRef + GAP} ${yb}H${x + OVER}M${x} ${ya}V${yb}`,
    ticks: `M${x - TICK} ${ya + TICK}L${x + TICK} ${ya - TICK}M${x - TICK} ${yb + TICK}L${x + TICK} ${yb - TICK}`,
    label,
    transform: `translate(${x + LABEL} ${(ya + yb) / 2}) rotate(-90)`,
  };
}

interface View {
  title: string;
  x0: number;
  // Origin of the outline coordinates, in mm.
  origin: string;
  mold: ShapeOutline;
  object: ShapeOutline | null;
  section: boolean;
  dims: Dim[];
}

const views = computed<View[]>(() => {
  const o = outlines.value;
  if (!o) return [];
  const s = scale.value;

  // Section: base on the floor, the drawing centered in its band.
  const side = o.mold.side;
  const sideExt = extent(side, o.object?.side);
  const cx1 = PAD + AVAIL_W / 2;
  const base = TITLE + (AVAIL_H + sideExt.h * s) / 2;
  const sideHalfW = (side.width * s) / 2;

  // Top view, centered.
  const top = o.mold.top;
  const topExt = extent(top, o.object?.top);
  const cx2 = HALF + PAD + AVAIL_W / 2;
  const cy2 = TITLE + AVAIL_H / 2;
  const topHalfW = (top.width * s) / 2;
  const topHalfH = (top.height * s) / 2;
  // A circle is dimensioned from its left and right extremes.
  const topRef = top.round ? cy2 : cy2 + topHalfH;

  return [
    {
      title: t("print.sideView"),
      x0: PAD,
      origin: `translate(${cx1} ${base}) scale(${s})`,
      mold: side,
      object: o.object?.side ?? null,
      section: true,
      dims: [
        hDim(
          cx1 - sideHalfW,
          cx1 + sideHalfW,
          base,
          base + OFFSET,
          lengthLabel(side.width, side.round),
        ),
        vDim(
          base,
          base - side.height * s,
          cx1 + sideHalfW,
          cx1 + (sideExt.w * s) / 2 + OFFSET,
          lengthLabel(side.height),
        ),
      ],
    },
    {
      title: t("print.topView"),
      x0: HALF + PAD,
      origin: `translate(${cx2} ${cy2}) scale(${s})`,
      mold: top,
      object: o.object?.top ?? null,
      section: false,
      dims: [
        hDim(
          cx2 - topHalfW,
          cx2 + topHalfW,
          topRef,
          cy2 + (topExt.h * s) / 2 + OFFSET,
          lengthLabel(top.width, top.round),
        ),
        ...(top.round
          ? []
          : [
              vDim(
                cy2 + topHalfH,
                cy2 - topHalfH,
                cx2 + topHalfW,
                cx2 + (topExt.w * s) / 2 + OFFSET,
                lengthLabel(top.height),
              ),
            ]),
      ],
    },
  ];
});

// Stroke widths and hatch spacing are set in mm on paper, whatever the scale.
const mm = (v: number) => v / scale.value;
</script>

<template>
  <figure v-if="views.length">
    <svg
      :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
      class="block w-full overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <pattern
          :id="hatchId"
          patternUnits="userSpaceOnUse"
          :width="mm(1.3)"
          :height="mm(1.3)"
          patternTransform="rotate(45)"
        >
          <rect :width="mm(1.3)" :height="mm(1.3)" fill="#eff6ff" />
          <line :x1="mm(0.65)" y1="0" :x2="mm(0.65)" :y2="mm(1.3)" stroke="#93c5fd" :stroke-width="mm(0.2)" />
        </pattern>
      </defs>

      <g v-for="view in views" :key="view.title">
        <text
          :x="view.x0"
          y="3"
          font-size="2.3"
          font-weight="500"
          letter-spacing="0.4"
          fill="#6b7280"
          class="uppercase"
        >{{ view.title }}</text>

        <g :transform="view.origin" :stroke-width="mm(0.35)" stroke-linejoin="round">
          <path
            v-if="view.section"
            :d="view.mold.path"
            :fill="`url(#${hatchId})`"
          />
          <path
            v-if="view.object"
            :d="view.object.path"
            :fill="view.section ? '#fffbeb' : 'none'"
            :stroke="COLOR_OBJECT"
            :stroke-dasharray="view.section ? undefined : `${mm(1.2)} ${mm(0.8)}`"
          />
          <!-- On top, so an object larger than the mold never hides it. -->
          <path :d="view.mold.path" fill="none" :stroke="COLOR_MOLD" />
        </g>

        <g v-for="(dim, i) in view.dims" :key="i">
          <path :d="dim.lines" fill="none" stroke="#9ca3af" stroke-width="0.15" />
          <path :d="dim.ticks" fill="none" stroke="#1a1a1a" stroke-width="0.3" />
          <text
            :transform="dim.transform"
            text-anchor="middle"
            font-size="2.6"
            fill="#1a1a1a"
            class="font-mono"
          >{{ dim.label }}</text>
        </g>
      </g>
    </svg>

    <figcaption class="mt-[1.5mm] flex gap-[5mm] text-[7.5pt] text-muted">
      <span class="inline-flex items-center gap-[1.5mm]">
        <svg viewBox="0 0 6 4" class="h-[2.6mm] w-[4mm]" aria-hidden="true">
          <defs>
            <pattern :id="`${hatchId}-key`" patternUnits="userSpaceOnUse" width="1.3" height="1.3" patternTransform="rotate(45)">
              <rect width="1.3" height="1.3" fill="#eff6ff" />
              <line x1="0.65" y1="0" x2="0.65" y2="1.3" stroke="#93c5fd" stroke-width="0.2" />
            </pattern>
          </defs>
          <rect x="0.2" y="0.2" width="5.6" height="3.6" :fill="`url(#${hatchId}-key)`" :stroke="COLOR_MOLD" stroke-width="0.35" />
        </svg>
        {{ t("results.plaster") }}
      </span>
      <span v-if="outlines?.object" class="inline-flex items-center gap-[1.5mm]">
        <svg viewBox="0 0 6 4" class="h-[2.6mm] w-[4mm]" aria-hidden="true">
          <rect x="0.2" y="0.2" width="5.6" height="3.6" fill="#fffbeb" :stroke="COLOR_OBJECT" stroke-width="0.35" />
        </svg>
        {{ t("object.title") }}
      </span>
    </figcaption>
  </figure>
</template>
