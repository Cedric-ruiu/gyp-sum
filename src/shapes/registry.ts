import { cm3ToLiters } from "@/composables/useShapeVolume";
import type { ShapeBounds, ShapeDefinition, ShapeOutline } from "./types";

// Bounds of an object with a round footprint.
const roundBounds = (diameter: number, height: number): ShapeBounds => ({
  length: diameter,
  width: diameter,
  height,
  footprintDiameter: diameter,
});

// Outline builders for the printed drawing (see ShapeOutline).
const circlePath = (r: number, cy = 0) =>
  `M${-r} ${cy}A${r} ${r} 0 1 0 ${r} ${cy}A${r} ${r} 0 1 0 ${-r} ${cy}Z`;

const rectSide = (w: number, h: number): ShapeOutline => ({
  path: `M${-w / 2} 0H${w / 2}V${-h}H${-w / 2}Z`,
  width: w,
  height: h,
});

const rectTop = (w: number, d: number): ShapeOutline => ({
  path: `M${-w / 2} ${-d / 2}H${w / 2}V${d / 2}H${-w / 2}Z`,
  width: w,
  height: d,
});

// Concentric circles seen from above; the widest sets the size.
const circlesTop = (...diameters: number[]): ShapeOutline => {
  const d = Math.max(...diameters);
  return {
    path: diameters.map((di) => circlePath(di / 2)).join(""),
    width: d,
    height: d,
    round: true,
  };
};

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
  bounds: ([l, w, h]) => ({
    length: l,
    width: w,
    height: h,
    footprintDiameter: Math.hypot(l, w),
  }),
  fitAround: (b, m) => ({
    length: b.length + 2 * m,
    width: b.width + 2 * m,
    height: b.height + m,
  }),
  outline: ([l, w, h]) => ({ side: rectSide(l, h), top: rectTop(l, w) }),
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
  bounds: ([d, h]) => roundBounds(d, h),
  fitAround: (b, m) => ({
    diameter: b.footprintDiameter + 2 * m,
    height: b.height + m,
  }),
  outline: ([d, h]) => ({
    side: { ...rectSide(d, h), round: true },
    top: circlesTop(d),
  }),
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
  bounds: ([d1, d2, h]) => roundBounds(Math.max(d1, d2), h),
  outline: ([d1, d2, h]) => ({
    side: {
      path: `M${-d1 / 2} 0H${d1 / 2}L${d2 / 2} ${-h}H${-d2 / 2}Z`,
      width: Math.max(d1, d2),
      height: h,
      round: true,
    },
    top: circlesTop(d1, d2),
  }),
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
  bounds: ([d]) => roundBounds(d, d),
  outline: ([d]) => ({
    side: { path: circlePath(d / 2, -d / 2), width: d, height: d, round: true },
    top: circlesTop(d),
  }),
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
  bounds: ([d]) => roundBounds(d, d / 2),
  outline: ([d]) => ({
    side: {
      path: `M${-d / 2} 0A${d / 2} ${d / 2} 0 0 1 ${d / 2} 0Z`,
      width: d,
      height: d / 2,
      round: true,
    },
    top: circlesTop(d),
  }),
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
  // Taller than its base radius, the cap bulges past its base: it is then as
  // wide as its sphere, of diameter d² / 4h + h.
  bounds: ([d, h]) => roundBounds(h > d / 2 ? (d * d) / (4 * h) + h : d, h),
  outline: ([d, h]) => {
    // Arc of the cap's sphere, radius (a² + h²) / 2h; the large arc once the
    // cap is taller than its base radius.
    const a = d / 2;
    const r = (a * a + h * h) / (2 * h);
    const large = h > a ? 1 : 0;
    const width = h > a ? 2 * r : d;
    return {
      side: {
        path: `M${-a} 0A${r} ${r} 0 ${large} 1 ${a} 0Z`,
        width,
        height: h,
        round: true,
      },
      top: circlesTop(width),
    };
  },
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
