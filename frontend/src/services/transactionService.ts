import api from './api';

export interface Transaction {
    id: number;
    type: 'income' | 'expense';
    amount: number | string;
    category: string;
    description: string;
    notes?: string;
    transactionDate: string;
    paymentId?: number;
    winnerId?: number;
    payment?: any;
    winner?: any;
    createdAt: string;
    updatedAt: string;
}

export const transactionService = {
    async getAll(params?: any) {
        const response = await api.get('/transactions', { params });
        return response.data;
    },

    async getById(id: number) {
        const response = await api.get(`/transactions/${id}`);
        return response.data;
    },

    async create(data: Partial<Transaction>) {
        const response = await api.post('/transactions', data);
        return response.data;
    },

    async update(id: number, data: Partial<Transaction>) {
        const response = await api.put(`/transactions/${id}`, data);
        return response.data;
    },

    async delete(id: number) {
        const response = await api.delete(`/transactions/${id}`);
        return response.data;
    },

    async getSummary(params?: any) {
        const response = await api.get('/transactions/summary', { params });
        return response.data;
    }
};

