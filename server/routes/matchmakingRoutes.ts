import { Router } from 'express';
import { MatchmakingController } from '../controllers/matchmakingController';

const router = Router();

router.post('/queue', MatchmakingController.joinQueue);
router.get('/status/:ticketId', MatchmakingController.checkStatus);
router.post('/cancel', MatchmakingController.cancelQueue);

export default router;
