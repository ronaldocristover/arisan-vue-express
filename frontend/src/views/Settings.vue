<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">Settings</h2>

    <div class="bg-white shadow rounded-lg p-6">
      <h3 class="text-lg font-medium mb-4">Arisan Configuration</h3>
      <form @submit.prevent="saveSettings">
        <div class="space-y-4 max-w-md">
          <div>
            <label class="block text-sm font-medium text-gray-700">Default Principal Amount</label>
            <input
              v-model.number="settings.defaultPrincipal"
              type="number"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Default Fee Amount</label>
            <input
              v-model.number="settings.defaultFee"
              type="number"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Payment Due Date (Day of Month)</label>
            <input
              v-model.number="settings.paymentDueDate"
              type="number"
              min="1"
              max="31"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Late Payment Grace Period (Days)</label>
            <input
              v-model.number="settings.gracePeriod"
              type="number"
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
        </div>
        <div class="mt-6">
          <Button type="submit">Save Settings</Button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { settingsService } from '../services/settingsService';
import Button from '../components/Button.vue';
import { useToast } from '../utils/toast';

const { showToast } = useToast();
const settings = ref({
  defaultPrincipal: 0,
  defaultFee: 0,
  paymentDueDate: 5,
  gracePeriod: 3
});

const loadSettings = async () => {
  try {
    const response = await settingsService.getAll();
    const loadedSettings = response.settings;
    settings.value = {
      defaultPrincipal: parseFloat(loadedSettings.defaultPrincipal || '0'),
      defaultFee: parseFloat(loadedSettings.defaultFee || '0'),
      paymentDueDate: parseInt(loadedSettings.paymentDueDate || '5'),
      gracePeriod: parseInt(loadedSettings.gracePeriod || '3')
    };
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
};

const saveSettings = async () => {
  try {
    const settingsToSave: Record<string, string> = {
      defaultPrincipal: settings.value.defaultPrincipal.toString(),
      defaultFee: settings.value.defaultFee.toString(),
      paymentDueDate: settings.value.paymentDueDate.toString(),
      gracePeriod: settings.value.gracePeriod.toString()
    };
    await settingsService.updateAll(settingsToSave);
    showToast('Settings saved successfully', 'success');
  } catch (error) {
    showToast('Failed to save settings', 'error');
  }
};

onMounted(() => {
  loadSettings();
});
</script>
