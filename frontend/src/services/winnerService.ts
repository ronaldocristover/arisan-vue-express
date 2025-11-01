import api from './api';

export const winnerService = {
    async getAll(params?: any) {
        const response = await api.get('/winners', { params });
        return response.data;
    },

    async getById(id: number) {
        const response = await api.get(`/winners/${id}`);
        return response.data;
    },

    async selectWinner(data: any) {
        const response = await api.post('/winners', data);
        return response.data;
    },

    async markMoneyGiven(id: number, notes?: string) {
        const response = await api.patch(`/winners/${id}/mark-money-given`, { notes });
        return response.data;
    },

    async delete(id: number) {
        const response = await api.delete(`/winners/${id}`);
        return response.data;
    }
};
