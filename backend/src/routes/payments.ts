import { Router } from 'express';
import { getAllPayments, updatePayment, bulkUpdatePayments } from '../controllers/paymentController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getAllPayments);
router.put('/:id', updatePayment);
router.put('/bulk/update', bulkUpdatePayments);

export default router;
