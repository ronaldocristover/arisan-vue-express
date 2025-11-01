import { Router } from 'express';
import { getAllPeriods, getPeriodById, createPeriod, updatePeriod, closePeriod, addMembersToPeriod } from '../controllers/periodController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getAllPeriods);
router.get('/:id', getPeriodById);
router.post('/', createPeriod);
router.put('/:id', updatePeriod);
router.post('/:id/close', closePeriod);
router.post('/:id/add-members', addMembersToPeriod);

export default router;
