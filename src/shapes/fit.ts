import type { MoldConfig, ObjectConfig } from "@/types";
import { moldShapeRegistry, objectShapeRegistry } from "./registry";
import type { ShapeBounds } from "./types";

// Default gap between the object and the mold walls, in cm.
export const DEFAULT_FIT_MARGIN = 2.5;

// Rounded up to 0.1 cm so the mold always holds the object; toFixed drops
// float noise first (15.2 * 10 = 152.00000000000003).
function ceilTenth(v: number): number {
  return Math.ceil(Number((v * 10).toFixed(6))) / 10;
}

// Null when there is nothing to fit around: no object, or a volume typed in
// directly.
export function objectBounds(
  object: ObjectConfig | null | undefined,
): ShapeBounds | null {
  if (!object?.dimensions || object.manualVolume != null) return null;
  const def = objectShapeRegistry.find((s) => s.type === object.shape);
  if (!def?.bounds) return null;
  const dims = object.dimensions;
  return def.bounds(def.fields.map((f) => Number(dims[f.key]) || 0));
}

export function canFitMold(
  moldShape: string,
  object: ObjectConfig | null | undefined,
): boolean {
  const def = moldShapeRegistry.find((s) => s.type === moldShape);
  return !!def?.fitAround && objectBounds(object) !== null;
}

// While `fit` is on, the mold dimensions are derived from the object.
export function fitMold(mold: MoldConfig, object: ObjectConfig): MoldConfig {
  if (!mold.fit) return mold;
  const bounds = objectBounds(object);
  const fitAround = moldShapeRegistry.find(
    (s) => s.type === mold.shape,
  )?.fitAround;
  if (!bounds || !fitAround) return mold;
  const dims = fitAround(bounds, mold.fitMargin ?? DEFAULT_FIT_MARGIN);
  const dimensions = Object.fromEntries(
    Object.entries(dims).map(([k, v]) => [k, ceilTenth(v)]),
  );
  return { ...mold, dimensions };
}
