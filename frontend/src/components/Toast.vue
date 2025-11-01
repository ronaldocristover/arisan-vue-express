<template>
  <Teleport to="body">
    <div
      v-if="show"
      :class="toastClasses"
      class="fixed top-4 right-4 z-50 p-4 rounded-md shadow-lg transition-all duration-300"
    >
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <component :is="iconComponent" class="h-5 w-5" />
        </div>
        <div class="ml-3">
          <p class="text-sm font-medium">{{ message }}</p>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, h } from 'vue';

interface Props {
  show: boolean;
  message: string;
  type?: 'success' | 'error' | 'info';
}

const props = withDefaults(defineProps<Props>(), {
  type: 'info'
});

const toastClasses = computed(() => {
  const types = {
    success: 'bg-green-50 text-green-800 border border-green-200',
    error: 'bg-red-50 text-red-800 border border-red-200',
    info: 'bg-blue-50 text-blue-800 border border-blue-200'
  };
  return types[props.type];
});

const iconComponent = computed(() => {
  const icons = {
    success: () => h('svg', {
      class: 'text-green-400',
      fill: 'currentColor',
      viewBox: '0 0 20 20'
    }, [
      h('path', {
        'fill-rule': 'evenodd',
        d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z',
        'clip-rule': 'evenodd'
      })
    ]),
    error: () => h('svg', {
      class: 'text-red-400',
      fill: 'currentColor',
      viewBox: '0 0 20 20'
    }, [
      h('path', {
        'fill-rule': 'evenodd',
        d: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z',
        'clip-rule': 'evenodd'
      })
    ]),
    info: () => h('svg', {
      class: 'text-blue-400',
      fill: 'currentColor',
      viewBox: '0 0 20 20'
    }, [
      h('path', {
        'fill-rule': 'evenodd',
        d: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z',
        'clip-rule': 'evenodd'
      })
    ])
  };
  return icons[props.type];
});
</script>
