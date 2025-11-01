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
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          class="text-sm text-sky-500 hover:text-sky-700"
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
import { ref, onMounted } from 'vue';
import { transactionService, type Transaction } from '../services/transactionService';
import { useToast } from '../utils/toast';
import Modal from '../components/Modal.vue';
import Button from '../components/Button.vue';

const { showToast } = useToast();
const loading = ref(false);
const transactions = ref<Transaction[]>([]);
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
  type: '',
  category: '',
  startDate: '',
  endDate: ''
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
    const params: any = {};
    if (filters.value.type) params.type = filters.value.type;
    if (filters.value.category) params.category = filters.value.category;
    if (filters.value.startDate) params.startDate = filters.value.startDate;
    if (filters.value.endDate) params.endDate = filters.value.endDate;

    const [transactionsRes, summaryRes] = await Promise.all([
      transactionService.getAll(params),
      transactionService.getSummary(params)
    ]);

    transactions.value = transactionsRes.transactions || [];
    summary.value = summaryRes;
  } catch (error: any) {
    showToast(error.response?.data?.error || 'Failed to load transactions', 'error');
  } finally {
    loading.value = false;
  }
};

const clearFilters = () => {
  filters.value = {
    type: '',
    category: '',
    startDate: '',
    endDate: ''
  };
  loadTransactions();
};

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

