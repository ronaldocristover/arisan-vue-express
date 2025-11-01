<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <div class="flex-1 max-w-lg">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search by year or month..."
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-gray-400 focus:ring-gray-400"
          @input="handleSearch"
        />
      </div>
      <Button @click="showCreateModal = true">Create Period</Button>
    </div>

    <div class="mb-4 flex items-center space-x-4">
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Status</label>
        <select
          v-model="statusFilter"
          @change="loadPeriods"
          class="block w-full rounded-md border-gray-300 shadow-sm"
        >
          <option value="">All</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Filter by Year</label>
        <input
          v-model="yearFilter"
          type="number"
          placeholder="Year"
          class="block w-full rounded-md border-gray-300 shadow-sm"
          @input="handleSearch"
        />
      </div>
    </div>

    <div class="bg-white shadow overflow-hidden sm:rounded-md">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Period</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Principal</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Fee</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Paid/Total</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Status</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="period in periods" :key="period.id" :class="period.isCurrent ? 'bg-sky-50' : ''">
                <td class="px-6 py-4 whitespace-nowrap text-base font-medium">
                  {{ getMonthName(period.month) }} {{ period.year }}
                  <span v-if="period.isCurrent" class="ml-2 text-sm text-sky-500">(Current)</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-base">{{ formatCurrency(period.principal) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-base">{{ formatCurrency(period.fee) }}</td>
                <td class="px-6 py-4 whitespace-nowrap text-base">{{ period.paidMembersCount }}/{{ period.paidMembersCount + period.unpaidMembersCount }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="period.status === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                {{ period.status }}
              </span>
            </td>
                <td class="px-6 py-4 whitespace-nowrap text-base font-medium space-x-2">
              <router-link :to="`/periods/${period.id}`" class="text-sky-500 hover:text-sky-700">View</router-link>
              <button v-if="period.status === 'open'" @click="closePeriod(period.id)" class="text-red-600 hover:text-red-900">Close</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Pagination -->
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

    <Modal :is-open="showCreateModal" @close="showCreateModal = false">
      <template #title>
        <span>Create Period</span>
      </template>
      <form @submit.prevent="createPeriod">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Month *</label>
            <select v-model.number="form.month" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
              <option v-for="m in Array.from({length: 12}, (_, i) => i + 1)" :key="m" :value="m">{{ getMonthName(m) }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Year *</label>
            <input v-model.number="form.year" type="number" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Principal Amount *</label>
            <input v-model.number="form.principal" type="number" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Fee Amount *</label>
            <input v-model.number="form.fee" type="number" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
        </div>
      </form>
      <template #footer>
        <div class="flex justify-end space-x-3">
          <Button type="button" variant="secondary" @click="showCreateModal = false">Cancel</Button>
          <Button type="submit" @click="createPeriod">Create</Button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { periodService } from '../services/periodService';
import Button from '../components/Button.vue';
import Modal from '../components/Modal.vue';
import { useToast } from '../utils/toast';
import { useRouter } from 'vue-router';

const router = useRouter();
const { showToast } = useToast();
const periods = ref<any[]>([]);
const pagination = ref<any>(null);
const currentPage = ref(1);
const pageSize = ref(10);
const searchQuery = ref('');
const statusFilter = ref('');
const yearFilter = ref('');
const showCreateModal = ref(false);
const form = ref({
  month: new Date().getMonth() + 1,
  year: new Date().getFullYear(),
  principal: 100000,
  fee: 5000
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
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[month - 1] || '';
};

const loadPeriods = async () => {
  try {
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value
    };
    if (searchQuery.value) params.search = searchQuery.value;
    if (statusFilter.value) params.status = statusFilter.value;
    if (yearFilter.value) params.year = yearFilter.value;
    
    const response = await periodService.getAll(params);
    periods.value = response.periods;
    pagination.value = response.pagination;
  } catch (error) {
    showToast('Failed to load periods', 'error');
  }
};

const goToPage = (page: number | string) => {
  if (typeof page === 'string' || !pagination.value) return;
  if (page < 1 || page > pagination.value.totalPages) return;
  currentPage.value = page;
  loadPeriods();
};

const handleSearch = () => {
  currentPage.value = 1;
  loadPeriods();
};

watch([statusFilter, yearFilter], () => {
  currentPage.value = 1;
  loadPeriods();
});

const createPeriod = async () => {
  try {
    // Validate form data
    if (!form.value.month || !form.value.year || form.value.principal === undefined || form.value.fee === undefined) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    if (form.value.principal < 0 || form.value.fee < 0) {
      showToast('Principal and fee must be positive numbers', 'error');
      return;
    }

    const response = await periodService.create(form.value);
    showToast('Period created successfully', 'success');
    showCreateModal.value = false;
    await loadPeriods();
    router.push(`/periods/${response.period.id}`);
  } catch (error: any) {
    console.error('Error creating period:', error);
    const errorMessage = error.response?.data?.error || 'Failed to create period';
    showToast(errorMessage, 'error');
    console.error('Error details:', error.response?.data);
  }
};

const closePeriod = async (id: number) => {
  if (!confirm('Are you sure you want to close this period?')) return;
  try {
    await periodService.close(id);
    showToast('Period closed successfully', 'success');
    loadPeriods();
  } catch (error) {
    showToast('Failed to close period', 'error');
  }
};

watch(() => searchQuery.value, () => {
  handleSearch();
});

onMounted(() => {
  loadPeriods();
});
</script>
