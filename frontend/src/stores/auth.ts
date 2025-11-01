import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService } from '../services/authService';
import type { User } from '../services/authService';

export const useAuthStore = defineStore('auth', () => {
    const user = ref<User | null>(null);
    const token = ref<string | null>(localStorage.getItem('token'));

    const isAuthenticated = computed(() => !!token.value);

    const setAuth = (newToken: string, newUser: User) => {
        token.value = newToken;
        user.value = newUser;
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
    };

    const clearAuth = () => {
        token.value = null;
        user.value = null;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    };

    const loadUser = async () => {
        try {
            const response = await authService.getMe();
            user.value = response.user;
        } catch (error) {
            clearAuth();
            throw error;
        }
    };

    const initAuth = () => {
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        if (savedToken && savedUser) {
            token.value = savedToken;
            user.value = JSON.parse(savedUser);
        }
    };

    return {
        user,
        token,
        isAuthenticated,
        setAuth,
        clearAuth,
        loadUser,
        initAuth
    };
});
