import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { track } from "@/analytics";

// Anti-harvesting: the address never appears in clear text, neither in the
// pre-rendered HTML nor in the JS bundle. It is decoded only after mount, so
// the server render and the first client render stay identical (no
// hydration mismatch) and scrapers reading the static HTML get nothing.
const ENCODED_ADDRESS = "Y29udGFjdEBjZWRyaWMtcnVpdS5mcg==";

// `placement` tells apart the links that send the same contact event.
export function useContactAddress(placement?: string) {
  const { t } = useI18n();
  const address = ref<string | null>(null);

  onMounted(() => {
    address.value = atob(ENCODED_ADDRESS);
  });

  const href = computed(() =>
    address.value
      ? `mailto:${address.value}?subject=${encodeURIComponent(t("footer.contactSubject"))}`
      : undefined,
  );

  function trackContact(method: "mailto" | "copy") {
    if (!address.value) return;
    track("contact-email", placement ? { method, placement } : { method });
  }

  return { address, href, trackContact };
}
