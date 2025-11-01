import { ref } from 'vue';

export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info';
}

const toasts = ref<Toast[]>([]);
let idCounter = 0;

export const useToast = () => {
    const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
        const id = idCounter++;
        toasts.value.push({ id, message, type });
        setTimeout(() => {
            toasts.value = toasts.value.filter((t) => t.id !== id);
        }, 3000);
    };

    return {
        toasts,
        showToast
    };
};
