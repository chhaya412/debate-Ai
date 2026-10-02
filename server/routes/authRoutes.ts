import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';

const router = Router();

router.post('/register', validateBody(['username', 'email', 'password']), AuthController.register);
router.post('/login', validateBody(['email', 'password']), AuthController.login);
router.post('/logout', AuthController.logout);
router.get('/me', authenticateJWT, AuthController.getMe);

export default router;
