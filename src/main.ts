import { ViteSSG } from "vite-ssg";
import type { RouteRecordRaw } from "vue-router";
import App from "./App.vue";
import "./assets/main.css";
import { createAppI18n } from "./i18n";
import HomePage from "./pages/HomePage.vue";

const routes: RouteRecordRaw[] = [
  { path: "/", component: HomePage, meta: { locale: "fr" } },
  { path: "/en/", component: HomePage, meta: { locale: "en" } },
  { path: "/es/", component: HomePage, meta: { locale: "es" } },
  {
    path: "/moule-en-platre/",
    component: () => import("./pages/MoldGuidePage.vue"),
    meta: { locale: "fr" },
  },
  {
    path: "/en/how-to-make-a-plaster-mold/",
    component: () => import("./pages/MoldGuidePage.vue"),
    meta: { locale: "en" },
  },
];

export const createApp = ViteSSG(
  App,
  { routes, base: "/gyp-sum/" },
  ({ app, router }) => {
    const i18n = createAppI18n();
    app.use(i18n);
    router.beforeEach((to) => {
      i18n.global.locale.value = (to.meta.locale ??
        "fr") as typeof i18n.global.locale.value;
    });
  },
);
