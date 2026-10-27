# gyp-sum — Calculateur de Plâtre

SPA statique hébergée sur GitHub Pages (`base: '/gyp-sum/'`). Aucun backend.

## Stack

- Vue 3 Composition API + `<script setup>` + TypeScript
- Vite 8, Tailwind CSS v4 (`@tailwindcss/vite`), vue-i18n 11 (`legacy: false`)
- vue-router 5 (routes statiques pour le multi-pages i18n) + `@unhead/vue` 2
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
  exporte `createApp = ViteSSG(App, { routes, base }, …)`. Routes pré-rendues :
  le calculateur `/` (FR), `/en/` (EN), `/es/` (ES), `/de/` (DE), `/it/` (IT), `/pt/` (PT), et le guide
  `/moule-en-platre/` (FR) / `/en/how-to-make-a-plaster-mold/` (EN)
  (`src/pages/MoldGuidePage.vue`, chargé à la demande) → `dist/<route>/index.html` (`ssgOptions.dirStyle: 'nested'`).
  Nouvelle locale : route dans `main.ts`, entrée dans `SITE_PAGES` et
  `LOCALE_META` (`src/seo.ts`), `SUPPORTED_LOCALES`, clé `lang.<code>` dans
  toutes les locales, URL dans le `PRECACHE` de `public/sw.js`. `App.vue` n'est qu'un
  `<RouterView/>` ; la page est `src/pages/HomePage.vue`. La locale est pilotée
  par `route.meta.locale` via un guard `router.beforeEach`. Vite 8 utilise
  Rolldown — vue-i18n doit être bundlé côté SSR (`ssr.noExternal: ["vue-i18n"]`)
  et les flags Vue définis (`__VUE_PROD_DEVTOOLS__` etc.) dans `vite.config.ts`.
- **Sitemap généré au build** : `ssgOptions.includedRoutes` relève les routes
  pré-rendues, `onFinished` écrit `dist/sitemap.xml` (`src/sitemap.ts`), avec
  les alternates hreflang et `lastmod`. Pas de `public/sitemap.xml`. Toute
  route doit avoir son entrée dans `SITE_PAGES` (`src/seo.ts`), sinon le build
  échoue.
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
│   ├── useContactAddress.ts adresse e-mail encodée (décodée en onMounted), mailto,
│   │                       événement contact-email
│   ├── useLocalStorage.ts  ref + watch debounce 500 ms, clé 'plaster-calc-state'
│   └── useThreeScene.ts    init/updateMold/updateObject/destroy (Three.js)
├── i18n/
│   ├── index.ts            createAppI18n() (instance par app, SSG-safe), SUPPORTED_LOCALES = ['fr','en','es','de','it','pt']
│   └── locales/{fr,en,es,de,it,pt}.json   toutes les chaînes UI (fr = défaut, en = x-default)
├── pages/
│   ├── HomePage.vue        le calculateur (ex-App.vue) + useHead SEO par locale
│   └── MoldGuidePage.vue   guide « faire un moule en plâtre » (clés `moldGuide.*`,
│                           fr et en) + JSON-LD Article
├── components/
│   ├── SiteHeader.vue      logo (lien vers le calculateur de la locale) + sélecteur
│   │                       de langue du groupe de pages (prop `group`)
│   ├── SiteFooter.vue      pied de page commun (auteur, contact, partage, GitHub, PWA)
│   ├── MoldConfigurator.vue
│   ├── ObjectConfigurator.vue  (toggle saisie directe de volume)
│   ├── MixParameters.vue
│   ├── ResultPanel.vue
│   ├── SceneViewer.vue     Three.js canvas, autoRotate + OrbitControls
│   ├── HowToGuide.vue      section « Comment doser le plâtre » (tm()/rt())
│   ├── ContributeNote.vue  « Une forme manque ? » sous les résultats (issues GitHub +
│   │                       e-mail, événements avec placement: results)
│   ├── AuthorNote.vue      « Pourquoi cet outil » : texte de l'auteur (author.paragraphs),
│   │                       masqué tant que le tableau est vide
│   ├── FaqSection.vue      FAQ accordéon <details> (tm()/rt()), sans JS
│   └── ui/
│       ├── NumberInput.vue  virgule/point acceptés, spinners masqués
│       ├── ShapeSelector.vue  généré depuis ShapeDefinition[], prop noneOption
│       ├── InfoTooltip.vue  bouton « ? » hors des <h2> (prop `label` → « Aide : … »),
│       │                    texte rendu dans la page (v-show + aria-describedby)
│       ├── LanguageSwitcher.vue  un lien par traduction du groupe (RouterLink, hreflang,
│       │                         aria-current), masqué si la page n'existe qu'en une langue
│       ├── ContactLink.vue  lien mailto du footer, adresse décodée en onMounted
│       ├── ShareButton.vue  partage natif (mobile) / copie du lien (desktop)
│       └── SegmentedControl.vue  choix exclusif (unités, saisie du ratio)
├── seo.ts                  SITE_URL, SITE_PAGES (route, locale, groupe hreflang,
│                           lastModified), LOCALE_META (lang, og:locale, devise),
│                           pageFor() : source du head, du sitemap, du sélecteur
│                           de langue et du partage
├── sitemap.ts              buildSitemap() : sitemap.xml au build (vite.config.ts)
├── units.ts                conversions d'affichage métrique ↔ US (provide/inject)
├── analytics.ts            track() : événements Umami, no-op si le script est absent
└── App.vue                 shell racine : <RouterView/> uniquement
```

## Mesure (Umami)

Script `stats.cedric-ruiu.fr/m.js` dans `index.html` (envoi vers le même hôte,
autorisé par la CSP `connect-src`). Événements : `calculator-use` (`lang`), une
fois par chargement, à la première valeur réellement modifiée par le visiteur
(setters de `HomePage.vue` ; la restauration du localStorage n'est pas comptée),
`contact-email` (`method` : mailto / copy), `share` (`method` : native / copy),
`pwa-install` (`outcome`), `github-repo`, `github-issues`. Les liens
d'appel à contribuer sous les résultats (`ContributeNote.vue`) envoient les
mêmes événements `github-issues` / `contact-email`, avec `placement: results`. Liens simples :
attribut `data-umami-event` ; tout élément qui a déjà un gestionnaire de clic :
`track()` de `src/analytics.ts` dans ce gestionnaire (le traceur intercepte le
clic des éléments porteurs de l'attribut).

L'adresse email n'apparaît jamais en clair (ni HTML pré-rendu, ni bundle JS) :
elle est stockée en base64 dans `ContactLink.vue` et décodée après montage.
Ne pas l'ajouter au JSON-LD.

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
- Pas de dark mode
- Sélecteur d'unités et de saisie du ratio sur la page EN uniquement (voir
  « Système d'unités »)
- Sélecteur de langue dans le header (une entrée par traduction de la page) (`ui/LanguageSwitcher.vue`)

## i18n

Locales : `fr` (défaut), `en` (x-default), `es` (espagnol neutre, tutoiement,
« yeso » ; « escayola » cité une fois) `de` (tutoiement, « Gips-Wasser-
Verhältnis », « einsumpfen ») et `it` (tutoiement, « dosi gesso acqua », jamais
« gesso ceramico », qui désigne en Italie une poudre de loisirs) et `pt` (portugais neutre à
tendance brésilienne, « você », og:locale pt_BR ; jamais « calculadora de gesso »
seul, qui vise le drywall) : `es`, `de`, `it` et `pt` reprennent la structure
de `fr.json`, métriques. Toutes les chaînes UI passent
par `t()` / `$t()`. Pas de texte en dur dans les templates. Clés : `app`, `format`, `lang`, `help`, `contribute`,
`meta`, `intro`, `mold`, `object`, `shapes`, `fields`, `mix`, `results`,
`errors`, `units`, `unitSystem`, `toc`, `howto`, `faq`, `guide`, `yourPlaster`,
`author`, `footer`, `scene`, `moldGuide` (fr et en ; pas en es : ses liens — sommaire, mode d'emploi, pied de page — n'apparaissent
que si `localePage('moldGuide', locale)` existe). Pour les
tableaux de messages (steps, faq items), utiliser `tm()` + `rt()`.

- **Espaces insécables (fr)** : avant `? ! ; :` et à l'intérieur de `« »`, écrire
  ` ` dans `fr.json`, jamais `&nbsp;` (les chaînes sont rendues en texte,
  l'entité s'afficherait telle quelle). Un libellé suivi de deux-points passe
  par `t("format.label", { label: … })` (`{label} :` en fr, `{label}:`
  ailleurs), jamais un ` :` écrit dans le template.

- **Date de modification** : `lastModified` de la page dans `SITE_PAGES`
  alimente `<lastmod>` du sitemap et `dateModified` du JSON-LD. À mettre à jour
  quand le contenu visible change (textes i18n, sections), pas pour du code ou
  du style.
- `meta.*` alimente le `<head>` par locale. Le `<head>` est généré par `useHead`
  dans `HomePage.vue` : title/description/keywords, canonical, hreflang
  réciproques (une par locale + x-default, EN = x-default, FR à défaut ; `hreflangLinks()` de
  `src/seo.ts`, même source que le sitemap), og/twitter, et les JSON-LD
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
Préférences d'affichage à part : clé `plaster-calc-units`,
`{ system: 'metric' | 'us', ratioMode: 'ratio' | 'consistency' }` (changer
d'unité n'est pas une utilisation du calculateur).
Debounce 500 ms. La lecture du localStorage est **différée dans `onMounted`**
(SSR-safe : le pré-rendu utilise toujours les valeurs par défaut pour éviter
un mismatch d'hydratation).

## Système d'unités

L'état et les formules restent **toujours métriques** (cm, L, kg, ratio en
kg/L). `src/units.ts` convertit seulement à l'affichage et à la saisie :
`toInput` / `fromInput` (valeurs de champ arrondies à 2 décimales en US ;
une valeur ré-émise inchangée au blur rend la valeur stockée telle quelle,
sans conversion aller-retour) et `convert` (affichages en lecture seule).

- `UnitSystem = 'metric' | 'us'`. US : pouces, tasses US (eau, volumes),
  livres (plâtre), avec onces liquides US / onces sous les résultats. Jamais
  le plâtre en tasses (pas de masse volumique apparente de poudre fiable).
- `RatioMode = 'ratio' | 'consistency'` : consistency = 100 ÷ ratio (parts
  d'eau pour 100 parts de plâtre, en poids) ; l'autre notation est affichée
  sous le champ.
- Pages FR, ES, DE, IT et PT : toujours métriques, ratio en kg/L, aucun sélecteur. Page EN :
  métrique par défaut ; le pré-rendu est métrique et la préférence est lue
  dans `onMounted` (pas d'écart d'hydratation).
- Les composants lisent `useUnits()` (injecté par `HomePage.vue`) ; un champ
  de forme est converti selon son `unitKey` (`units.cm` → longueur,
  `units.liters` → volume).

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
  uniquement au multi-pages SSG i18n (routes statiques) — pas de logique métier
  ni de routes dynamiques.
- Pas de librairie de formulaires (VeeValidate…)
- Pas de Google Fonts
- Pas de GitHub Action de déploiement
- Pas de tests unitaires (Phase 1)
- Ne pas modifier les formules de calcul
