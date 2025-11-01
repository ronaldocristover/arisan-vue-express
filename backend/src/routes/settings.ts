import { Router } from 'express';
import { getAllSettings, getSetting, updateSetting, updateSettings } from '../controllers/settingsController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getAllSettings);
router.get('/:key', getSetting);
router.put('/:key', updateSetting);
router.put('/', updateSettings);

export default router;
