import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticateJWT } from '../middleware/authMiddleware';

const router = Router();

router.get('/profile', authenticateJWT, UserController.getProfile);
router.get('/profile/:id', UserController.getProfile);
router.get('/stats', authenticateJWT, UserController.getStats);
router.get('/stats/:id', UserController.getStats);
router.get('/history', authenticateJWT, UserController.getDebateHistory);
router.get('/history/:id', UserController.getDebateHistory);

export default router;
