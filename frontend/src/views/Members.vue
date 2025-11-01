<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <div class="flex-1 max-w-lg">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search members..."
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-400 focus:ring-sky-400 sm:text-sm"
        />
      </div>
      <Button @click="showCreateModal = true">Add Member</Button>
    </div>

    <div class="bg-white shadow overflow-hidden sm:rounded-md">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Nickname</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Alt Name</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">WhatsApp</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Group</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-if="loading">
              <td colspan="7" class="px-6 py-4 text-center">
                <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-sky-400"></div>
              </td>
            </tr>
            <tr v-else-if="members.length === 0">
              <td colspan="7" class="px-6 py-4 text-center text-sm text-gray-500">No members found</td>
            </tr>
            <tr v-else v-for="member in members" :key="member.id">
                  <td class="px-6 py-4 whitespace-nowrap text-base font-medium text-gray-900">{{ member.fullName }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-base text-gray-500">{{ member.nickname }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-base text-gray-500">{{ member.altName || '-' }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-base text-gray-500">{{ member.whatsappNumber || '-' }}</td>
                  <td class="px-6 py-4 whitespace-nowrap text-base text-gray-500">{{ member.group || '-' }}</td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="member.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                  {{ member.status }}
                </span>
              </td>
                  <td class="px-6 py-4 whitespace-nowrap text-base font-medium space-x-2">
                <router-link :to="`/members/${member.id}`" class="text-sky-500 hover:text-sky-700">View</router-link>
                <button @click="editMember(member)" class="text-sky-500 hover:text-sky-700">Edit</button>
                <button @click="deleteMember(member.id)" class="text-red-600 hover:text-red-900">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="pagination && pagination.totalPages > 1" class="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
        <div class="flex-1 flex justify-between sm:hidden">
          <button
            @click="goToPage(pagination.page - 1)"
            :disabled="!pagination.hasPrevPage"
            class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <button
            @click="goToPage(pagination.page + 1)"
            :disabled="!pagination.hasNextPage"
            class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p class="text-sm text-gray-700">
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
                class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span class="sr-only">Previous</span>
                <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
              </button>
              <template v-for="page in visiblePages" :key="typeof page === 'string' ? page : `page-${page}`">
                <span
                  v-if="typeof page === 'string'"
                  class="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700"
                >
                  {{ page }}
                </span>
                <button
                  v-else
                  @click="goToPage(page)"
                  :class="[
                    page === pagination.page
                      ? 'z-10 bg-sky-50 border-sky-400 text-sky-500'
                      : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50',
                    'relative inline-flex items-center px-4 py-2 border text-sm font-medium'
                  ]"
                >
                  {{ page }}
                </button>
              </template>
              <button
                @click="goToPage(pagination.page + 1)"
                :disabled="!pagination.hasNextPage"
                class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

    <!-- Create/Edit Modal -->
    <Modal :is-open="showCreateModal || showEditModal" @close="closeModal">
      <template #title>
        <span>{{ showEditModal ? 'Edit Member' : 'Add Member' }}</span>
      </template>
      <form @submit.prevent="saveMember">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Full Name *</label>
            <input v-model="form.fullName" type="text" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Nickname *</label>
            <input v-model="form.nickname" type="text" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Alternative Name</label>
            <input v-model="form.altName" type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">WhatsApp Number</label>
            <input v-model="form.whatsappNumber" type="text" placeholder="+6281234567890" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Group</label>
            <input v-model="form.group" type="text" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Status</label>
            <select v-model="form.status" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </form>
      <template #footer>
        <div class="flex justify-end space-x-3">
          <Button type="button" variant="secondary" @click="closeModal">Cancel</Button>
          <Button type="submit" @click="saveMember">Save</Button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, computed } from 'vue';
import { memberService } from '../services/memberService';
import Button from '../components/Button.vue';
import Modal from '../components/Modal.vue';
import { useToast } from '../utils/toast';

const { showToast } = useToast();
const members = ref<any[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const showCreateModal = ref(false);
const showEditModal = ref(false);
const editingId = ref<number | null>(null);
const pagination = ref<any>(null);
const currentPage = ref(1);
const pageSize = ref(10);
const form = ref({
  fullName: '',
  nickname: '',
  altName: '',
  whatsappNumber: '',
  group: '',
  status: 'active'
});

const visiblePages = computed(() => {
  if (!pagination.value) return [];
  
  const total = pagination.value.totalPages;
  const current = pagination.value.page;
  const pages: (number | string)[] = [];
  
  if (total <= 7) {
    // Show all pages if 7 or less
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
  } else {
    // Always show first page
    pages.push(1);
    
    if (current > 3) {
      pages.push('...'); // Ellipsis
    }
    
    // Show pages around current
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    if (current < total - 2) {
      pages.push('...'); // Ellipsis
    }
    
    // Always show last page
    pages.push(total);
  }
  
  return pages;
});

const loadMembers = async () => {
  try {
    loading.value = true;
    const params: any = {
      page: currentPage.value,
      limit: pageSize.value
    };
    if (searchQuery.value) params.search = searchQuery.value;
    const response = await memberService.getAll(params);
    members.value = response.members;
    pagination.value = response.pagination;
  } catch (error) {
    showToast('Failed to load members', 'error');
  } finally {
    loading.value = false;
  }
};

const goToPage = (page: number | string) => {
  if (typeof page === 'string' || !pagination.value) return;
  if (page < 1 || page > pagination.value.totalPages) return;
  currentPage.value = page;
  loadMembers();
};

const saveMember = async () => {
  try {
    if (editingId.value) {
      await memberService.update(editingId.value, form.value);
      showToast('Member updated successfully', 'success');
    } else {
      await memberService.create(form.value);
      showToast('Member created successfully', 'success');
      // Reset to first page after adding new member
      currentPage.value = 1;
    }
    closeModal();
    loadMembers();
  } catch (error: any) {
    showToast(error.response?.data?.error || 'Failed to save member', 'error');
  }
};

const editMember = (member: any) => {
  editingId.value = member.id;
  form.value = { ...member };
  showEditModal.value = true;
};

const deleteMember = async (id: number) => {
  if (!confirm('Are you sure you want to delete this member?')) return;
  try {
    await memberService.delete(id);
    showToast('Member deleted successfully', 'success');
    loadMembers();
  } catch (error) {
    showToast('Failed to delete member', 'error');
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  editingId.value = null;
  form.value = {
    fullName: '',
    nickname: '',
    altName: '',
    whatsappNumber: '',
    group: '',
    status: 'active'
  };
};

watch(searchQuery, () => {
  currentPage.value = 1; // Reset to first page when searching
  loadMembers();
});

onMounted(() => {
  loadMembers();
});
</script>
