import api from './api';

export const periodService = {
    async getAll(params?: any) {
        const response = await api.get('/periods', { params });
        return response.data;
    },

    async getById(id: number) {
        const response = await api.get(`/periods/${id}`);
        return response.data;
    },

    async create(data: any) {
        const response = await api.post('/periods', data);
        return response.data;
    },

    async update(id: number, data: any) {
        const response = await api.put(`/periods/${id}`, data);
        return response.data;
    },

    async close(id: number) {
        const response = await api.post(`/periods/${id}/close`);
        return response.data;
    },

    async addMembers(id: number, memberIds: number[]) {
        const response = await api.post(`/periods/${id}/add-members`, { memberIds });
        return response.data;
    }
};
