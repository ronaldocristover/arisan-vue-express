import { Router } from 'express';
import { getAllNotes, getNoteById, createNote, updateNote, deleteNote } from '../controllers/noteController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.use(authMiddleware);

router.get('/', getAllNotes);
router.get('/:id', getNoteById);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;
