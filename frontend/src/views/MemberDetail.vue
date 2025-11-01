<template>
  <div>
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
    </div>

    <div v-else-if="member">
      <div class="mb-6">
        <router-link to="/members" class="text-sky-500 hover:text-sky-700">← Back to Members</router-link>
      </div>

      <div class="bg-white shadow rounded-lg p-6 mb-6">
        <h2 class="text-2xl font-bold mb-4">{{ member.fullName }}</h2>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <span class="text-sm text-gray-500">Nickname:</span>
            <span class="ml-2 font-medium">{{ member.nickname }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500">Alternative Name:</span>
            <span class="ml-2 font-medium">{{ member.altName || '-' }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500">WhatsApp Number:</span>
            <span class="ml-2 font-medium">{{ member.whatsappNumber || '-' }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500">Group:</span>
            <span class="ml-2 font-medium">{{ member.group || '-' }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500">Status:</span>
            <span :class="member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'" class="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
              {{ member.status }}
            </span>
          </div>
        </div>
      </div>

      <div class="bg-white shadow rounded-lg p-6">
        <h3 class="text-lg font-medium mb-4">Payment History</h3>
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Period</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Amount</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Payment Date</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Attachment</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="!member.payments || member.payments.length === 0">
              <td colspan="5" class="px-6 py-4 text-center text-sm text-gray-500">No payment history</td>
            </tr>
            <tr v-for="payment in (member.payments || [])" :key="payment.id">
              <td class="px-6 py-4 whitespace-nowrap text-base">
                {{ payment.period ? `${getMonthName(payment.period.month)} ${payment.period.year}` : 'N/A' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-base">{{ formatCurrency(payment.amount) }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="payment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'" class="px-2 inline-flex text-sm leading-5 font-semibold rounded-full">
                  {{ payment.status === 'paid' ? 'Paid' : 'Unpaid' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-base">{{ payment.paymentDate ? formatDate(payment.paymentDate) : '-' }}</td>
              <td class="px-6 py-4 whitespace-nowrap text-base">
                <div v-if="payment.attachment" class="flex items-center">
                  <img 
                    :src="payment.attachment" 
                    alt="Payment evidence" 
                    class="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
                    @click="viewAttachment(payment.attachment)"
                  />
                </div>
                <span v-else class="text-gray-400">-</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Image Modal -->
      <Modal :is-open="showImageModal" @close="closeImageModal">
        <template #title>
          <span>Payment Evidence</span>
        </template>
        <div class="flex justify-center">
          <img 
            :src="selectedImageUrl" 
            alt="Payment evidence" 
            class="max-w-full max-h-96 object-contain rounded-lg"
          />
        </div>
        <template #footer>
          <div class="flex justify-end">
            <Button type="button" variant="secondary" @click="closeImageModal">Close</Button>
          </div>
        </template>
      </Modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { memberService } from '../services/memberService';
import Modal from '../components/Modal.vue';
import Button from '../components/Button.vue';

const route = useRoute();
const loading = ref(true);
const member = ref<any>(null);
const showImageModal = ref(false);
const selectedImageUrl = ref<string>('');

const formatCurrency = (amount: number | string) => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(num);
};

const getMonthName = (month: number) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[month - 1] || '';
};

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

const viewAttachment = (url: string) => {
  selectedImageUrl.value = url;
  showImageModal.value = true;
};

const closeImageModal = () => {
  showImageModal.value = false;
  selectedImageUrl.value = '';
};

onMounted(async () => {
  try {
    loading.value = true;
    const response = await memberService.getById(Number(route.params.id));
    member.value = response.member;
  } catch (error: any) {
    console.error('Failed to load member:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
      alert(`Error: ${error.response.data?.error || 'Failed to load member details'}`);
    } else {
      alert('Failed to load member details. Please try again.');
    }
  } finally {
    loading.value = false;
  }
});
</script>
