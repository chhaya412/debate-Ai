import { Router } from 'express';
import { PersonalityController } from '../controllers/personalityController';

const router = Router();

router.get('/archetypes/all', PersonalityController.getAllArchetypes);
router.get('/:userId', PersonalityController.getPersonality);
router.post('/calculate/:userId', PersonalityController.recalculatePersonality);
router.get('/:userId/history', PersonalityController.getHistory);

export default router;
