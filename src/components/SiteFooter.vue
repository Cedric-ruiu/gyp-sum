<script setup lang="ts">
import { useI18n } from "vue-i18n";
import ContactLink from "@/components/ui/ContactLink.vue";
import ShareButton from "@/components/ui/ShareButton.vue";
import { usePwaInstall } from "@/composables/usePwaInstall";
import { AUTHOR_URL } from "@/seo";

const { t } = useI18n();

const { showFooterLink, triggerInstall } = usePwaInstall();
</script>

<template>
  <footer class="border-t border-line">
    <div class="mx-auto max-w-6xl px-6 py-10 flex flex-col sm:flex-row gap-8 justify-between">
      <div class="flex flex-col gap-2">
        <p class="text-xs font-light tracking-widest uppercase text-muted">GypSum</p>
        <p class="text-xs font-light text-muted leading-relaxed max-w-xs">{{ t("footer.tagline") }}</p>
        <p class="mt-1 text-xs font-light text-muted">
          {{ t("footer.createdBy") }}
          <a
            :href="AUTHOR_URL"
            target="_blank"
            rel="author noopener"
            class="text-ink underline decoration-line underline-offset-2 hover:decoration-current transition-colors duration-150"
          >Cédric Ruiu</a>, {{ t("footer.authorRole") }}.
        </p>
        <p class="text-xs font-light text-muted">
          {{ t("footer.madeBy") }}
          <a
            :href="AUTHOR_URL"
            target="_blank"
            rel="noopener"
            class="text-ink underline decoration-line underline-offset-2 hover:decoration-current transition-colors duration-150"
          >cedric-ruiu.fr</a>, {{ t("footer.madeByRole") }}.
        </p>
      </div>

      <div class="flex flex-col gap-3">
        <p class="text-xs font-light tracking-widest uppercase text-muted">{{ t("footer.contactTitle") }}</p>
        <p class="text-xs font-light text-muted max-w-xs leading-relaxed">{{ t("footer.contactText") }}</p>
        <ContactLink />
        <ShareButton />
      </div>

      <div class="flex flex-col gap-3">
        <p class="text-xs font-light tracking-widest uppercase text-muted">{{ t("footer.contribute") }}</p>
        <a
          href="https://github.com/Cedric-ruiu/gyp-sum"
          data-umami-event="github-repo"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 text-xs font-light text-muted hover:text-ink transition-colors duration-150"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" class="w-4 h-4 shrink-0" aria-hidden="true">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
          </svg>
          Cedric-ruiu/gyp-sum
        </a>
        <p class="text-xs font-light text-muted max-w-xs leading-relaxed">{{ t("footer.openSource") }}</p>
        <a
          href="https://github.com/Cedric-ruiu/gyp-sum/issues"
          data-umami-event="github-issues"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex min-h-12 items-center gap-2 text-xs font-light text-muted hover:text-ink transition-colors duration-150 sm:min-h-0"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0" aria-hidden="true">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" />
          </svg>
          {{ t("footer.issues") }}
        </a>
        <button
          v-if="showFooterLink"
          type="button"
          class="inline-flex cursor-pointer items-center gap-2 text-left text-xs font-light text-muted hover:text-ink transition-colors duration-150"
          @click="triggerInstall"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="w-4 h-4 shrink-0" aria-hidden="true">
            <path d="M12 3v12M8 11l4 4 4-4M5 19h14" />
          </svg>
          {{ t("pwa.footerLink") }}
        </button>
      </div>
    </div>
  </footer>
</template>
