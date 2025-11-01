import { Router } from 'express';
import { uploadFile } from '../controllers/uploadController';
import { authMiddleware } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authMiddleware);

// Single file upload
router.post('/', upload.single('file'), uploadFile);

export default router;

