import { Router } from 'express';
import { AchievementController } from '../controllers/achievementController';

const router = Router();

router.get('/:userId', AchievementController.getUserAchievements);
router.post('/unlock', AchievementController.unlockAchievement);

export default router;
