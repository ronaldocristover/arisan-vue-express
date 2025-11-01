import api from './api';

export const noteService = {
    async getAll(params?: any) {
        const response = await api.get('/notes', { params });
        return response.data;
    },

    async getById(id: number) {
        const response = await api.get(`/notes/${id}`);
        return response.data;
    },

    async create(data: any) {
        const response = await api.post('/notes', data);
        return response.data;
    },

    async update(id: number, data: any) {
        const response = await api.put(`/notes/${id}`, data);
        return response.data;
    },

    async delete(id: number) {
        const response = await api.delete(`/notes/${id}`);
        return response.data;
    }
};
