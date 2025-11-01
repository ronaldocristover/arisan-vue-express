import { Request, Response } from 'express';
import { uploadFileToS3 } from '../services/s3Service';

export const uploadFile = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const folder = req.body.folder || 'payments';
        const periodId = req.body.periodId ? parseInt(req.body.periodId, 10) : undefined;
        const memberId = req.body.memberId ? parseInt(req.body.memberId, 10) : undefined;
        const date = req.body.date ? new Date(req.body.date) : undefined;

        const result = await uploadFileToS3(req.file, folder, periodId, memberId, date);

        res.json({
            url: result.url,
            key: result.key,
            message: 'File uploaded successfully'
        });
    } catch (error: any) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: error.message || 'Failed to upload file' });
    }
};

