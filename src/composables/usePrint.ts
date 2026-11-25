import { onMounted, onUnmounted } from "vue";
import { track } from "@/analytics";

// One `print` event per print, whatever starts it: the button flags its own
// prints, anything else (Ctrl/Cmd+P, browser menu) counts as a shortcut. The
// flag is cleared on `beforeprint`, which may fire after window.print()
// returns (Safari).
let fromButton = false;

export function printFromButton(): void {
  fromButton = true;
  window.print();
}

export function useTrackPrints(): void {
  const onBeforePrint = () => {
    track("print", { method: fromButton ? "button" : "shortcut" });
    fromButton = false;
  };
  onMounted(() => window.addEventListener("beforeprint", onBeforePrint));
  onUnmounted(() => window.removeEventListener("beforeprint", onBeforePrint));
}
