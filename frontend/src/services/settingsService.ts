import api from './api';

export const settingsService = {
    async getAll() {
        const response = await api.get('/settings');
        return response.data;
    },

    async get(key: string) {
        const response = await api.get(`/settings/${key}`);
        return response.data;
    },

    async update(key: string, value: string) {
        const response = await api.put(`/settings/${key}`, { value });
        return response.data;
    },

    async updateAll(settings: Record<string, string>) {
        const response = await api.put('/settings', { settings });
        return response.data;
    }
};
