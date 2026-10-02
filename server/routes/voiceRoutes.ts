import { Router } from 'express';
import { VoiceController } from '../controllers/voiceController';

const router = Router();

router.post('/analyze', VoiceController.analyzeSpeech);
router.post('/transcribe', VoiceController.transcribeAudio);
router.get('/engines', VoiceController.getEngines);

export default router;
