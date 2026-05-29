import { ViteSSG } from "vite-ssg";
import type { RouteRecordRaw } from "vue-router";
import App from "./App.vue";
import "./assets/main.css";
import { i18n } from "./i18n";
import HomePage from "./pages/HomePage.vue";

const routes: RouteRecordRaw[] = [
  { path: "/", component: HomePage, meta: { locale: "fr" } },
  { path: "/en", component: HomePage, meta: { locale: "en" } },
];

export const createApp = ViteSSG(
  App,
  { routes, base: "/gyp-sum/" },
  ({ app, router }) => {
    app.use(i18n);
    router.beforeEach((to) => {
      i18n.global.locale.value = (to.meta.locale ??
        "fr") as typeof i18n.global.locale.value;
    });
  },
);
