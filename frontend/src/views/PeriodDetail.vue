<template>
  <div>
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-sky-400"></div>
    </div>

    <div v-else-if="period">
      <div class="mb-6">
        <router-link to="/periods" class="text-sky-500 hover:text-sky-700">← Back to Periods</router-link>
      </div>

      <div class="bg-white shadow rounded-lg p-6 mb-6">
        <div class="flex justify-between items-start mb-4">
          <h2 class="text-2xl font-bold">{{ getMonthName(period.period?.month || period.month) }} {{ period.period?.year || period.year }}</h2>
          <button
            v-if="(period.period?.status || period.status) === 'open'"
            @click="openAddMembersModal"
            class="bg-sky-400 text-white px-4 py-2 rounded-md hover:bg-sky-500 transition-colors text-sm font-medium"
          >
            + Add Members
          </button>
        </div>
        <div class="grid grid-cols-2 gap-4 mb-4">
          <div>
            <span class="text-sm text-gray-500">Principal:</span>
            <span class="ml-2 font-medium">{{ formatCurrency(period.period?.principal || period.principal) }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500">Fee:</span>
            <span class="ml-2 font-medium">{{ formatCurrency(period.period?.fee || period.fee) }}</span>
          </div>
          <div>
            <span class="text-sm text-gray-500">Status:</span>
            <span :class="(period.period?.status || period.status) === 'open' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'" class="ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
              {{ period.period?.status || period.status }}
            </span>
          </div>
        </div>
        <div v-if="period.period?.stats || period.stats" class="grid grid-cols-4 gap-4 pt-4 border-t">
          <div>
            <div class="text-sm text-gray-500">Paid</div>
            <div class="text-xl font-bold">{{ (period.period?.stats || period.stats)?.paidCount || 0 }}</div>
          </div>
          <div>
            <div class="text-sm text-gray-500">Unpaid</div>
            <div class="text-xl font-bold text-red-600">{{ (period.period?.stats || period.stats)?.unpaidCount || 0 }}</div>
          </div>
          <div>
            <div class="text-sm text-gray-500">Collection Rate</div>
            <div class="text-xl font-bold">{{ ((period.period?.stats || period.stats)?.collectionPercentage || 0).toFixed(1) }}%</div>
          </div>
          <div>
            <div class="text-sm text-gray-500">Total Collected</div>
            <div class="text-xl font-bold">{{ formatCurrency((period.period?.stats || period.stats)?.totalCollected || 0) }}</div>
          </div>
        </div>
      </div>

      <div class="bg-white shadow rounded-lg p-6">
        <h3 class="text-lg font-medium mb-4">Payment Status</h3>
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Member</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Status</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Payment Date</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Payment Method</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Attachment</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="(!period.period?.payments && !period.payments) || ((period.period?.payments || period.payments || []).length === 0)">
              <td colspan="6" class="px-6 py-4 text-center text-sm text-gray-500">No payments found</td>
            </tr>
            <tr v-for="payment in (period.period?.payments || period.payments || [])" :key="payment.id">
              <td class="px-6 py-4 whitespace-nowrap text-base font-medium">{{ payment.member?.fullName || 'N/A' }}</td>
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
              <td class="px-6 py-4 whitespace-nowrap text-base space-x-4">
                <button @click="editPayment(payment)" class="text-sky-500 hover:text-sky-700">
                  Edit
                </button>
                <button @click="togglePaymentStatus(payment)" :class="payment.status === 'paid' ? 'text-red-600 hover:text-red-800' : 'text-emerald-500 hover:text-emerald-700'">
                  {{ payment.status === 'paid' ? 'Mark Unpaid' : 'Mark Paid' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
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
                  :period-id="editingPayment?.period?.id || period?.period?.id || period?.id"
                  :member-id="editingPayment?.member?.id || editingPayment?.memberId"
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

      <!-- Add Members Modal -->
      <Modal :is-open="showAddMembersModal" @close="closeAddMembersModal">
        <template #title>
          <span>Add Members to Period</span>
        </template>
        <div class="space-y-4">
          <div v-if="availableMembers.length === 0" class="text-center py-4 text-gray-500">
            All active members are already in this period.
          </div>
          <div v-else class="max-h-96 overflow-y-auto">
            <div class="space-y-2">
              <label
                v-for="member in availableMembers"
                :key="member.id"
                class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  :value="member.id"
                  v-model="selectedMemberIds"
                  class="rounded border-gray-300 text-sky-400 focus:ring-sky-400"
                />
                <div class="ml-3 flex-1">
                  <div class="text-sm font-medium text-gray-900">{{ member.fullName }}</div>
                  <div class="text-xs text-gray-500">{{ member.nickname }} {{ member.group ? `• ${member.group}` : '' }}</div>
                </div>
              </label>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="flex justify-end space-x-3">
            <Button type="button" variant="secondary" @click="closeAddMembersModal">Cancel</Button>
            <Button 
              type="button" 
              @click="addMembersToPeriod"
              :disabled="selectedMemberIds.length === 0"
            >
              Add Selected ({{ selectedMemberIds.length }})
            </Button>
          </div>
        </template>
      </Modal>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { periodService } from '../services/periodService';
import { paymentService } from '../services/paymentService';
import { memberService } from '../services/memberService';
import { useToast } from '../utils/toast';
import Modal from '../components/Modal.vue';
import Button from '../components/Button.vue';
import FileUpload from '../components/FileUpload.vue';

const route = useRoute();
const { showToast } = useToast();
const loading = ref(true);
const period = ref<any>(null);
const showEditModal = ref(false);
const showImageModal = ref(false);
const showAddMembersModal = ref(false);
const selectedImageUrl = ref<string>('');
const editingPayment = ref<any>(null);
const allMembers = ref<any[]>([]);
const selectedMemberIds = ref<number[]>([]);
const paymentForm = ref({
  status: 'unpaid',
  paymentDate: '',
  paymentMethod: '',
  attachment: '',
  notes: ''
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

const formatDate = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

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
    loadPeriod();
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

const availableMembers = computed(() => {
  if (!period.value || !allMembers.value.length) return [];
  
  const payments = period.value.period?.payments || period.value.payments || [];
  const existingMemberIds = new Set(payments.map((p: any) => p.member?.id || p.memberId));
  
  return allMembers.value.filter(member => 
    member.status === 'active' && !existingMemberIds.has(member.id)
  );
});

const openAddMembersModal = async () => {
  try {
    // Load all active members
    const membersRes = await memberService.getAll({ status: 'active' });
    allMembers.value = membersRes.members || [];
    selectedMemberIds.value = [];
    showAddMembersModal.value = true;
  } catch (error: any) {
    showToast('Failed to load members', 'error');
  }
};

const closeAddMembersModal = () => {
  showAddMembersModal.value = false;
  selectedMemberIds.value = [];
  allMembers.value = [];
};

const addMembersToPeriod = async () => {
  if (selectedMemberIds.value.length === 0) return;
  
  try {
    const periodId = period.value.period?.id || period.value.id;
    await periodService.addMembers(periodId, selectedMemberIds.value);
    showToast(`Successfully added ${selectedMemberIds.value.length} member(s) to period`, 'success');
    closeAddMembersModal();
    loadPeriod();
  } catch (error: any) {
    showToast(error.response?.data?.error || 'Failed to add members to period', 'error');
  }
};

const togglePaymentStatus = async (payment: any) => {
  try {
    const newStatus = payment.status === 'paid' ? 'unpaid' : 'paid';
    await paymentService.update(payment.id, {
      status: newStatus,
      paymentDate: newStatus === 'paid' ? new Date().toISOString() : null
    });
    showToast('Payment status updated', 'success');
    loadPeriod();
  } catch (error) {
    showToast('Failed to update payment status', 'error');
  }
};

const loadPeriod = async () => {
  try {
    loading.value = true;
    const response = await periodService.getById(Number(route.params.id));
    // Handle nested response structure
    const periodData = response.period || response;
    period.value = { period: periodData };
    
    // Ensure stats exist
    if (!period.value.period.stats && period.value.period.payments) {
      const payments = period.value.period.payments;
      const paidCount = payments.filter((p: any) => p.status === 'paid').length;
      const unpaidCount = payments.filter((p: any) => p.status === 'unpaid').length;
      const totalAmountPerMember = Number(period.value.period.principal) + Number(period.value.period.fee);
      period.value.period.stats = {
        paidCount,
        unpaidCount,
        totalMembers: payments.length,
        collectionPercentage: payments.length > 0 ? (paidCount / payments.length) * 100 : 0,
        totalCollected: paidCount * totalAmountPerMember,
        outstandingAmount: unpaidCount * totalAmountPerMember
      };
    }
  } catch (error) {
    showToast('Failed to load period', 'error');
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  loadPeriod();
});
</script>
