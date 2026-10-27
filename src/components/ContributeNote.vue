<script setup lang="ts">
import { I18nT, useI18n } from "vue-i18n";
import { useContactAddress } from "@/composables/useContactAddress";

const { t } = useI18n();

// Same events as the footer links, with a placement to tell them apart.
const { href, trackContact } = useContactAddress("results");
</script>

<template>
  <I18nT keypath="contribute.text" tag="p" class="mt-3 text-sm font-light leading-relaxed text-muted">
    <template #github>
      <a
        href="https://github.com/Cedric-ruiu/gyp-sum/issues"
        data-umami-event="github-issues"
        data-umami-event-placement="results"
        target="_blank"
        rel="noopener noreferrer"
        class="link"
      >{{ t("contribute.github") }}</a>
    </template>
    <template #email>
      <a
        :href="href"
        class="link"
        @click="trackContact('mailto')"
      >{{ t("contribute.email") }}</a>
    </template>
  </I18nT>
</template>
