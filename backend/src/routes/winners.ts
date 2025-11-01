import { Router } from 'express';
import { getAllWinners, getWinnerById, selectWinner, markMoneyGiven, deleteWinner } from '../controllers/winnerController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getAllWinners);
router.get('/:id', getWinnerById);
router.post('/', selectWinner);
router.patch('/:id/mark-money-given', markMoneyGiven);
router.delete('/:id', deleteWinner);

export default router;
