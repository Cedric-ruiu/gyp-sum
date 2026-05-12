import { cm3ToLiters } from "@/composables/useShapeVolume";
import type { ShapeDefinition } from "./types";

export const boxShape: ShapeDefinition = {
  type: "box",
  labelKey: "shapes.box",
  icon: "box",
  fields: [
    {
      key: "length",
      labelKey: "fields.length",
      unitKey: "units.cm",
      defaultValue: 18,
      min: 0,
    },
    {
      key: "width",
      labelKey: "fields.width",
      unitKey: "units.cm",
      defaultValue: 17,
      min: 0,
    },
    {
      key: "height",
      labelKey: "fields.height",
      unitKey: "units.cm",
      defaultValue: 10,
      min: 0,
    },
  ],
  computeVolume: ([l, w, h]) => cm3ToLiters(l * w * h),
};

export const cylinderShape: ShapeDefinition = {
  type: "cylinder",
  labelKey: "shapes.cylinder",
  icon: "cylinder",
  fields: [
    {
      key: "diameter",
      labelKey: "fields.diameter",
      unitKey: "units.cm",
      defaultValue: 10,
      min: 0,
    },
    {
      key: "height",
      labelKey: "fields.height",
      unitKey: "units.cm",
      defaultValue: 10,
      min: 0,
    },
  ],
  computeVolume: ([d, h]) => cm3ToLiters((Math.PI / 4) * d ** 2 * h),
};

export const frustumShape: ShapeDefinition = {
  type: "frustum",
  labelKey: "shapes.frustum",
  icon: "frustum",
  fields: [
    {
      key: "diameterBottom",
      labelKey: "fields.diameterBottom",
      unitKey: "units.cm",
      defaultValue: 10,
      min: 0,
    },
    {
      key: "diameterTop",
      labelKey: "fields.diameterTop",
      unitKey: "units.cm",
      defaultValue: 8,
      min: 0,
    },
    {
      key: "height",
      labelKey: "fields.height",
      unitKey: "units.cm",
      defaultValue: 10,
      min: 0,
    },
  ],
  computeVolume: ([d1, d2, h]) =>
    cm3ToLiters(((Math.PI * h) / 12) * (d1 * d1 + d1 * d2 + d2 * d2)),
};

export const sphereShape: ShapeDefinition = {
  type: "sphere",
  labelKey: "shapes.sphere",
  icon: "sphere",
  fields: [
    {
      key: "diameter",
      labelKey: "fields.diameter",
      unitKey: "units.cm",
      defaultValue: 10,
      min: 0,
    },
  ],
  computeVolume: ([d]) => cm3ToLiters((Math.PI / 6) * d ** 3),
};

export const halfSphereShape: ShapeDefinition = {
  type: "half-sphere",
  labelKey: "shapes.halfSphere",
  icon: "half-sphere",
  fields: [
    {
      key: "diameter",
      labelKey: "fields.diameter",
      unitKey: "units.cm",
      defaultValue: 10,
      min: 0,
    },
  ],
  computeVolume: ([d]) => cm3ToLiters((Math.PI / 12) * d ** 3),
};

export const sphericalCapShape: ShapeDefinition = {
  type: "spherical-cap",
  labelKey: "shapes.sphericalCap",
  icon: "spherical-cap",
  fields: [
    {
      key: "diameter",
      labelKey: "fields.diameter",
      unitKey: "units.cm",
      defaultValue: 12,
      min: 0,
    },
    {
      key: "height",
      labelKey: "fields.height",
      unitKey: "units.cm",
      defaultValue: 4,
      min: 0,
    },
  ],
  computeVolume: ([d, h]) =>
    cm3ToLiters(((Math.PI * h) / 24) * (3 * d * d + 4 * h * h)),
};

export const manualVolumeShape: ShapeDefinition = {
  type: "manual",
  labelKey: "shapes.manual",
  icon: "manual",
  fields: [
    {
      key: "volume",
      labelKey: "fields.volume",
      unitKey: "units.liters",
      defaultValue: 0,
      min: 0,
    },
  ],
  computeVolume: ([v]) => v,
};

export const shapeRegistry: ShapeDefinition[] = [
  boxShape,
  cylinderShape,
  frustumShape,
  sphereShape,
  halfSphereShape,
  sphericalCapShape,
  manualVolumeShape,
];

// Sous-ensemble : formes valides pour un moule (Phase 1).
export const moldShapeRegistry: ShapeDefinition[] = [boxShape, cylinderShape];

// Sous-ensemble : formes valides pour une pièce interne.
export const objectShapeRegistry: ShapeDefinition[] = [
  boxShape,
  cylinderShape,
  frustumShape,
  sphereShape,
  halfSphereShape,
  sphericalCapShape,
  manualVolumeShape,
];

export function getShape(type: string): ShapeDefinition | undefined {
  return shapeRegistry.find((s) => s.type === type);
}
