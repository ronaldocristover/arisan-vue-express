import { Router } from 'express';
import { getAllMembers, getMemberById, createMember, updateMember, deleteMember } from '../controllers/memberController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getAllMembers);
router.get('/:id', getMemberById);
router.post('/', createMember);
router.put('/:id', updateMember);
router.delete('/:id', deleteMember);

export default router;
