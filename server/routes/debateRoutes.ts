import { Router } from 'express';
import { DebateController } from '../controllers/debateController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';

const router = Router();

router.post('/', authenticateJWT, DebateController.createDebate);
router.get('/:id', DebateController.getDebate);
router.post(
  '/:id/arguments',
  authenticateJWT,
  validateBody(['side', 'argumentText']),
  DebateController.submitArgument
);
router.post('/:id/conclude', authenticateJWT, DebateController.endDebate);

export default router;
