import { type Ref, ref, watch } from "vue";

export function useLocalStorage<T>(
  key: string,
  defaults: T,
  debounceMs = 500,
): Ref<T> {
  let initial: T = defaults;
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        initial = { ...defaults, ...parsed } as T;
      }
    }
  } catch {
    initial = defaults;
  }

  const state = ref(initial) as Ref<T>;

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
