import { type ComputedRef, computed, type Ref } from "vue";
import {
  getShape,
  moldShapeRegistry,
  objectShapeRegistry,
} from "@/shapes/registry";
import type {
  CalculationResult,
  MixParams,
  MoldConfig,
  ObjectConfig,
} from "@/types";

function computeVolumeFromConfig(
  shapeType: string,
  dims: Record<string, number> | null,
  registry = moldShapeRegistry,
): number {
  const def = registry.find((s) => s.type === shapeType) ?? getShape(shapeType);
  if (!def || !dims) return 0;
  const values = def.fields.map((f) => Number(dims[f.key]) || 0);
  return def.computeVolume(values);
}

export function useCalculator(
  mold: Ref<MoldConfig>,
  object: Ref<ObjectConfig>,
  mix: Ref<MixParams>,
): ComputedRef<CalculationResult> {
  return computed<CalculationResult>(() => {
    const moldVolume = computeVolumeFromConfig(
      mold.value.shape,
      mold.value.dimensions as unknown as Record<string, number>,
      moldShapeRegistry,
    );

    let objectVolume = 0;
    if (object.value.shape !== "none") {
      if (
        object.value.manualVolume !== null &&
        object.value.manualVolume !== undefined
      ) {
        objectVolume = Number(object.value.manualVolume) || 0;
      } else {
        objectVolume = computeVolumeFromConfig(
          object.value.shape,
          object.value.dimensions as unknown as Record<string, number>,
          objectShapeRegistry,
        );
      }
    }

    const netVolume = moldVolume - objectVolume;
    const ratio = Number(mix.value.ratio) || 0;
    const margin = Number(mix.value.margin) || 0;
    const density = mix.value.gypsumDensity;

    const base: CalculationResult = {
      moldVolume,
      objectVolume,
      netVolume,
      water: 0,
      plaster: 0,
      waterWithMargin: 0,
      plasterWithMargin: 0,
      isValid: false,
      errorMessage: null,
    };

    if (ratio <= 0) {
      return { ...base, errorMessage: "errors.invalidRatio" };
    }
    if (netVolume <= 0) {
      return { ...base, errorMessage: "errors.volumeExceeded" };
    }

    const water = netVolume / (1 + ratio / density);
    const plaster = ratio * water;

    return {
      ...base,
      water,
      plaster,
      waterWithMargin: water * (1 + margin),
      plasterWithMargin: plaster * (1 + margin),
      isValid: true,
    };
  });
}
