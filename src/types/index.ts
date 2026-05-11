export type ShapeType = "box" | "cylinder";
export type ObjectShapeType =
  | "box"
  | "cylinder"
  | "sphere"
  | "half-sphere"
  | "none";

// Préparation système d'unités (Phase ultérieure)
// Pour l'instant seul 'metric' est implémenté.
// Quand 'imperial' sera ajouté, les dimensions seront en inches,
// les volumes en cubic inches (puis convertis en litres pour le calcul),
// et les poids en lbs.
export type UnitSystem = "metric"; // | 'imperial' (futur)

// Dimensions stockées sous forme générique pour s'aligner avec le registre
// dynamique de formes. Les clés correspondent à `ShapeField.key`
// (ex. 'length' / 'width' / 'height' pour un pavé, 'diameter' / 'height'
// pour un cylindre, 'diameter' pour une sphère).
export type Dimensions = Record<string, number>;

// Conservés pour documentation / référence future.
export interface BoxDimensions extends Dimensions {
  length: number;
  width: number;
  height: number;
}
export interface CylinderDimensions extends Dimensions {
  diameter: number;
  height: number;
}
export interface SphereDimensions extends Dimensions {
  diameter: number;
}

export interface MoldConfig {
  shape: ShapeType;
  dimensions: Dimensions;
}

export interface ObjectConfig {
  shape: ObjectShapeType;
  dimensions: Dimensions | null;
  manualVolume: number | null; // litres, si saisie directe
}

export interface MixParams {
  ratio: number; // kg/L, défaut 1.5
  margin: number; // 0-0.5, défaut 0.1
  gypsumDensity: number; // constante 2.58
}

export interface CalculationResult {
  moldVolume: number; // litres
  objectVolume: number; // litres
  netVolume: number; // litres
  water: number; // litres
  plaster: number; // kg
  waterWithMargin: number;
  plasterWithMargin: number;
  isValid: boolean;
  errorMessage: string | null;
}

export interface PersistedState {
  mold: MoldConfig;
  object: ObjectConfig;
  mix: {
    ratio: number;
    margin: number;
  };
}
