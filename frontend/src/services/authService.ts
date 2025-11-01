import api from './api';

export type LoginData = {
    email: string;
    password: string;
};

export type RegisterData = {
    email: string;
    password: string;
    name?: string;
};

export type User = {
    id: number;
    email: string;
    name?: string;
    role: string;
};

export const authService = {
    async login(data: LoginData) {
        const response = await api.post('/auth/login', data);
        return response.data;
    },

    async register(data: RegisterData) {
        const response = await api.post('/auth/register', data);
        return response.data;
    },

    async getMe() {
        const response = await api.get('/auth/me');
        return response.data;
    }
};
