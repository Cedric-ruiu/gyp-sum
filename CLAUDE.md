# gyp-sum — Calculateur de Plâtre

SPA statique hébergée sur GitHub Pages (`base: '/gyp-sum/'`). Aucun backend.

## Stack

- Vue 3 Composition API + `<script setup>` + TypeScript
- Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`), vue-i18n 11 (`legacy: false`)
- vue-router 5 (2 routes statiques pour le multi-pages i18n) + `@unhead/vue` 2
  (gestion du `<head>` par locale)
- Three.js + OrbitControls pour la scène 3D
- Biome 2.4 (lint + format + CSS Tailwind v4) — `yarn lint` (vérif) /
  `yarn format` (= `biome check . --write --unsafe`, auto-fix complet : format,
  lint safe + unsafe, organize imports). Toujours lancer `yarn format` avant
  commit. `css.parser.tailwindDirectives: true` est requis pour `@theme`, `@apply`.
  Note : `vcs.useIgnoreFile: true` dans `biome.json` → les répertoires gitignorés
  (`tmp/`, `dist/`) sont exclus du lint.
- `yarn build` = `vue-tsc --noEmit && vite-ssg build`
- Pré-rendu statique **multi-pages via vite-ssg + vue-router** : `src/main.ts`
  exporte `createApp = ViteSSG(App, { routes, base }, …)`. Deux routes
  pré-rendues : `/` (FR) et `/en` (EN) → `dist/index.html` et
  `dist/en/index.html` (`ssgOptions.dirStyle: 'nested'`). `App.vue` n'est qu'un
  `<RouterView/>` ; la page est `src/pages/HomePage.vue`. La locale est pilotée
  par `route.meta.locale` via un guard `router.beforeEach`. Vite 8 utilise
  Rolldown — vue-i18n doit être bundlé côté SSR (`ssr.noExternal: ["vue-i18n"]`)
  et les flags Vue définis (`__VUE_PROD_DEVTOOLS__` etc.) dans `vite.config.ts`.
- L'instance i18n est créée **par app** (`createAppI18n()`), pas en singleton :
  vite-ssg appelle la factory une fois par route, et un singleton partagé fait
  fuiter la locale d'une page à l'autre.
- **`@unhead/vue` épinglé en `^2.1.2`** (= version utilisée par vite-ssg). En v3,
  le `useHead` de l'app et le head de vite-ssg sont deux instances distinctes →
  rien n'est injecté dans le HTML pré-généré. Ne pas remonter sans aligner vite-ssg.
- Fonts : auto-hébergées dans `public/fonts/` (Fontsource, latin subset, woff2).
  Inter 300/400/500 + JetBrains Mono 300/400. Preload des 3 fichiers critiques
  dans `index.html`. Fallbacks avec metric overrides dans `main.css` pour CLS
  nul au font-swap. Pas de Google Fonts, pas de Bunny.

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
│   ├── index.ts            createAppI18n() (instance par app, SSG-safe), SUPPORTED_LOCALES = ['fr','en']
│   └── locales/{fr,en}.json   toutes les chaînes UI (fr = défaut/x-default)
├── pages/
│   └── HomePage.vue        la page (ex-App.vue) + useHead SEO par locale
├── components/
│   ├── MoldConfigurator.vue
│   ├── ObjectConfigurator.vue  (toggle saisie directe de volume)
│   ├── MixParameters.vue
│   ├── ResultPanel.vue
│   ├── SceneViewer.vue     Three.js canvas, autoRotate + OrbitControls
│   ├── HowToGuide.vue      section « Comment doser le plâtre » (tm()/rt())
│   ├── FaqSection.vue      FAQ accordéon <details> (tm()/rt()), sans JS
│   └── ui/
│       ├── NumberInput.vue  virgule/point acceptés, spinners masqués
│       ├── ShapeSelector.vue  généré depuis ShapeDefinition[], prop noneOption
│       ├── InfoTooltip.vue
│       └── LanguageSwitcher.vue  liens FR/EN (RouterLink, hreflang, aria-current)
└── App.vue                 shell racine : <RouterView/> uniquement
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
`text-accent-soft`, `text-accent-soft-strong`, `text-danger`. La forme verbose
`text-[color:var(--color-ink)]` fonctionne aussi mais préférer les alias courts.
`accent-soft-strong` est l'ambre foncé réservé au TEXTE (contraste WCAG AA) ;
`accent-soft` reste pour les bordures/aplats/3D.

Valeurs : ink `#1A1A1A`, muted `#6B7280`, line `#E5E7EB`, surface `#F9FAFB`,
accent `#2563EB`, accent-soft `#F59E0B`, accent-soft-strong `#B45309`, danger `#DC2626`.

## Design

- Police corps : Inter 300/400/500, valeurs numériques : JetBrains Mono 300/400
- Bordures 1px, pas d'ombres, `rounded` max (pas `rounded-xl`)
- Transitions 150–200 ms
- Pas de dark mode, pas de sélecteur d'unités
- Sélecteur de langue FR/EN dans le header (`ui/LanguageSwitcher.vue`)

## i18n

Deux locales : `fr` (défaut + x-default) et `en`. Toutes les chaînes UI passent
par `t()` / `$t()`. Pas de texte en dur dans les templates. Clés : `app`, `lang`,
`meta`, `intro`, `mold`, `object`, `shapes`, `fields`, `mix`, `results`,
`errors`, `units`, `toc`, `howto`, `faq`, `guide`, `footer`, `scene`. Pour les
tableaux de messages (steps, faq items), utiliser `tm()` + `rt()`.

- `meta.*` alimente le `<head>` par locale. Le `<head>` est généré par `useHead`
  dans `HomePage.vue` : title/description/keywords, canonical, hreflang
  réciproques (fr/en/x-default, FR = x-default), og/twitter, et les JSON-LD
  WebApplication/HowTo/FAQPage **construits depuis les mêmes clés i18n que le
  visible** (invariant schema == visible). `index.html` ne contient plus aucune
  balise locale-spécifique.
- ⚠️ Jamais de caractère `|` dans une valeur i18n : c'est le séparateur de pluriel
  de vue-i18n (`t()` ne renverrait que le 1er segment). Utiliser `—` / `/` / `:`.
- Convention EN : le ratio reste « kg de plâtre par litre d'eau » (formules
  inchangées), libellé « Plaster-to-water ratio » ; la FAQ EN mentionne la
  convention inverse « water-to-plaster ».

## Persistance localStorage

Clé `plaster-calc-state`, objet `{ mold, object, mix }`. Fallback silencieux.
Debounce 500 ms. La lecture du localStorage est **différée dans `onMounted`**
(SSR-safe : le pré-rendu utilise toujours les valeurs par défaut pour éviter
un mismatch d'hydratation).

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

- Pas de Pinia, pas de librairie UI (Vuetify, PrimeVue…). vue-router sert
  uniquement au multi-pages SSG i18n (2 routes statiques) — pas de logique métier
  ni de routes dynamiques.
- Pas de librairie de formulaires (VeeValidate…)
- Pas de Google Fonts
- Pas de GitHub Action de déploiement
- Pas de tests unitaires (Phase 1)
- Ne pas modifier les formules de calcul
