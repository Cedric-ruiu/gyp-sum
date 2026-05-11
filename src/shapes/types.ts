export interface ShapeField {
  key: string; // identifiant du champ ('length', 'diameter', …)
  labelKey: string; // clé i18n pour le label
  unitKey: string; // clé i18n pour l'unité ('units.cm')
  defaultValue: number;
  min: number;
}

export interface ShapeDefinition {
  type: string; // identifiant unique
  labelKey: string; // clé i18n pour le nom affiché
  fields: ShapeField[]; // champs de saisie
  computeVolume: (values: number[]) => number; // retourne des litres
  icon?: string; // nom d'icône SVG (optionnel)
}
