import api from './api';

export const paymentService = {
    async getAll(params?: any) {
        const response = await api.get('/payments', { params });
        return response.data;
    },

    async update(id: number, data: any) {
        const response = await api.put(`/payments/${id}`, data);
        return response.data;
    },

    async bulkUpdate(data: any) {
        const response = await api.put('/payments/bulk/update', data);
        return response.data;
    }
};
