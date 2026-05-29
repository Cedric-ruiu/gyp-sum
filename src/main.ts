import { ViteSSG } from "vite-ssg/single-page";
import App from "./App.vue";
import "./assets/main.css";
import { i18n } from "./i18n";

export const createApp = ViteSSG(App, ({ app }) => {
  app.use(i18n);
});
