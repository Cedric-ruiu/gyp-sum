import type { Dimensions } from "@/types";

export interface ShapeField {
  key: string; // identifiant du champ ('length', 'diameter', …)
  labelKey: string; // clé i18n pour le label
  unitKey: string; // clé i18n pour l'unité ('units.cm')
  defaultValue: number;
  min: number;
}

// Outer size of an object (cm), used to fit a mold around it.
export interface ShapeBounds {
  length: number;
  width: number;
  height: number;
  // Diameter of the smallest circle around the footprint.
  footprintDiameter: number;
}

// 2D outline for the printed drawing: an SVG path in cm, y pointing down.
// Side view: centered on x = 0, base on y = 0, top at y = -height. Top view:
// centered on the origin.
export interface ShapeOutline {
  path: string;
  width: number;
  height: number;
  // The width is a diameter (dimensioned "Ø"); a round top view has no depth.
  round?: boolean;
}

export interface ShapeOutlines {
  side: ShapeOutline;
  top: ShapeOutline;
}

export interface ShapeDefinition {
  type: string; // identifiant unique
  labelKey: string; // clé i18n pour le nom affiché
  fields: ShapeField[]; // champs de saisie
  computeVolume: (values: number[]) => number; // retourne des litres
  icon?: string; // nom d'icône SVG (optionnel)
  // Object shapes: outer size, from the field values in `fields` order.
  bounds?: (values: number[]) => ShapeBounds;
  // Mold shapes: smallest mold around `bounds`, with `margin` on each side
  // and on top.
  fitAround?: (bounds: ShapeBounds, margin: number) => Dimensions;
  // Side and top outlines for the printed workshop sheet.
  outline?: (values: number[]) => ShapeOutlines;
}
