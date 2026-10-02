import { Router } from 'express';
import { TopicController } from '../controllers/topicController';
import { authenticateJWT } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';

const router = Router();

router.get('/', TopicController.getTopics);
router.get('/:id', TopicController.getTopicById);
router.post('/', authenticateJWT, validateBody(['title', 'motion']), TopicController.createTopic);

export default router;
