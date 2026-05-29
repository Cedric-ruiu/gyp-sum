import { onMounted, type Ref, ref, watch } from "vue";

export function useLocalStorage<T>(
  key: string,
  defaults: T,
  debounceMs = 500,
): Ref<T> {
  const state = ref(defaults) as Ref<T>;

  // Read persisted state on the client only, after hydration. The server
  // render (vite-ssg) always uses defaults, so reading synchronously would
  // cause an SSR/CSR hydration mismatch for returning visitors.
  onMounted(() => {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          state.value = { ...defaults, ...parsed } as T;
        }
      }
    } catch {
      // ignore parse / access errors
    }
  });

  let timer: ReturnType<typeof setTimeout> | null = null;
  watch(
    state,
    (val) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          localStorage.setItem(key, JSON.stringify(val));
        } catch {
          // ignore quota / serialization errors
        }
      }, debounceMs);
    },
    { deep: true },
  );

  return state;
}
