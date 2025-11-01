<template>
  <div class="file-upload">
    <!-- Existing attachment display -->
    <div v-if="uploadedUrl && !previewUrl" class="preview-area mb-3">
      <div class="relative">
        <img :src="uploadedUrl" alt="Current attachment" class="preview-image" />
        <button @click="removeFile" class="remove-button" type="button">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p class="text-xs text-gray-500 mt-2 text-center">Current attachment</p>
      <button @click="triggerFileInput" class="replace-button" type="button">
        Replace Image
      </button>
    </div>

    <!-- Upload area for new files -->
    <div v-if="!previewUrl" class="upload-area" @click="triggerFileInput" :class="{ 'is-dragging': isDragging }" @dragover.prevent="isDragging = true" @dragleave.prevent="isDragging = false" @drop.prevent="handleDrop">
      <input ref="fileInput" type="file" accept="image/*" @change="handleFileSelect" class="hidden" />
      <div class="upload-content">
        <svg class="upload-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        <p class="upload-text">{{ uploadedUrl ? 'Click to replace or drag and drop' : 'Click to upload or drag and drop' }}</p>
        <p class="upload-hint">PNG, JPG, GIF up to 5MB</p>
      </div>
    </div>

    <!-- Preview of selected file before upload -->
    <div v-if="previewUrl" class="preview-area">
      <div class="relative">
        <img :src="previewUrl" alt="Preview" class="preview-image" />
        <button @click="removeFile" class="remove-button" type="button">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <p v-if="uploading" class="upload-status">Uploading... {{ uploadProgress }}%</p>
      <button v-if="!uploading" @click="uploadFile" class="upload-button" type="button" :disabled="uploading">
        Upload Image
      </button>
    </div>

    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import { uploadService } from '../services/uploadService';

interface Props {
  modelValue?: string;
  folder?: string;
  periodId?: number;
  memberId?: number;
  date?: Date;
}

interface Emits {
  (e: 'update:modelValue', value: string): void;
  (e: 'uploaded', url: string): void;
  (e: 'error', error: string): void;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: '',
  folder: 'payments'
});

const emit = defineEmits<Emits>();

const fileInput = ref<HTMLInputElement | null>(null);
const previewUrl = ref<string | null>(null);
const uploadedUrl = ref<string>(props.modelValue || '');
const isDragging = ref(false);
const uploading = ref(false);
const uploadProgress = ref(0);
const error = ref<string | null>(null);
const selectedFile = ref<File | null>(null);

const triggerFileInput = () => {
  fileInput.value?.click();
};

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (file) {
    processFile(file);
  }
};

const handleDrop = (event: DragEvent) => {
  isDragging.value = false;
  const file = event.dataTransfer?.files[0];
  if (file) {
    processFile(file);
  }
};

const processFile = (file: File) => {
  error.value = null;

  // Validate file type
  if (!file.type.startsWith('image/')) {
    error.value = 'Please select an image file';
    return;
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    error.value = 'File size must be less than 5MB';
    return;
  }

  selectedFile.value = file;

  // Create preview
  const reader = new FileReader();
  reader.onload = (e) => {
    previewUrl.value = e.target?.result as string;
  };
  reader.readAsDataURL(file);
};

const uploadFile = async () => {
  if (!selectedFile.value) return;

  uploading.value = true;
  uploadProgress.value = 0;
  error.value = null;

  try {
    const response = await uploadService.uploadFile(
      selectedFile.value,
      props.folder,
      props.periodId,
      props.memberId,
      props.date
    );
    uploadedUrl.value = response.url;
    previewUrl.value = null;
    selectedFile.value = null;
    emit('update:modelValue', response.url);
    emit('uploaded', response.url);
    uploadProgress.value = 100;
  } catch (err: any) {
    error.value = err.response?.data?.error || 'Failed to upload file';
    emit('error', error.value);
  } finally {
    uploading.value = false;
    setTimeout(() => {
      uploadProgress.value = 0;
    }, 1000);
  }
};

const removeFile = () => {
  selectedFile.value = null;
  previewUrl.value = null;
  uploadedUrl.value = '';
  error.value = null;
  if (fileInput.value) {
    fileInput.value.value = '';
  }
  emit('update:modelValue', '');
  emit('error', '');
};

// Initialize uploadedUrl from modelValue on mount
onMounted(() => {
  if (props.modelValue) {
    uploadedUrl.value = props.modelValue;
  }
});

watch(() => props.modelValue, (newValue) => {
  if (newValue !== undefined) {
    // Only update if the value actually changed
    if (newValue !== uploadedUrl.value && !previewUrl.value) {
      uploadedUrl.value = newValue || '';
      selectedFile.value = null;
    }
  }
});
</script>

<style scoped>
.file-upload {
  @apply w-full;
}

.upload-area {
  @apply border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer transition-colors;
}

.upload-area:hover {
  @apply border-indigo-400 bg-indigo-50;
}

.upload-area.is-dragging {
  @apply border-indigo-500 bg-indigo-100;
}

.upload-content {
  @apply flex flex-col items-center justify-center;
}

.upload-icon {
  @apply w-12 h-12 text-gray-400 mb-4;
}

.upload-text {
  @apply text-sm font-medium text-gray-700 mb-1;
}

.upload-hint {
  @apply text-xs text-gray-500;
}

.preview-area {
  @apply relative;
}

.preview-image {
  @apply w-full h-48 object-contain rounded-lg border border-gray-300;
}

.remove-button {
  @apply absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors;
}

.upload-button {
  @apply mt-2 w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
}

.replace-button {
  @apply mt-2 w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 transition-colors;
}

.upload-status {
  @apply mt-2 text-sm text-gray-600 text-center;
}

.error-message {
  @apply mt-2 text-sm text-red-600;
}

.hidden {
  display: none;
}
</style>

