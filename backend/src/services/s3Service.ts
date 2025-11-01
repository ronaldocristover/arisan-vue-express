import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../utils/prisma';

const s3ClientConfig: any = {
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
    }
};

// Add custom endpoint for Cloudflare R2 or other S3-compatible services
if (process.env.AWS_ENDPOINT) {
    s3ClientConfig.endpoint = process.env.AWS_ENDPOINT;
    // Cloudflare R2 requires forcePathStyle
    s3ClientConfig.forcePathStyle = true;
}

const s3Client = new S3Client(s3ClientConfig);

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || '';

export interface UploadResult {
    url: string;
    key: string;
}

export const uploadFileToS3 = async (
    file: Express.Multer.File,
    folder: string = 'payments',
    periodId?: number,
    memberId?: number,
    date?: Date
): Promise<UploadResult> => {
    try {
        if (!BUCKET_NAME) {
            throw new Error('AWS S3 bucket name is not configured');
        }

        const fileExtension = file.originalname.split('.').pop();
        const uploadDate = date || new Date();
        const dateStr = uploadDate.toISOString().split('T')[0].replace(/-/g, ''); // YYYYMMDD format
        const uuid = uuidv4();

        let fileName: string;

        // If periodId and memberId are provided, use the detailed format
        if (periodId !== undefined && memberId !== undefined) {
            // Format: <period>/<member_id>/<date>-uuid.<extension>
            // Period format: YYYY-MM (year-month)
            try {
                // Fetch period to get year and month
                const period = await prisma.period.findUnique({
                    where: { id: periodId },
                    select: { year: true, month: true }
                });

                if (period) {
                    const periodStr = `${period.year}-${String(period.month).padStart(2, '0')}`; // YYYY-MM
                    fileName = `${folder}/${periodStr}/${memberId}/${dateStr}-${uuid}.${fileExtension}`;
                } else {
                    // Fallback if period not found
                    const periodStr = periodId.toString().padStart(4, '0');
                    fileName = `${folder}/${periodStr}/${memberId}/${dateStr}-${uuid}.${fileExtension}`;
                }
            } catch (error) {
                console.error('Error fetching period for file upload:', error);
                // Fallback format
                const periodStr = periodId.toString().padStart(4, '0');
                fileName = `${folder}/${periodStr}/${memberId}/${dateStr}-${uuid}.${fileExtension}`;
            }
        } else {
            // Fallback to old format if periodId/memberId not provided
            fileName = `${folder}/${uuid}.${fileExtension}`;
        }

        // Upload to S3
        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: BUCKET_NAME,
                Key: fileName,
                Body: file.buffer,
                ContentType: file.mimetype
                // Note: ACL 'public-read' removed. Make bucket public or use presigned URLs if needed
            }
        });

        await upload.done();

        // Construct the URL based on endpoint type
        let url: string;
        if (process.env.AWS_ENDPOINT) {
            // For Cloudflare R2 or custom endpoints with forcePathStyle
            // URL format: https://endpoint/bucket-name/key
            const endpointUrl = process.env.AWS_ENDPOINT.replace(/\/$/, ''); // Remove trailing slash
            url = `${endpointUrl}/${BUCKET_NAME}/${fileName}`;

            // If AWS_PUBLIC_URL is set, use that instead (for custom domains or public R2 URLs)
            if (process.env.AWS_PUBLIC_URL) {
                const publicUrl = process.env.AWS_PUBLIC_URL.replace(/\/$/, ''); // Remove trailing slash
                url = `${publicUrl}/${fileName}`;
            }
        } else {
            // Standard AWS S3 URL format
            url = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${fileName}`;
        }

        return {
            url,
            key: fileName
        };
    } catch (error: any) {
        console.error('Error uploading file to S3:', error);
        throw new Error(`Failed to upload file: ${error.message}`);
    }
};

export const deleteFileFromS3 = async (key: string): Promise<void> => {
    try {
        if (!BUCKET_NAME) {
            throw new Error('AWS S3 bucket name is not configured');
        }

        const command = new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        });

        await s3Client.send(command);
    } catch (error: any) {
        console.error('Error deleting file from S3:', error);
        throw new Error(`Failed to delete file: ${error.message}`);
    }
};

export const extractKeyFromUrl = (url: string): string | null => {
    try {
        // Extract key from S3 URL
        // Formats:
        // - AWS S3: https://bucket-name.s3.region.amazonaws.com/key
        // - Cloudflare R2 path-style: https://endpoint/bucket-name/key
        // - Cloudflare R2 public: https://public-url/key or https://custom-domain/key
        // - Custom endpoint: https://endpoint.com/bucket-name/key or https://endpoint.com/key

        // Remove protocol and domain
        const urlPath = url.replace(/^https?:\/\/[^\/]+/, '');

        // If using path-style (contains bucket in path), extract everything after bucket name
        // Otherwise, extract everything after the first slash (virtual-hosted style)
        const parts = urlPath.split('/').filter(p => p);

        // For path-style URLs with bucket in path, skip the bucket name
        // For virtual-hosted or public URLs, use all path parts as the key
        // We'll try to detect if first part looks like a bucket name (simplified)
        // In practice, the key should start with 'payments/' based on our folder structure
        if (parts.length > 1 && parts[0] !== 'payments' && !parts[0].includes('.')) {
            // Likely path-style: skip bucket name
            return parts.slice(1).join('/');
        }

        // Virtual-hosted style or public URL: use all path parts
        return parts.join('/') || null;
    } catch (error) {
        return null;
    }
};

