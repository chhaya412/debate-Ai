import { Router } from 'express';
import { ScoreController } from '../controllers/scoreController';

const router = Router();

router.get('/debate/:debateId', ScoreController.getScoresByDebateId);

export default router;
