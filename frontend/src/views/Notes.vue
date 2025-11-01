<template>
  <div>
    <div class="mb-6 flex justify-between items-center">
      <div class="flex-1 max-w-lg">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search notes..."
          class="block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>
      <Button @click="showCreateModal = true">Add Note</Button>
    </div>

    <div class="bg-white shadow overflow-hidden sm:rounded-md">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Type</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Title</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Member</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Priority</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Status</th>
            <th class="px-6 py-3 text-left text-sm font-medium text-gray-500 uppercase">Actions</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          <tr v-for="note in filteredNotes" :key="note.id">
            <td class="px-6 py-4 whitespace-nowrap text-sm">{{ note.type }}</td>
            <td class="px-6 py-4 text-sm">{{ note.title }}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm">{{ note.member?.fullName || '-' }}</td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="getPriorityClass(note.priority)" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                {{ note.priority }}
              </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
              <span :class="note.status === 'resolved' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'" class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full">
                {{ note.status }}
              </span>
            </td>
                <td class="px-6 py-4 whitespace-nowrap text-base font-medium space-x-2">
              <button @click="editNote(note)" class="text-sky-500 hover:text-sky-700">Edit</button>
              <button @click="deleteNote(note.id)" class="text-red-600 hover:text-red-900">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <Modal :is-open="showCreateModal || showEditModal" @close="closeModal">
      <template #title>
        <span>{{ showEditModal ? 'Edit Note' : 'Add Note' }}</span>
      </template>
      <form @submit.prevent="saveNote">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700">Type *</label>
            <select v-model="form.type" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
              <option value="Payment Issue">Payment Issue</option>
              <option value="Reminder">Reminder</option>
              <option value="General">General</option>
              <option value="Complaint">Complaint</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Title *</label>
            <input v-model="form.title" type="text" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Content *</label>
            <textarea v-model="form.content" rows="4" required class="mt-1 block w-full rounded-md border-gray-300 shadow-sm"></textarea>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Priority</label>
            <select v-model="form.priority" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">Status</label>
            <select v-model="form.status" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm">
              <option value="unresolved">Unresolved</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </form>
      <template #footer>
        <div class="flex justify-end space-x-3">
          <Button type="button" variant="secondary" @click="closeModal">Cancel</Button>
          <Button type="submit" @click="saveNote">Save</Button>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { noteService } from '../services/noteService';
import Button from '../components/Button.vue';
import Modal from '../components/Modal.vue';
import { useToast } from '../utils/toast';

const { showToast } = useToast();
const notes = ref<any[]>([]);
const searchQuery = ref('');
const showCreateModal = ref(false);
const showEditModal = ref(false);
const editingId = ref<number | null>(null);
const form = ref({
  type: 'General',
  title: '',
  content: '',
  priority: 'medium',
  status: 'unresolved'
});

const filteredNotes = computed(() => {
  if (!searchQuery.value) return notes.value;
  const query = searchQuery.value.toLowerCase();
  return notes.value.filter((n) =>
    n.title.toLowerCase().includes(query) ||
    n.content.toLowerCase().includes(query)
  );
});

const getPriorityClass = (priority: string) => {
  const classes = {
    high: 'bg-red-100 text-red-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-blue-100 text-blue-800'
  };
  return classes[priority as keyof typeof classes] || 'bg-gray-100 text-gray-800';
};

const loadNotes = async () => {
  try {
    const response = await noteService.getAll();
    notes.value = response.notes;
  } catch (error) {
    showToast('Failed to load notes', 'error');
  }
};

const saveNote = async () => {
  try {
    if (editingId.value) {
      await noteService.update(editingId.value, form.value);
      showToast('Note updated successfully', 'success');
    } else {
      await noteService.create(form.value);
      showToast('Note created successfully', 'success');
    }
    closeModal();
    loadNotes();
  } catch (error: any) {
    showToast(error.response?.data?.error || 'Failed to save note', 'error');
  }
};

const editNote = (note: any) => {
  editingId.value = note.id;
  form.value = { ...note };
  showEditModal.value = true;
};

const deleteNote = async (id: number) => {
  if (!confirm('Are you sure you want to delete this note?')) return;
  try {
    await noteService.delete(id);
    showToast('Note deleted successfully', 'success');
    loadNotes();
  } catch (error) {
    showToast('Failed to delete note', 'error');
  }
};

const closeModal = () => {
  showCreateModal.value = false;
  showEditModal.value = false;
  editingId.value = null;
  form.value = {
    type: 'General',
    title: '',
    content: '',
    priority: 'medium',
    status: 'unresolved'
  };
};

onMounted(() => {
  loadNotes();
});
</script>
