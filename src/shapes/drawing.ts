import type { Dimensions, MoldConfig, ObjectConfig } from "@/types";
import { moldShapeRegistry, objectShapeRegistry } from "./registry";
import type { ShapeDefinition, ShapeOutline, ShapeOutlines } from "./types";

const drawable = (o: ShapeOutline) =>
  Number.isFinite(o.width) &&
  Number.isFinite(o.height) &&
  o.width > 0 &&
  o.height > 0;

function outlines(
  def: ShapeDefinition | undefined,
  dims: Dimensions | null,
): ShapeOutlines | null {
  if (!def?.outline || !dims) return null;
  const o = def.outline(def.fields.map((f) => Number(dims[f.key]) || 0));
  return drawable(o.side) && drawable(o.top) ? o : null;
}

export function moldOutlines(mold: MoldConfig): ShapeOutlines | null {
  const def = moldShapeRegistry.find((s) => s.type === mold.shape);
  return outlines(def, mold.dimensions);
}

// Null when there is no object to draw: none, or a volume typed in directly.
export function objectOutlines(object: ObjectConfig): ShapeOutlines | null {
  if (object.manualVolume != null) return null;
  const def = objectShapeRegistry.find((s) => s.type === object.shape);
  return outlines(def, object.dimensions);
}
