<template>
  <div>
    <h2 class="text-2xl font-bold mb-6">Payments</h2>

    <!-- Tabs -->
    <div class="bg-white shadow rounded-lg">
      <div class="border-b border-gray-200">
        <nav class="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            @click="activeTab = 'current'"
            :class="[
              activeTab === 'current'
                ? 'border-sky-400 text-sky-500'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            ]"
          >
            Current Period Payments
            <span v-if="currentPayments.length > 0" class="ml-2 bg-sky-100 text-sky-500 py-0.5 px-2.5 rounded-full text-xs font-medium">
              {{ currentPayments.length }}
            </span>
          </button>
          <button
            @click="activeTab = 'history'"
            :class="[
              activeTab === 'history'
                ? 'border-sky-400 text-sky-500'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm'
            ]"
          >
            Payment History
            <span v-if="payments.length > 0" class="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2.5 rounded-full text-xs font-medium">
              {{ payments.length }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Current Period Payments Tab -->
      <div v-show="activeTab === 'current'" class="p-6">
        <div class="mb-4">
          <input
            v-model="currentSearchQuery"
            type="text"
            placeholder="Search by member name..."
            class="block w-full max-w-lg rounded-md border-gray-300 shadow-sm focus:border-gray-400 focus:ring-gray-400"
            @input="handleCurrentSearch"
          />
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Member</th>
                <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Period</th>
                <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Amount</th>
                <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Status</th>
                <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Payment Date</th>
                <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Payment Method</th>
                <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Attachment</th>
                <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="!loadingCurrent && currentPayments.length === 0">
                <td colspan="8" class="px-6 py-4 text-center text-base text-gray-500">No payments found for current period</td>
              </tr>
              <tr v-if="loadingCurrent">
                <td colspan="8" class="px-6 py-4 text-center">
                  <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
                </td>
              </tr>
              <tr v-for="payment in currentPayments" :key="payment.id">
                <td class="px-6 py-4 whitespace-nowrap text-base font-medium">{{ payment.member.fullName }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-base">{{ getMonthName(payment.period.month) }} {{ payment.period.year }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-base">{{ formatCurrency(payment.amount) }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="payment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'" class="px-2 inline-flex text-sm leading-5 font-semibold rounded-full">
                    {{ payment.status === 'paid' ? 'Paid' : 'Unpaid' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-base">{{ payment.paymentDate ? formatDate(payment.paymentDate) : '-' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-base">
                  <span v-if="payment.paymentMethod" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                    {{ payment.paymentMethod }}
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <a v-if="payment.attachment" :href="payment.attachment" target="_blank" class="text-sky-500 hover:text-sky-700">View</a>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-base space-x-4">
                  <button @click="editPayment(payment)" class="text-sky-500 hover:text-sky-700">
                    Edit
                  </button>
                  <button @click="togglePayment(payment)" :class="payment.status === 'paid' ? 'text-red-600 hover:text-red-800' : 'text-emerald-500 hover:text-emerald-700'">
                    {{ payment.status === 'paid' ? 'Mark Unpaid' : 'Mark Paid' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Payment History Tab -->
      <div v-show="activeTab === 'history'" class="p-6">
        <div class="mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by member name..."
              class="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-400 focus:ring-gray-400"
              @input="handleHistorySearch"
            />
          </div>
          <div>
            <select
              v-model="statusFilter"
              @change="loadHistoryPayments"
              class="block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="">All Status</option>
              <option value="paid">Paid</option>
              <option value="unpaid">Unpaid</option>
            </select>
          </div>
          <div>
            <select
              v-model="paymentMethodFilter"
              @change="loadHistoryPayments"
              class="block w-full rounded-md border-gray-300 shadow-sm"
            >
              <option value="">All Methods</option>
              <option value="cash">Cash</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Member</th>
                <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Period</th>
                <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Amount</th>
                <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Status</th>
                <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Payment Date</th>
                <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Payment Method</th>
                <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Attachment</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-if="!loadingHistory && payments.length === 0">
                <td colspan="7" class="px-6 py-4 text-center text-base text-gray-500">
                  {{ searchQuery || statusFilter || paymentMethodFilter ? 'No payments found matching your filters' : 'No payment history' }}
                </td>
              </tr>
              <tr v-if="loadingHistory">
                <td colspan="7" class="px-6 py-4 text-center">
                  <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
                </td>
              </tr>
              <tr v-for="payment in payments" :key="payment.id">
                <td class="px-6 py-4 whitespace-nowrap text-base font-medium">{{ payment.member.fullName }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-base">{{ getMonthName(payment.period.month) }} {{ payment.period.year }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-base">{{ formatCurrency(payment.amount) }}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span :class="payment.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'" class="px-2 inline-flex text-sm leading-5 font-semibold rounded-full">
                    {{ payment.status === 'paid' ? 'Paid' : 'Unpaid' }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-base">{{ payment.paymentDate ? formatDate(payment.paymentDate) : '-' }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-base">
                  <span v-if="payment.paymentMethod" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                    {{ payment.paymentMethod }}
                  </span>
                  <span v-else class="text-gray-400">-</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <a v-if="payment.attachment" :href="payment.attachment" target="_blank" class="text-sky-500 hover:text-sky-700">View</a>
                  <span v-else class="text-gray-400">-</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination for History -->
        <div v-if="pagination && pagination.totalPages > 1" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              @click="goToPage(pagination.page - 1)"
              :disabled="!pagination.hasPrevPage"
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              @click="goToPage(pagination.page + 1)"
              :disabled="!pagination.hasNextPage"
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-base text-gray-700">
                Showing
                <span class="font-medium">{{ ((pagination.page - 1) * pagination.limit) + 1 }}</span>
                to
                <span class="font-medium">{{ Math.min(pagination.page * pagination.limit, pagination.total) }}</span>
                of
                <span class="font-medium">{{ pagination.total }}</span>
                results
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <button
                  @click="goToPage(pagination.page - 1)"
                  :disabled="!pagination.hasPrevPage"
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-base font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="sr-only">Previous</span>
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
                <template v-for="page in visiblePages" :key="typeof page === 'string' ? page : `page-${page}`">
                  <span
                    v-if="typeof page === 'string'"
                    class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-base font-medium text-gray-700"
                  >
                    {{ page }}
                  </span>
                  <button
                    v-else
                    @click="goToPage(page)"
                    :class="[
                      page === pagination.page
                        ? 'z-10 bg-gray-50 border-gray-500 text-gray-900'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50',
                      'relative inline-flex items-center px-4 py-2 border text-base font-medium'
                    ]"
                  >
                    {{ page }}
                  </button>
                </template>
                <button
                  @click="goToPage(pagination.page + 1)"
                  :disabled="!pagination.hasNextPage"
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-base font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span class="sr-only">Next</span>
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Payment Modal -->
    <Modal :is-open="showEditModal" @close="closeEditModal">
      <template #title>
        <span>Edit Payment - {{ editingPayment?.member?.fullName || 'N/A' }}</span>
      </template>
      <div v-if="editingPayment" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Status</label>
          <select v-model="paymentForm.status" class="block w-full rounded-md border-gray-300 shadow-sm">
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
          <input v-model="paymentForm.paymentDate" type="datetime-local" class="block w-full rounded-md border-gray-300 shadow-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
          <select v-model="paymentForm.paymentMethod" class="block w-full rounded-md border-gray-300 shadow-sm">
            <option value="">Select payment method</option>
            <option value="cash">Cash</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Payment Evidence (Image)</label>
              <FileUpload
                v-model="paymentForm.attachment"
                folder="payments"
                :period-id="editingPayment?.period?.id"
                :member-id="editingPayment?.member?.id"
                :date="paymentForm.paymentDate ? new Date(paymentForm.paymentDate) : new Date()"
                @uploaded="handleAttachmentUploaded"
                @error="handleUploadError"
              />
            </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea v-model="paymentForm.notes" rows="3" class="block w-full rounded-md border-gray-300 shadow-sm"></textarea>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end space-x-3">
          <Button type="button" variant="secondary" @click="closeEditModal">Cancel</Button>
          <Button type="button" @click="savePayment">Save</Button>
        </div>
        </template>
      </Modal>

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
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { paymentService } from '../services/paymentService';
import { periodService } from '../services/periodService';
import { useToast } from '../utils/toast';
import Modal from '../components/Modal.vue';
import Button from '../components/Button.vue';
import FileUpload from '../components/FileUpload.vue';

const { showToast } = useToast();
const payments = ref<any[]>([]);
const currentPayments = ref<any[]>([]);
const pagination = ref<any>(null);
const currentPage = ref(1);
const pageSize = ref(10);
const searchQuery = ref('');
const currentSearchQuery = ref('');
const statusFilter = ref('');
const paymentMethodFilter = ref('');
const loadingCurrent = ref(false);
const loadingHistory = ref(false);
const activeTab = ref<'current' | 'history'>('current');
const showEditModal = ref(false);
const showImageModal = ref(false);
const selectedImageUrl = ref<string>('');
const editingPayment = ref<any>(null);
const paymentForm = ref({
  status: 'unpaid',
  paymentDate: '',
  paymentMethod: '',
  attachment: '',
  notes: ''
});

const visiblePages = computed(() => {
  if (!pagination.value) return [];
  
  const total = pagination.value.totalPages;
  const current = pagination.value.page;
  const pages: (number | string)[] = [];
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    if (current > 3) {
      pages.push('...');
    }
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    if (current < total - 2) {
      pages.push('...');
    }
    pages.push(total);
  }
  return pages;
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

const loadCurrentPayments = async () => {
  try {
    loadingCurrent.value = true;
    const periodsRes = await periodService.getAll();
    const currentPeriod = periodsRes.periods.find((p: any) => p.isCurrent);
    if (currentPeriod) {
      const params: any = {
        periodId: currentPeriod.id,
        page: 1,
        limit: 100
      };
      if (currentSearchQuery.value) params.search = currentSearchQuery.value;
      const response = await paymentService.getAll(params);
      currentPayments.value = response.payments;
    } else {
      currentPayments.value = [];
    }
  } catch (error) {
    showToast('Failed to load current payments', 'error');
  } finally {
    loadingCurrent.value = false;
  }
};

const loadHistoryPayments = async () => {
  try {
    loadingHistory.value = true;
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value
    };
    if (searchQuery.value) params.search = searchQuery.value;
    if (statusFilter.value) params.status = statusFilter.value;
    if (paymentMethodFilter.value) params.paymentMethod = paymentMethodFilter.value;
    
    const response = await paymentService.getAll(params);
    payments.value = response.payments;
    pagination.value = response.pagination;
  } catch (error) {
    showToast('Failed to load payments', 'error');
  } finally {
    loadingHistory.value = false;
  }
};

const loadPayments = async () => {
  await Promise.all([
    loadCurrentPayments(),
    loadHistoryPayments()
  ]);
};

const goToPage = (page: number | string) => {
  if (typeof page === 'string' || !pagination.value) return;
  if (page < 1 || page > pagination.value.totalPages) return;
  currentPage.value = page;
  loadHistoryPayments();
};

const handleCurrentSearch = () => {
  loadCurrentPayments();
};

const handleHistorySearch = () => {
  currentPage.value = 1;
  loadHistoryPayments();
};

watch([statusFilter, paymentMethodFilter], () => {
  currentPage.value = 1;
  loadHistoryPayments();
});

watch(() => activeTab.value, () => {
  if (activeTab.value === 'current') {
    loadCurrentPayments();
  } else {
    loadHistoryPayments();
  }
});

const editPayment = (payment: any) => {
  editingPayment.value = payment;
  paymentForm.value = {
    status: payment.status || 'unpaid',
    paymentDate: payment.paymentDate ? new Date(payment.paymentDate).toISOString().slice(0, 16) : '',
    paymentMethod: payment.paymentMethod || '',
    attachment: payment.attachment || '',
    notes: payment.notes || ''
  };
  showEditModal.value = true;
};

const closeEditModal = () => {
  showEditModal.value = false;
  editingPayment.value = null;
  paymentForm.value = {
    status: 'unpaid',
    paymentDate: '',
    paymentMethod: '',
    attachment: '',
    notes: ''
  };
};

const handleAttachmentUploaded = (url: string) => {
  paymentForm.value.attachment = url;
};

const handleUploadError = (error: string) => {
  showToast(error, 'error');
};

const savePayment = async () => {
  if (!editingPayment.value) return;

  try {
    await paymentService.update(editingPayment.value.id, {
      status: paymentForm.value.status,
      paymentDate: paymentForm.value.paymentDate ? new Date(paymentForm.value.paymentDate).toISOString() : null,
      paymentMethod: paymentForm.value.paymentMethod || null,
      attachment: paymentForm.value.attachment || null,
      notes: paymentForm.value.notes || null
    });
    showToast('Payment updated successfully', 'success');
    closeEditModal();
    loadPayments();
  } catch (error: any) {
    showToast(error.response?.data?.error || 'Failed to update payment', 'error');
  }
};

const viewAttachment = (url: string) => {
  selectedImageUrl.value = url;
  showImageModal.value = true;
};

const closeImageModal = () => {
  showImageModal.value = false;
  selectedImageUrl.value = '';
};

const togglePayment = async (payment: any) => {
  try {
    const newStatus = payment.status === 'paid' ? 'unpaid' : 'paid';
    await paymentService.update(payment.id, {
      status: newStatus,
      paymentDate: newStatus === 'paid' ? new Date().toISOString() : null
    });
    showToast('Payment status updated', 'success');
    await loadPayments();
  } catch (error) {
    showToast('Failed to update payment', 'error');
  }
};

onMounted(() => {
  loadPayments();
});
</script>
