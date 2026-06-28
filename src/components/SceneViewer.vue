<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useThreeScene } from "@/composables/useThreeScene";
import type { MoldConfig, ObjectConfig } from "@/types";

const props = defineProps<{
  moldConfig: MoldConfig;
  objectConfig: ObjectConfig;
}>();

const { t } = useI18n();

const canvasContainer = ref<HTMLDivElement | null>(null);

const { init, updateMold, updateObject, destroy } = useThreeScene();

onMounted(() => {
  if (canvasContainer.value) {
    init(canvasContainer.value);
    updateMold(props.moldConfig);
    updateObject(props.objectConfig);
  }
});

onUnmounted(() => {
  destroy();
});

watch(
  () => props.moldConfig,
  (config) => updateMold(config),
  { deep: true },
);
watch(
  () => props.objectConfig,
  (config) => updateObject(config),
  { deep: true },
);
</script>

<template>
  <div
    ref="canvasContainer"
    role="img"
    :aria-label="t('scene.ariaLabel')"
    class="w-full bg-[color:var(--color-surface)] overflow-hidden"
    style="aspect-ratio: 4 / 3"
  />
</template>
