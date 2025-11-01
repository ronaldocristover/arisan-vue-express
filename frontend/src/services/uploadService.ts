import api from './api';

export interface UploadResponse {
    url: string;
    key: string;
    message: string;
}

export const uploadService = {
    async uploadFile(
        file: File,
        folder: string = 'payments',
        periodId?: number,
        memberId?: number,
        date?: Date
    ): Promise<UploadResponse> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', folder);
        
        if (periodId !== undefined) {
            formData.append('periodId', periodId.toString());
        }
        if (memberId !== undefined) {
            formData.append('memberId', memberId.toString());
        }
        if (date) {
            formData.append('date', date.toISOString());
        }

        // Content-Type will be automatically set by browser for FormData
        const response = await api.post('/upload', formData);

        return response.data;
    }
};

