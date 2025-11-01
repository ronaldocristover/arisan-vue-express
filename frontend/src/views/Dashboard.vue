<template>
  <div>
    <div v-if="loading" class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400"></div>
    </div>

    <div v-else>
      <!-- Current Period Section -->
      <div v-if="stats?.stats?.period" class="bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200">
        <div class="flex justify-between items-start mb-4">
          <div>
            <h2 class="text-2xl font-bold text-gray-800">{{ getMonthName(stats.stats.period.month) }} {{ stats.stats.period.year }}</h2>
            <p class="text-sm text-gray-500 mt-1">Current Period</p>
          </div>
          <div class="flex items-center space-x-3">
            <button
              @click="exportMembersPayment"
              :disabled="exporting"
              class="bg-gray-700 text-white px-4 py-2 rounded-md hover:bg-gray-800 transition-colors text-sm font-medium flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg v-if="!exporting" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <svg v-else class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
              </svg>
              <span>{{ exporting ? 'Exporting...' : 'Export Members' }}</span>
            </button>
            <router-link :to="`/periods/${stats.stats.period.id}`" class="text-gray-600 hover:text-gray-800 text-sm font-medium">
              View Details →
            </router-link>
          </div>
        </div>

        <!-- Collection Progress -->
        <div class="mb-6">
          <div class="flex justify-between items-center mb-2">
            <span class="text-sm font-medium text-gray-700">Collection Progress</span>
            <span class="text-sm font-medium text-gray-800">
              {{ formatCurrency(stats.stats.totalCollected || 0) }} / {{ formatCurrency(stats.stats.totalExpected || 0) }}
            </span>
          </div>
          <div class="w-full bg-gray-200 rounded-full h-4">
            <div 
              class="bg-gradient-to-r from-gray-400 to-gray-600 h-4 rounded-full transition-all duration-300 shadow-sm" 
              :style="{ width: stats.stats.totalExpected > 0 ? `${(stats.stats.totalCollected / stats.stats.totalExpected) * 100}%` : '0%' }"
            ></div>
          </div>
          <div class="flex justify-between mt-2 text-xs text-gray-600">
            <span>{{ stats.stats.paidCount || 0 }} paid</span>
            <span>{{ stats.stats.unpaidCount || 0 }} unpaid</span>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-xs text-gray-600 font-medium">Total Members</div>
            <div class="text-2xl font-bold text-gray-800">{{ stats.stats.totalMembers || 0 }}</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-xs text-gray-600 font-medium">Collection Rate</div>
            <div class="text-2xl font-bold text-gray-700">{{ (stats.stats.collectionRate || 0).toFixed(1) }}%</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-xs text-gray-600 font-medium">Total Active</div>
            <div class="text-2xl font-bold text-gray-800">{{ stats.totalActiveMembers || 0 }}</div>
          </div>
        </div>
      </div>

      <!-- Unpaid Members List -->
      <div v-if="stats?.unpaidMembers?.length" class="bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold text-gray-800">Unpaid Members ({{ stats.unpaidMembers.length }})</h3>
          <router-link to="/payments" class="text-sm text-gray-600 hover:text-gray-800 font-medium">
            View All →
          </router-link>
        </div>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Member</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Group</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Amount</th>
                <th class="px-4 py-3 text-left text-sm font-semibold text-gray-700 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="unpaid in stats.unpaidMembers.slice(0, 10)" :key="unpaid.paymentId" class="hover:bg-gray-50 transition-colors">
                <td class="px-4 py-4 whitespace-nowrap">
                  <div class="text-base font-medium text-gray-900">{{ unpaid.memberName }}</div>
                  <div v-if="unpaid.nickname" class="text-base text-gray-600">{{ unpaid.nickname }}</div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-base text-gray-700">
                  {{ unpaid.group || '-' }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-base font-semibold text-gray-900">
                  {{ formatCurrency(unpaid.amount) }}
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-base">
                  <router-link 
                    :to="`/members/${unpaid.memberId}`" 
                    class="text-gray-600 hover:text-gray-800 mr-3 font-medium"
                  >
                    View
                  </router-link>
                  <router-link 
                    :to="`/payments`" 
                    class="text-emerald-500 hover:text-emerald-700 font-medium"
                  >
                    Mark Paid
                  </router-link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="stats.unpaidMembers.length > 10" class="mt-4 text-center">
          <router-link to="/payments" class="text-sm text-gray-600 hover:text-gray-800 font-medium">
            View all {{ stats.unpaidMembers.length }} unpaid members →
          </router-link>
        </div>
      </div>

      <div v-else-if="stats?.stats?.period" class="bg-white shadow-lg rounded-xl p-6 mb-6 border border-gray-200">
        <div class="text-center py-8">
          <div class="text-gray-600 text-5xl mb-3">✓</div>
          <h3 class="text-lg font-semibold text-gray-800 mb-1">All Payments Received!</h3>
          <p class="text-sm text-gray-600">All members have completed their payments for this period.</p>
        </div>
      </div>

      <!-- Recent Activities -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Recent Payments</h3>
          <div class="space-y-3">
            <div
              v-for="payment in stats?.recentPayments?.slice(0, 5)"
              :key="payment.id"
              class="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
            >
              <div>
                <span class="font-semibold text-gray-900">{{ payment.member.fullName }}</span>
                <span class="text-gray-600 ml-2">
                  - {{ getMonthName(payment.period.month) }} {{ payment.period.year }}
                </span>
              </div>
              <span class="font-semibold text-gray-700">{{ formatCurrency(payment.amount) }}</span>
            </div>
            <div v-if="!stats?.recentPayments?.length" class="text-gray-500 text-center py-4">
              No recent payments
            </div>
          </div>
        </div>

        <div class="bg-white shadow-lg rounded-xl p-6 border border-gray-200">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Recent Winners</h3>
          <div class="space-y-3">
            <div
              v-for="winner in stats?.recentWinners?.slice(0, 5)"
              :key="winner.id"
              class="flex items-center justify-between text-sm bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
            >
              <div>
                <span class="font-semibold text-gray-900">{{ winner.member.fullName }}</span>
                <span class="text-gray-600 ml-2">
                  - {{ getMonthName(winner.period.month) }} {{ winner.period.year }}
                </span>
              </div>
              <span class="font-semibold text-gray-700">{{ formatCurrency(winner.amount) }}</span>
            </div>
            <div v-if="!stats?.recentWinners?.length" class="text-gray-500 text-center py-4">
              No winners yet
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="mt-6 bg-white shadow-lg rounded-xl p-6 border border-gray-200">
        <h3 class="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <router-link to="/members" class="text-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-gray-200 hover:border-gray-300 hover:shadow-md">
            <div class="text-sm font-semibold text-gray-700">View Members</div>
          </router-link>
          <router-link to="/periods" class="text-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-gray-200 hover:border-gray-300 hover:shadow-md">
            <div class="text-sm font-semibold text-gray-700">Create Period</div>
          </router-link>
          <router-link to="/payments" class="text-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-gray-200 hover:border-gray-300 hover:shadow-md">
            <div class="text-sm font-semibold text-gray-700">Mark Payment</div>
          </router-link>
          <router-link to="/winners" class="text-center p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all border border-gray-200 hover:border-gray-300 hover:shadow-md">
            <div class="text-sm font-semibold text-gray-700">Select Winner</div>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { dashboardService } from '../services/dashboardService';
import { paymentService } from '../services/paymentService';
import { useToast } from '../utils/toast';

const { showToast } = useToast();
const loading = ref(true);
const stats = ref<any>(null);
const exporting = ref(false);

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

const loadStats = async () => {
  try {
    loading.value = true;
    const response = await dashboardService.getStats();
    stats.value = response;
  } catch (error) {
    console.error('Failed to load dashboard stats:', error);
  } finally {
    loading.value = false;
  }
};

const exportMembersPayment = async () => {
  if (!stats.value?.stats?.period) {
    showToast('No current period found', 'error');
    return;
  }

  try {
    exporting.value = true;
    const period = stats.value.stats.period;
    
    // Fetch all payments for current period
    const response = await paymentService.getAll({ periodId: period.id });
    const payments = response.payments || [];
    
    // Prepare data for export
    const exportData: string[][] = [];
    
    // Header
    exportData.push([
      'No',
      'Nama Lengkap',
      'Nickname',
      'Nama Alternatif',
      'WhatsApp',
      'Group',
      'Status',
      'Jumlah',
      'Tanggal Bayar',
      'Metode Pembayaran',
      'Catatan'
    ]);
    
    // Separate paid and unpaid
    const paidPayments = payments.filter((p: any) => p.status === 'paid');
    const unpaidPayments = payments.filter((p: any) => p.status === 'unpaid');
    
    let rowNumber = 1;
    
    // Add Paid Members section
    if (paidPayments.length > 0) {
      exportData.push(['', '', '', '', '', '', '', '', '', '', '']); // Empty row
      exportData.push(['========== MEMBERS YANG SUDAH BAYAR ==========', '', '', '', '', '', '', '', '', '', '']);
      exportData.push(['', '', '', '', '', '', '', '', '', '', '']); // Empty row
      
      paidPayments.forEach((payment: any) => {
        const member = payment.member;
        const amount = typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount;
        exportData.push([
          rowNumber.toString(),
          member.fullName || '-',
          member.nickname || '-',
          member.altName || '-',
          member.whatsappNumber || '-',
          member.group || '-',
          'Paid',
          amount.toString(),
          payment.paymentDate ? formatDateForExport(payment.paymentDate) : '-',
          payment.paymentMethod ? payment.paymentMethod.toUpperCase() : '-',
          payment.notes || '-'
        ]);
        rowNumber++;
      });
    }
    
    // Add Unpaid Members section
    if (unpaidPayments.length > 0) {
      exportData.push(['', '', '', '', '', '', '', '', '', '', '']); // Empty row
      exportData.push(['========== MEMBERS YANG BELUM BAYAR ==========', '', '', '', '', '', '', '', '', '', '']);
      exportData.push(['', '', '', '', '', '', '', '', '', '', '']); // Empty row
      
      unpaidPayments.forEach((payment: any) => {
        const member = payment.member;
        const amount = typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount;
        exportData.push([
          rowNumber.toString(),
          member.fullName || '-',
          member.nickname || '-',
          member.altName || '-',
          member.whatsappNumber || '-',
          member.group || '-',
          'Unpaid',
          amount.toString(),
          '-',
          '-',
          payment.notes || '-'
        ]);
        rowNumber++;
      });
    }
    
    // Convert to CSV
    const csvContent = exportData.map(row => 
      row.map(cell => {
        // Escape cells containing commas, quotes, or newlines
        const cellStr = String(cell || '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(',')
    ).join('\n');
    
    // Add BOM for Excel UTF-8 support
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `Arisan_${getMonthName(period.month)}_${period.year}_Members.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('Export berhasil!', 'success');
  } catch (error: any) {
    console.error('Failed to export:', error);
    showToast('Gagal export data', 'error');
  } finally {
    exporting.value = false;
  }
};

const formatDateForExport = (date: Date | string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

onMounted(() => {
  loadStats();
});
</script>
