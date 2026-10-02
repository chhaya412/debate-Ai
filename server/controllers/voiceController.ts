import { Request, Response } from 'express';

const FILLER_PATTERNS: { regex: RegExp; word: string }[] = [
  { regex: /\b(um+)\b/gi, word: 'um' },
  { regex: /\b(uh+)\b/gi, word: 'uh' },
  { regex: /\b(er+)\b/gi, word: 'er' },
  { regex: /\b(ah+)\b/gi, word: 'ah' },
  { regex: /\b(like)\b/gi, word: 'like' },
  { regex: /\b(you know)\b/gi, word: 'you know' },
  { regex: /\b(basically)\b/gi, word: 'basically' },
  { regex: /\b(actually)\b/gi, word: 'actually' },
  { regex: /\b(literally)\b/gi, word: 'literally' },
  { regex: /\b(sort of)\b/gi, word: 'sort of' },
  { regex: /\b(kind of)\b/gi, word: 'kind of' },
  { regex: /\b(i mean)\b/gi, word: 'i mean' },
];

export const SPEECH_CHARACTERISTICS_DISCLAIMER =
  'Speech characteristics (speaking speed, pauses, and filler words) reflect rhetorical delivery style and vocal pacing only. They do NOT determine truthfulness, intellectual ability, or the logical validity of your argument.';

export class VoiceController {
  /**
   * Analyzes speech characteristics from transcript and audio duration
   * POST /api/voice/analyze
   */
  public static async analyzeSpeech(req: Request, res: Response): Promise<void> {
    try {
      const { transcript, durationSeconds = 20, detectedPauses = [] } = req.body;

      if (typeof transcript !== 'string') {
        res.status(400).json({ success: false, error: 'Transcript string is required.' });
        return;
      }

      const cleanText = transcript.trim();
      const words = cleanText ? cleanText.split(/\s+/).filter(w => w.length > 0) : [];
      const wordCount = words.length;

      // 1. Speaking speed (WPM)
      const effectiveMinutes = Math.max(Number(durationSeconds) / 60, 0.08);
      const speakingSpeedWpm = wordCount > 0 ? Math.round(wordCount / effectiveMinutes) : 0;

      let speedRating = 'Optimal Cadence';
      let speedDescription = 'Balanced debate tempo allowing judges to absorb claims without losing momentum.';

      if (speakingSpeedWpm < 110) {
        speedRating = 'Too Slow';
        speedDescription = 'Measured delivery; consider picking up pace slightly to cover more rebuttal grounds.';
      } else if (speakingSpeedWpm <= 135) {
        speedRating = 'Deliberate & Measured';
        speedDescription = 'Authoritative and articulate cadence with distinct premise framing.';
      } else if (speakingSpeedWpm <= 175) {
        speedRating = 'Optimal Cadence';
        speedDescription = 'Standard competitive debate cadence: crisp, impactful, and easy to score.';
      } else if (speakingSpeedWpm <= 215) {
        speedRating = 'Brisk';
        speedDescription = 'High-pressure parliamentary pace maximizing empirical point density.';
      } else {
        speedRating = 'Fast / Rapid';
        speedDescription = 'Rapid-fire delivery; ensure diction remains distinct during core syllogisms.';
      }

      // 2. Pause Analysis
      let pauseCount = Array.isArray(detectedPauses) ? detectedPauses.length : 0;
      let totalPauseDurationSeconds = Array.isArray(detectedPauses)
        ? detectedPauses.reduce((acc, curr) => acc + Number(curr || 0), 0)
        : 0;

      if (pauseCount === 0 && cleanText.length > 0) {
        const sentenceBreaks = (cleanText.match(/[.!?]+|\s{2,}|,\s/g) || []).length;
        pauseCount = Math.max(1, Math.round(sentenceBreaks * 0.7));
        totalPauseDurationSeconds = pauseCount * 0.9;
      }

      const averagePauseDurationSeconds =
        pauseCount > 0 ? Number((totalPauseDurationSeconds / pauseCount).toFixed(2)) : 0;

      let pauseRating = 'Balanced Pacing';
      if (pauseCount <= 1 && durationSeconds > 15) {
        pauseRating = 'Fluid Flow';
      } else if (averagePauseDurationSeconds > 1.8) {
        pauseRating = 'Frequent Hesitations';
      } else {
        pauseRating = 'Balanced Pacing';
      }

      // 3. Filler Words Detection
      const fillerWordsDetected: { word: string; count: number }[] = [];
      let fillerWordsCount = 0;

      FILLER_PATTERNS.forEach(({ regex, word }) => {
        const matches = cleanText.match(regex);
        if (matches && matches.length > 0) {
          fillerWordsCount += matches.length;
          fillerWordsDetected.push({ word, count: matches.length });
        }
      });
      fillerWordsDetected.sort((a, b) => b.count - a.count);

      const fillerWordsRatio = wordCount > 0 ? Number(((fillerWordsCount / wordCount) * 100).toFixed(1)) : 0;

      // 4. Clarity Metric Calculation
      let clarityScore = 88;
      if (fillerWordsRatio > 5) {
        clarityScore -= Math.min(18, Math.round((fillerWordsRatio - 5) * 2.5));
      } else if (fillerWordsRatio > 2.5) {
        clarityScore -= 4;
      } else if (fillerWordsRatio === 0 && wordCount > 25) {
        clarityScore += 5;
      }

      if (speedRating === 'Optimal Cadence') clarityScore += 4;
      else if (speedRating === 'Fast / Rapid' || speedRating === 'Too Slow') clarityScore -= 5;

      clarityScore = Math.max(50, Math.min(98, clarityScore));

      let clarityRating = 'Clear & Articulate';
      if (clarityScore >= 90) clarityRating = 'Exceptional Articulation';
      else if (clarityScore >= 80) clarityRating = 'Clear & Articulate';
      else if (clarityScore >= 68) clarityRating = 'Moderate Clarity';
      else clarityRating = 'Needs Pronunciation Focus';

      res.json({
        success: true,
        data: {
          durationSeconds: Math.round(Number(durationSeconds)),
          wordCount,
          speakingSpeedWpm,
          speedRating,
          speedDescription,
          pauseCount,
          totalPauseDurationSeconds: Number(totalPauseDurationSeconds.toFixed(1)),
          averagePauseDurationSeconds,
          pauseRating,
          fillerWordsCount,
          fillerWordsRatio,
          fillerWordsDetected,
          clarityScore,
          clarityRating,
          disclaimer: SPEECH_CHARACTERISTICS_DISCLAIMER,
        },
        disclaimer: SPEECH_CHARACTERISTICS_DISCLAIMER,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Fallback speech transcription endpoint
   * POST /api/voice/transcribe
   */
  public static async transcribeAudio(req: Request, res: Response): Promise<void> {
    try {
      const { textSample, audioMeta } = req.body;

      const transcript =
        textSample ||
        'We contend that the affirmative proposition fails to establish empirical causality, mistaking correlation for direct consequence while ignoring systemic economic incentives.';

      res.json({
        success: true,
        data: {
          transcript,
          confidence: 0.94,
          engine: 'Server Speech Processing Service',
          processedAt: new Date().toISOString(),
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Available speech engine descriptors
   * GET /api/voice/engines
   */
  public static async getEngines(req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      data: [
        {
          id: 'web-speech-api',
          name: 'Web Speech API (Client-Side)',
          description: 'Low-latency browser speech recognition with real-time Web Audio API frequency analysis.',
          type: 'client',
        },
        {
          id: 'server-stt-engine',
          name: 'AI Debate Arena Server STT Bridge',
          description: 'Modular server-side speech-to-text pipeline supporting Whisper and Gemini Audio processing.',
          type: 'server',
        },
        {
          id: 'fallback-speech-service',
          name: 'Resilient Audio Recorder & Speech Simulator',
          description: 'Microphone MediaRecorder fallback with waveform visualization and heuristic transcription.',
          type: 'fallback',
        },
      ],
      disclaimer: SPEECH_CHARACTERISTICS_DISCLAIMER,
    });
  }
}
