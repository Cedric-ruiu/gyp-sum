import { type ComputedRef, type InjectionKey, inject, provide } from "vue";
import type { RatioMode, UnitSystem } from "@/types";

// Display-side unit conversion. The calculator state and formulas always
// stay metric (cm, L, kg, kg/L): values are converted only when shown and
// converted back when the visitor types, so the formulas never change.

export type Quantity = "length" | "volume" | "mass";
// Secondary display units, shown next to the results in US mode.
export type SmallQuantity = "smallVolume" | "smallMass";

interface UnitDef {
  labelKey: string;
  // Metric amount (cm, L or kg) in one display unit.
  factor: number;
}

const US_UNITS: Record<Quantity | SmallQuantity, UnitDef> = {
  length: { labelKey: "units.in", factor: 2.54 },
  volume: { labelKey: "units.cupsUs", factor: 0.2365882365 },
  mass: { labelKey: "units.lb", factor: 0.45359237 },
  smallVolume: { labelKey: "units.flOzUs", factor: 0.0295735295625 },
  smallMass: { labelKey: "units.oz", factor: 0.028349523125 },
};

const METRIC_LABELS: Record<Quantity, string> = {
  length: "units.cm",
  volume: "units.liters",
  mass: "units.kg",
};

// Converted values are rounded for the inputs, so a blur that re-emits the
// shown value can be told apart from a real edit.
const INPUT_DECIMALS = 2;
const CONSISTENCY_DECIMALS = 1;
const RATIO_DECIMALS = 2;

function round(v: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}

export interface UnitsContext {
  system: ComputedRef<UnitSystem>;
  ratioMode: ComputedRef<RatioMode>;
  // Unit and ratio switches are offered on the English page only.
  switchable: ComputedRef<boolean>;
  setRatioMode: (mode: RatioMode) => void;
}

const UNITS_KEY: InjectionKey<UnitsContext> = Symbol("units");

export function provideUnits(ctx: UnitsContext): void {
  provide(UNITS_KEY, ctx);
}

export function useUnits() {
  const ctx = inject(UNITS_KEY);
  if (!ctx) throw new Error("useUnits() called without provideUnits()");
  const { system, ratioMode, switchable, setRatioMode } = ctx;

  const isUs = () => system.value === "us";

  function labelKey(q: Quantity | SmallQuantity): string {
    if (isUs()) return US_UNITS[q].labelKey;
    return METRIC_LABELS[q as Quantity];
  }

  // Shape fields declare their unit by i18n key; map it to a quantity.
  function fieldQuantity(unitKey: string): Quantity {
    return unitKey === "units.liters" ? "volume" : "length";
  }

  // Unrounded conversion, for read-only displays.
  function convert(q: Quantity | SmallQuantity, metric: number): number {
    return isUs() ? metric / US_UNITS[q].factor : metric;
  }

  function toInput(q: Quantity, metric: number): number {
    return isUs() ? round(convert(q, metric), INPUT_DECIMALS) : metric;
  }

  function fromInput(q: Quantity, shown: number, current: number): number {
    if (!isUs()) return shown;
    if (shown === toInput(q, current)) return current;
    return shown * US_UNITS[q].factor;
  }

  function ratioToInput(ratio: number): number {
    if (ratioMode.value === "consistency") {
      return ratio > 0 ? round(100 / ratio, CONSISTENCY_DECIMALS) : 0;
    }
    return round(ratio, RATIO_DECIMALS);
  }

  function ratioFromInput(shown: number, current: number): number {
    if (shown === ratioToInput(current)) return current;
    if (ratioMode.value === "consistency") return shown > 0 ? 100 / shown : 0;
    return shown;
  }

  return {
    system,
    ratioMode,
    switchable,
    setRatioMode,
    labelKey,
    fieldQuantity,
    convert,
    toInput,
    fromInput,
    ratioToInput,
    ratioFromInput,
  };
}
