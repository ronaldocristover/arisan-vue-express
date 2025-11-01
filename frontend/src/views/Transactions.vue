<template>
  <div>
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Financial Records</h2>
      <button
        @click="openAddModal"
        class="bg-sky-400 text-white px-4 py-2 rounded-md hover:bg-sky-500 transition-colors"
      >
        + Add Transaction
      </button>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white shadow rounded-lg p-6">
        <div class="text-sm text-gray-500 mb-1">Total Income</div>
        <div class="text-2xl font-bold text-green-600">{{ formatCurrency(summary?.totalIncome || 0) }}</div>
      </div>
      <div class="bg-white shadow rounded-lg p-6">
        <div class="text-sm text-gray-500 mb-1">Total Expense</div>
        <div class="text-2xl font-bold text-red-600">{{ formatCurrency(summary?.totalExpense || 0) }}</div>
      </div>
      <div class="bg-white shadow rounded-lg p-6">
        <div class="text-sm text-gray-500 mb-1">Balance</div>
        <div :class="(summary?.balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'" class="text-2xl font-bold">
          {{ formatCurrency(summary?.balance || 0) }}
        </div>
      </div>
      <div class="bg-white shadow rounded-lg p-6">
        <div class="text-sm text-gray-500 mb-1">Total Transactions</div>
        <div class="text-2xl font-bold">{{ summary?.transactionCount || 0 }}</div>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white shadow rounded-lg p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Search</label>
          <input
            v-model="filters.search"
            type="text"
            placeholder="Search description or notes..."
            class="block w-full rounded-md border-gray-300 shadow-sm"
            @input="handleSearch"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
          <select
            v-model="filters.type"
            @change="loadTransactions"
            class="block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Category</label>
          <select
            v-model="filters.category"
            @change="loadTransactions"
            class="block w-full rounded-md border-gray-300 shadow-sm"
          >
            <option value="">All</option>
            <option value="payment">Payment</option>
            <option value="winner">Winner</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
          <input
            v-model="filters.startDate"
            type="date"
            @change="loadTransactions"
            class="block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">End Date</label>
          <input
            v-model="filters.endDate"
            type="date"
            @change="loadTransactions"
            class="block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
      </div>
      <div class="mt-4">
        <button
          @click="clearFilters"
          class="text-sm text-gray-600 hover:text-gray-800"
        >
          Clear Filters
        </button>
      </div>
    </div>

    <!-- Transactions Table -->
    <div class="bg-white shadow rounded-lg overflow-hidden">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Date</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Type</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Category</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Description</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Amount</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Related To</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-if="loading">
            <td colspan="7" class="px-6 py-4 text-center">
              <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-sky-400"></div>
            </td>
          </tr>
          <tr v-else-if="transactions.length === 0">
            <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">
              No transactions found
            </td>
          </tr>
          <tr v-for="transaction in transactions" :key="transaction.id">
            <td class="px-6 py-4 whitespace-nowrap text-sm">
              {{ new Date(transaction.transactionDate).toLocaleDateString() }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span
                :class="transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
                class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full capitalize"
              >
                {{ transaction.type }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm capitalize">
              {{ transaction.category }}
            </td>
            <td class="px-6 py-4 text-sm">
              {{ transaction.description }}
              <div v-if="transaction.notes" class="text-xs text-gray-500 mt-1">
                {{ transaction.notes }}
              </div>
            </td>
            <td
              :class="transaction.type === 'income' ? 'text-green-600' : 'text-red-600'"
              class="px-6 py-4 whitespace-nowrap text-sm font-medium"
            >
              {{ transaction.type === 'income' ? '+' : '-' }}{{ formatCurrency(transaction.amount) }}
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
              <div v-if="transaction.payment">
                Payment: {{ transaction.payment.member?.fullName }} - 
                {{ getMonthName(transaction.payment.period?.month) }} {{ transaction.payment.period?.year }}
              </div>
              <div v-else-if="transaction.winner">
                Winner: {{ transaction.winner.member?.fullName }} - 
                {{ getMonthName(transaction.winner.period?.month) }} {{ transaction.winner.period?.year }}
              </div>
              <span v-else class="text-gray-400">-</span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm space-x-2">
              <button
                @click="editTransaction(transaction)"
                class="text-sky-500 hover:text-sky-700"
              >
                Edit
              </button>
              <button
                v-if="!transaction.paymentId && !transaction.winnerId"
                @click="deleteTransaction(transaction.id)"
                class="text-red-600 hover:text-red-900"
              >
                Delete
              </button>
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

    <!-- Add/Edit Modal -->
    <Modal :is-open="showModal" @close="closeModal">
      <template #title>
        <span>{{ editingTransaction ? 'Edit Transaction' : 'Add Transaction' }}</span>
      </template>
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Type *</label>
          <select v-model="transactionForm.type" class="block w-full rounded-md border-gray-300 shadow-sm">
            <option value="">Select type</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
          <input
            v-model.number="transactionForm.amount"
            type="number"
            step="0.01"
            min="0"
            class="block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="0.00"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Category *</label>
          <select v-model="transactionForm.category" class="block w-full rounded-md border-gray-300 shadow-sm">
            <option value="">Select category</option>
            <option value="payment">Payment</option>
            <option value="winner">Winner</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Description *</label>
          <textarea
            v-model="transactionForm.description"
            rows="3"
            class="block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="Transaction description"
          ></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Transaction Date</label>
          <input
            v-model="transactionForm.transactionDate"
            type="datetime-local"
            class="block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Notes</label>
          <textarea
            v-model="transactionForm.notes"
            rows="2"
            class="block w-full rounded-md border-gray-300 shadow-sm"
            placeholder="Additional notes (optional)"
          ></textarea>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end space-x-3">
          <Button type="button" variant="secondary" @click="closeModal">Cancel</Button>
          <Button type="button" @click="saveTransaction">Save</Button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { transactionService, type Transaction } from '../services/transactionService';
import { useToast } from '../utils/toast';
import Modal from '../components/Modal.vue';
import Button from '../components/Button.vue';

const { showToast } = useToast();
const loading = ref(false);
const transactions = ref<Transaction[]>([]);
const pagination = ref<any>(null);
const currentPage = ref(1);
const pageSize = ref(10);
const summary = ref<any>(null);
const showModal = ref(false);
const editingTransaction = ref<Transaction | null>(null);
const transactionForm = ref({
  type: '' as 'income' | 'expense' | '',
  amount: 0,
  category: '',
  description: '',
  notes: '',
  transactionDate: new Date().toISOString().slice(0, 16)
});
const filters = ref({
  search: '',
  type: '',
  category: '',
  startDate: '',
  endDate: ''
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

const loadTransactions = async () => {
  try {
    loading.value = true;
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value
    };
    if (filters.value.search) params.search = filters.value.search;
    if (filters.value.type) params.type = filters.value.type;
    if (filters.value.category) params.category = filters.value.category;
    if (filters.value.startDate) params.startDate = filters.value.startDate;
    if (filters.value.endDate) params.endDate = filters.value.endDate;

    const [transactionsRes, summaryRes] = await Promise.all([
      transactionService.getAll(params),
      transactionService.getSummary({
        type: filters.value.type || undefined,
        category: filters.value.category || undefined,
        startDate: filters.value.startDate || undefined,
        endDate: filters.value.endDate || undefined
      })
    ]);

    transactions.value = transactionsRes.transactions || [];
    pagination.value = transactionsRes.pagination;
    summary.value = summaryRes;
  } catch (error: any) {
    showToast(error.response?.data?.error || 'Failed to load transactions', 'error');
  } finally {
    loading.value = false;
  }
};

const goToPage = (page: number | string) => {
  if (typeof page === 'string' || !pagination.value) return;
  if (page < 1 || page > pagination.value.totalPages) return;
  currentPage.value = page;
  loadTransactions();
};

const handleSearch = () => {
  currentPage.value = 1;
  loadTransactions();
};

const clearFilters = () => {
  filters.value = {
    search: '',
    type: '',
    category: '',
    startDate: '',
    endDate: ''
  };
  currentPage.value = 1;
  loadTransactions();
};

watch([() => filters.value.type, () => filters.value.category, () => filters.value.startDate, () => filters.value.endDate], () => {
  currentPage.value = 1;
  loadTransactions();
});

const openAddModal = () => {
  editingTransaction.value = null;
  transactionForm.value = {
    type: '',
    amount: 0,
    category: '',
    description: '',
    notes: '',
    transactionDate: new Date().toISOString().slice(0, 16)
  };
  showModal.value = true;
};

const editTransaction = (transaction: Transaction) => {
  editingTransaction.value = transaction;
  transactionForm.value = {
    type: transaction.type,
    amount: typeof transaction.amount === 'string' ? parseFloat(transaction.amount) : transaction.amount,
    category: transaction.category,
    description: transaction.description,
    notes: transaction.notes || '',
    transactionDate: transaction.transactionDate ? new Date(transaction.transactionDate).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16)
  };
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  editingTransaction.value = null;
  transactionForm.value = {
    type: '',
    amount: 0,
    category: '',
    description: '',
    notes: '',
    transactionDate: new Date().toISOString().slice(0, 16)
  };
};

const saveTransaction = async () => {
  if (!transactionForm.value.type || !transactionForm.value.amount || !transactionForm.value.category || !transactionForm.value.description) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  try {
    const data = {
      type: transactionForm.value.type,
      amount: transactionForm.value.amount,
      category: transactionForm.value.category,
      description: transactionForm.value.description,
      notes: transactionForm.value.notes || null,
      transactionDate: transactionForm.value.transactionDate ? new Date(transactionForm.value.transactionDate).toISOString() : new Date().toISOString()
    };

    if (editingTransaction.value) {
      await transactionService.update(editingTransaction.value.id, data);
      showToast('Transaction updated successfully', 'success');
    } else {
      await transactionService.create(data);
      showToast('Transaction created successfully', 'success');
    }

    closeModal();
    loadTransactions();
  } catch (error: any) {
    showToast(error.response?.data?.error || 'Failed to save transaction', 'error');
  }
};

const deleteTransaction = async (id: number) => {
  if (!confirm('Are you sure you want to delete this transaction?')) {
    return;
  }

  try {
    await transactionService.delete(id);
    showToast('Transaction deleted successfully', 'success');
    loadTransactions();
  } catch (error: any) {
    showToast(error.response?.data?.error || 'Failed to delete transaction', 'error');
  }
};

onMounted(() => {
  loadTransactions();
});
</script>

