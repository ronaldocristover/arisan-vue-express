import api from './api';

export interface Member {
    id: number;
    fullName: string;
    nickname: string;
    altName?: string;
    whatsappNumber?: string;
    group?: string;
    remarks?: string;
    status: string;
    joinedDate?: string;
}

export const memberService = {
    async getAll(params?: any) {
        const response = await api.get('/members', { params });
        return response.data;
    },

    async getById(id: number) {
        const response = await api.get(`/members/${id}`);
        return response.data;
    },

    async create(data: Partial<Member>) {
        const response = await api.post('/members', data);
        return response.data;
    },

    async update(id: number, data: Partial<Member>) {
        const response = await api.put(`/members/${id}`, data);
        return response.data;
    },

    async delete(id: number) {
        const response = await api.delete(`/members/${id}`);
        return response.data;
    }
};
