import { Router } from 'express';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import topicRoutes from './topicRoutes';
import debateRoutes from './debateRoutes';
import scoreRoutes from './scoreRoutes';
import leaderboardRoutes from './leaderboardRoutes';
import personalityRoutes from './personalityRoutes';
import voiceRoutes from './voiceRoutes';
import achievementRoutes from './achievementRoutes';
import matchmakingRoutes from './matchmakingRoutes';
import { CrossQuestionController } from '../controllers/crossQuestionController';

const router = Router();

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/topics', topicRoutes);
router.use('/debates', debateRoutes);
router.use('/scores', scoreRoutes);
router.use('/leaderboard', leaderboardRoutes);
router.use('/personality', personalityRoutes);
router.use('/voice', voiceRoutes);
router.use('/achievements', achievementRoutes);
router.use('/matchmaking', matchmakingRoutes);

// AI Cross-Question Endpoints
router.post('/generate-question', CrossQuestionController.generateQuestion);
router.post('/evaluate-cross-answer', CrossQuestionController.evaluateAnswer);

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'AI Debate Arena Core Backend',
    timestamp: new Date().toISOString(),
  });
});

export default router;
