# gyp-sum — Calculateur de Plâtre

SPA statique hébergée sur GitHub Pages (`base: '/gyp-sum/'`). Aucun backend.

## Stack

- Vue 3 Composition API + `<script setup>` + TypeScript
- Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`), vue-i18n 10 (`legacy: false`)
- Three.js + OrbitControls pour la scène 3D
- Biome 2.4 (lint + format + CSS Tailwind v4) — `yarn lint` (vérif) /
  `yarn format` (= `biome check . --write --unsafe`, auto-fix complet : format,
  lint safe + unsafe, organize imports). Toujours lancer `yarn format` avant
  commit. `css.parser.tailwindDirectives: true` est requis pour `@theme`, `@apply`.
- `yarn build` = `vue-tsc --noEmit && vite build`
- Fonts : Bunny Fonts uniquement (pas Google Fonts)

## Architecture

```
src/
├── types/index.ts          Dimensions = Record<string,number> (clés = ShapeField.key)
├── shapes/
│   ├── types.ts            ShapeDefinition, ShapeField
│   └── registry.ts         boxShape/cylinderShape/sphereShape/halfSphereShape
│                           moldShapeRegistry  (box, cylinder)
│                           objectShapeRegistry (box, cylinder, sphere, half-sphere)
├── composables/
│   ├── useShapeVolume.ts   cm3ToLiters() — export nommé, utilisé par le registre
│   ├── useCalculator.ts    computed<CalculationResult> (formules figées, voir ci-dessous)
│   ├── useLocalStorage.ts  ref + watch debounce 500 ms, clé 'plaster-calc-state'
│   └── useThreeScene.ts    init/updateMold/updateObject/destroy (Three.js)
├── i18n/
│   ├── index.ts            locale 'fr' uniquement pour l'instant
│   └── locales/fr.json     toutes les chaînes UI
├── components/
│   ├── MoldConfigurator.vue
│   ├── ObjectConfigurator.vue  (toggle saisie directe de volume)
│   ├── MixParameters.vue
│   ├── ResultPanel.vue
│   ├── SceneViewer.vue     Three.js canvas, autoRotate + OrbitControls
│   └── ui/
│       ├── NumberInput.vue  virgule/point acceptés, spinners masqués
│       ├── ShapeSelector.vue  généré depuis ShapeDefinition[], prop noneOption
│       └── InfoTooltip.vue
└── App.vue                 layout 2 colonnes lg, guide accordéon en bas
```

## Règle centrale : pas de switch/case sur les formes dans les composants

Les configurateurs lisent `ShapeDefinition.fields[]` en boucle et appellent
`computeVolume(values)`. Ajouter une forme = 1 entrée dans `registry.ts` + clés
i18n. Ne jamais ajouter de branche `if/else` ou `switch` sur le type de forme
dans un composant Vue.

`useThreeScene` est la seule exception : il construit les géométries Three.js
avec des branches par forme (inévitable avec l'API Three.js).

## Formules de calcul — NE PAS MODIFIER

Constante : `gypsumDensity = 2.58` kg/L (non exposée à l'utilisateur).

```
netVolume  = moldVolume − objectVolume
water      = netVolume / (1 + ratio / 2.58)
plaster    = ratio × water
waterWithMargin   = water   × (1 + margin)
plasterWithMargin = plaster × (1 + margin)
```

Volumes (cm → litres via `cm3ToLiters = v / 1000`) :
- Pavé : `L × l × h`
- Cylindre : `π/4 × d² × h`
- Sphère : `π/6 × d³`
- Demi-sphère : `π/12 × d³`

## Palette couleurs (Tailwind v4 `@theme`)

Définie dans `src/assets/main.css`. Accessible via les classes canoniques Tailwind :
`text-ink`, `text-muted`, `border-line`, `bg-surface`, `text-accent`,
`text-accent-soft`, `text-danger`. La forme verbose `text-[color:var(--color-ink)]`
fonctionne aussi mais préférer les alias courts.

Valeurs : ink `#1A1A1A`, muted `#6B7280`, line `#E5E7EB`, surface `#F9FAFB`,
accent `#2563EB`, accent-soft `#F59E0B`, danger `#DC2626`.

## Design

- Police corps : Inter 300/400, valeurs numériques : JetBrains Mono 300/400
- Bordures 1px, pas d'ombres, `rounded` max (pas `rounded-xl`)
- Transitions 150–200 ms
- Pas de dark mode, pas de sélecteur de langue, pas de sélecteur d'unités

## i18n

Toutes les chaînes UI passent par `t()` / `$t()`. Pas de texte en dur dans les
templates. Structure des clés : `app`, `mold`, `object`, `shapes`, `fields`,
`mix`, `results`, `errors`, `units`, `guide`, `scene`.

## Persistance localStorage

Clé `plaster-calc-state`, objet `{ mold, object, mix }`. Fallback silencieux.
Debounce 500 ms.

## Système d'unités

`UnitSystem = 'metric'` uniquement. Dimensions en cm, volumes en litres, poids en kg.
`cm3ToLiters` isolée pour extension future — pas de sélecteur UI.

## Scène 3D (useThreeScene)

- `init(container)` → monte le renderer WebGL dans le div
- `updateMold(config)` / `updateObject(config)` → reconstruit les géométries
- `destroy()` → libère toutes les ressources (geometries, materials, renderer,
  controls, ResizeObserver)
- Auto-rotate par défaut ; pause au pointer/wheel, reprise après 3 s
- Rendu wireframe dual-layer : face `MeshBasicMaterial` (opacity 0.04) + `EdgesGeometry`
- Couleurs : moule arêtes `0x94a3b8` / pièce arêtes+faces `0xf59e0b` / grille `0xe2e8f0`
- `objectConfig.manualVolume !== null` ou `shape === 'none'` → pièce masquée, pas d'erreur
- Pièce positionnée au sol du moule (`y = -moldHeight/2 + objectHeight/2`)
- Demi-sphère : base plate (`CircleGeometry`) posée au sol du moule

## Ce qu'il ne faut pas faire

- Pas de Pinia, pas de router, pas de librairie UI (Vuetify, PrimeVue…)
- Pas de librairie de formulaires (VeeValidate…)
- Pas de Google Fonts
- Pas de GitHub Action de déploiement
- Pas de tests unitaires (Phase 1)
- Ne pas modifier les formules de calcul
