<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <div class="flex-1 max-w-lg">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by member name..."
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-400 focus:ring-gray-400"
          @input="handleSearch"
        />
      </div>
      <Button @click="showSelectModal = true">Select Winner</Button>
    </div>

    <div class="bg-white shadow overflow-hidden sm:rounded-md">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Member</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Period</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Amount</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Draw Date</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Status</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="winner in winners" :key="winner.id">
                <td class="px-6 py-4 whitespace-nowrap text-base font-medium">{{ winner.member.fullName }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-base">{{ getMonthName(winner.period.month) }} {{ winner.period.year }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-base font-bold text-green-600">{{ formatCurrency(winner.amount) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-base">{{ new Date(winner.drawDate).toLocaleDateString() }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-base">
              <span v-if="winner.moneyGivenDate" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                Money Given
                <span class="ml-1 text-xs text-green-600">
                  ({{ new Date(winner.moneyGivenDate).toLocaleDateString() }})
                </span>
              </span>
              <span v-else class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                Pending
              </span>
            </td>
                <td class="px-6 py-4 whitespace-nowrap text-base space-x-2">
              <button
                v-if="!winner.moneyGivenDate"
                @click="markMoneyGiven(winner.id)"
                class="text-sky-500 hover:text-sky-700 font-medium"
              >
                Give Money
              </button>
              <button @click="deleteWinner(winner.id)" class="text-red-600 hover:text-red-900">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Modal :is-open="showSelectModal" @close="showSelectModal = false">
      <template #title>
        <span>Select Winner</span>
      </template>
      <form @submit.prevent="selectWinner">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Period *</label>
            <select v-model.number="form.periodId" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
              <option value="">Select period</option>
              <option v-for="period in openPeriods" :key="period.id" :value="period.id">
                {{ getMonthName(period.month) }} {{ period.year }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Member (leave empty for random)</label>
            <select v-model.number="form.memberId" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
              <option value="">Random Selection</option>
              <option v-for="member in eligibleMembers" :key="member.id" :value="member.id">
                {{ member.fullName }}
              </option>
            </select>
          </div>
        </div>
      </form>
      <template #footer>
        <div class="flex justify-end space-x-3">
          <Button type="button" variant="secondary" @click="showSelectModal = false">Cancel</Button>
          <Button type="submit" @click="selectWinner">Select Winner</Button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { winnerService } from '../services/winnerService';
import { periodService } from '../services/periodService';
import { memberService } from '../services/memberService';
import Button from '../components/Button.vue';
import Modal from '../components/Modal.vue';
import { useToast } from '../utils/toast';

const { showToast } = useToast();
const winners = ref<any[]>([]);
const openPeriods = ref<any[]>([]);
const eligibleMembers = ref<any[]>([]);
const showSelectModal = ref(false);
const form = ref({
  periodId: null as number | null,
  memberId: null as number | null
});

const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(num);
};

const getMonthName = (month: number) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1] || '';
};

const loadWinners = async () => {
  try {
    const response = await winnerService.getAll();
    winners.value = response.winners;
  } catch (error) {
    showToast('Failed to load winners', 'error');
  }
};

const loadOpenPeriods = async () => {
  try {
    const response = await periodService.getAll({ status: 'open' });
    openPeriods.value = response.periods;
  } catch (error) {
    showToast('Failed to load periods', 'error');
  }
};

const loadEligibleMembers = async () => {
  if (!form.value.periodId) return;
  try {
    const response = await memberService.getAll({ periodId: form.value.periodId, paymentStatus: 'paid' });
    eligibleMembers.value = response.members;
  } catch (error) {
    console.error('Failed to load eligible members:', error);
  }
};

const selectWinner = async () => {
  try {
    await winnerService.selectWinner(form.value);
    showToast('Winner selected successfully', 'success');
    showSelectModal.value = false;
    form.value = { periodId: null, memberId: null };
    loadWinners();
  } catch (error: any) {
    showToast(error.response?.data?.error || 'Failed to select winner', 'error');
  }
};

const markMoneyGiven = async (id: number) => {
  if (!confirm('Mark money as given to this winner?')) return;
  try {
    await winnerService.markMoneyGiven(id);
    showToast('Money marked as given successfully', 'success');
    loadWinners();
  } catch (error: any) {
    showToast(error.response?.data?.error || 'Failed to mark money as given', 'error');
  }
};

const deleteWinner = async (id: number) => {
  if (!confirm('Are you sure you want to delete this winner?')) return;
  try {
    await winnerService.delete(id);
    showToast('Winner deleted successfully', 'success');
    loadWinners();
  } catch (error) {
    showToast('Failed to delete winner', 'error');
  }
};

watch(() => form.value.periodId, () => {
  loadEligibleMembers();
});

onMounted(() => {
  loadWinners();
  loadOpenPeriods();
});
</script>
