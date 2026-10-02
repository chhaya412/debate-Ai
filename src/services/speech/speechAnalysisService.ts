import { FillerWordOccurrence, SpeechMetrics } from '../../types/voice';

// Comprehensive list of colloquial rhetorical filler words & phrases
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
  { regex: /\b(so basically)\b/gi, word: 'so basically' },
];

export const SPEECH_CHARACTERISTICS_DISCLAIMER =
  'Speech characteristics (speaking speed, pauses, and filler words) reflect rhetorical delivery style and vocal pacing only. They do NOT determine truthfulness, intellectual ability, or the logical validity of your argument.';

export class SpeechAnalysisService {
  /**
   * Analyzes speech characteristics from transcript, duration, and audio telemetry
   */
  public static analyzeCharacteristics(params: {
    transcript: string;
    durationSeconds: number;
    detectedPauses?: number[];
    audioPeakLevel?: number;
    volumeConsistency?: number;
  }): SpeechMetrics {
    const { transcript, durationSeconds, detectedPauses = [], audioPeakLevel = 75, volumeConsistency = 80 } = params;

    const cleanText = transcript.trim();
    const words = cleanText ? cleanText.split(/\s+/).filter(w => w.length > 0) : [];
    const wordCount = words.length;

    // 1. Calculate Speaking Speed (WPM)
    const effectiveMinutes = Math.max(durationSeconds / 60, 0.08); // Floor at ~5 seconds
    const speakingSpeedWpm = wordCount > 0 ? Math.round(wordCount / effectiveMinutes) : 0;

    let speedRating: SpeechMetrics['speedRating'] = 'Optimal Cadence';
    let speedDescription = 'Ideal debate pacing allowing adjudicators to absorb claims without losing momentum.';

    if (speakingSpeedWpm < 110) {
      speedRating = 'Too Slow';
      speedDescription = 'Measured and very deliberate, but may risk timing out before addressing all refutation points.';
    } else if (speakingSpeedWpm <= 135) {
      speedRating = 'Deliberate & Measured';
      speedDescription = 'Commanding and authoritative cadence with clear syllogistic pauses.';
    } else if (speakingSpeedWpm <= 175) {
      speedRating = 'Optimal Cadence';
      speedDescription = 'Standard competitive debate cadence: crisp, impactful, and easy to score.';
    } else if (speakingSpeedWpm <= 215) {
      speedRating = 'Brisk';
      speedDescription = 'High-pressure parliamentary pace maximizing empirical point density per round.';
    } else {
      speedRating = 'Fast / Rapid';
      speedDescription = 'Rapid-fire delivery; ensure diction remains distinct during key premise transitions.';
    }

    // 2. Pause Analysis
    let pauseCount = detectedPauses.length;
    let totalPauseDurationSeconds = detectedPauses.reduce((acc, curr) => acc + curr, 0);

    // If audio analyser didn't register pauses (e.g. background noise), estimate from punctuation
    if (pauseCount === 0 && cleanText.length > 0) {
      const sentenceBreaks = (cleanText.match(/[.!?]+|\s{2,}|,\s/g) || []).length;
      pauseCount = Math.max(1, Math.round(sentenceBreaks * 0.7));
      totalPauseDurationSeconds = pauseCount * 0.9;
    }

    const averagePauseDurationSeconds =
      pauseCount > 0 ? Number((totalPauseDurationSeconds / pauseCount).toFixed(2)) : 0;

    let pauseRating: SpeechMetrics['pauseRating'] = 'Balanced Pacing';
    if (pauseCount <= 1 && durationSeconds > 15) {
      pauseRating = 'Fluid Flow';
    } else if (averagePauseDurationSeconds > 1.8 || (pauseCount / (durationSeconds / 10)) > 2.5) {
      pauseRating = 'Frequent Hesitations';
    } else {
      pauseRating = 'Balanced Pacing';
    }

    // 3. Filler Words Detection
    const fillerWordsDetected: FillerWordOccurrence[] = [];
    let fillerWordsCount = 0;

    FILLER_PATTERNS.forEach(({ regex, word }) => {
      const matches = cleanText.match(regex);
      if (matches && matches.length > 0) {
        fillerWordsCount += matches.length;
        fillerWordsDetected.push({
          word,
          count: matches.length,
        });
      }
    });

    // Sort filler words by frequency
    fillerWordsDetected.sort((a, b) => b.count - a.count);

    const fillerWordsRatio = wordCount > 0 ? Number(((fillerWordsCount / wordCount) * 100).toFixed(1)) : 0;

    // 4. Clarity Metric Calculation
    // Base 88, modulated by filler ratio, volume consistency, and cadence harmony
    let clarityScore = 88;

    // Penalty for high filler word density
    if (fillerWordsRatio > 5) {
      clarityScore -= Math.min(18, Math.round((fillerWordsRatio - 5) * 2.5));
    } else if (fillerWordsRatio > 2.5) {
      clarityScore -= 4;
    } else if (fillerWordsRatio === 0 && wordCount > 25) {
      clarityScore += 5; // Bonus for zero filler words on substantial argument
    }

    // Cadence balance modifier
    if (speedRating === 'Optimal Cadence') {
      clarityScore += 4;
    } else if (speedRating === 'Fast / Rapid' || speedRating === 'Too Slow') {
      clarityScore -= 5;
    }

    // Pause balance modifier
    if (pauseRating === 'Balanced Pacing' || pauseRating === 'Fluid Flow') {
      clarityScore += 3;
    } else {
      clarityScore -= 6;
    }

    clarityScore = Math.max(50, Math.min(98, clarityScore));

    let clarityRating: SpeechMetrics['clarityRating'] = 'Clear & Articulate';
    if (clarityScore >= 90) {
      clarityRating = 'Exceptional Articulation';
    } else if (clarityScore >= 80) {
      clarityRating = 'Clear & Articulate';
    } else if (clarityScore >= 68) {
      clarityRating = 'Moderate Clarity';
    } else {
      clarityRating = 'Needs Pronunciation Focus';
    }

    // 5. Synthesis Feedback
    let pacingFeedback = '';
    if (fillerWordsCount === 0 && speedRating === 'Optimal Cadence') {
      pacingFeedback = 'Commanding delivery with zero detectable filler hesitations and optimal tournament cadence.';
    } else if (fillerWordsCount > 3) {
      pacingFeedback = `Noticeable usage of filler markers (${fillerWordsDetected.slice(0, 2).map(f => `"${f.word}"`).join(', ')}). Replacing hesitations with deliberate 0.5s silent pauses elevates rhetorical authority.`;
    } else if (speedRating === 'Fast / Rapid') {
      pacingFeedback = 'Very high delivery velocity. Decelerating slightly before stating your primary premise will maximize impact with the judges.';
    } else if (speedRating === 'Too Slow') {
      pacingFeedback = 'Cadence was quite measured. Increasing your tempo slightly will allow you to pack more empirical evidence into your round time.';
    } else {
      pacingFeedback = 'Solid delivery rhythm with balanced pausing between logical premises.';
    }

    return {
      durationSeconds: Math.round(durationSeconds),
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
      audioPeakLevel,
      volumeConsistency,
      pacingFeedback,
      disclaimer: SPEECH_CHARACTERISTICS_DISCLAIMER,
    };
  }
}
