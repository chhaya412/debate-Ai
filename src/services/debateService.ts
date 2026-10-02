import { ActiveDebateState, DebateDifficulty, DebateMode, DebateTopic, DebateTurn, MatchResult } from '../types/debate';
import { SpeechMetrics } from '../types/voice';
import { CURRENT_USER, MOCK_TOPICS, AI_OPPONENTS, INITIAL_TRANSCRIPT, MOCK_RESULT } from '../data/mockData';

export class DebateService {
  /**
   * Initializes an active debate session
   */
  static async createDebateSession(
    topic: DebateTopic,
    opponentId: string,
    difficulty: DebateDifficulty,
    mode: DebateMode,
    rounds: number
  ): Promise<ActiveDebateState> {
    const opponent = AI_OPPONENTS.find(o => o.id === opponentId) || AI_OPPONENTS[0];

    return {
      id: `match_${Math.floor(10000 + Math.random() * 90000)}`,
      topic,
      mode,
      difficulty,
      totalRounds: rounds,
      currentRound: 1,
      activeSpeakerSide: 'affirmative',
      secondsRemaining: 120,
      turnDuration: 120,
      status: 'in_progress',
      playerA: CURRENT_USER,
      playerB: opponent,
      transcript: [...INITIAL_TRANSCRIPT],
      isAiAnalyzing: false,
    };
  }

  /**
   * Evaluates user argument with simulated multi-criteria AI judge
   * (Ready to be wired to POST /api/debates/:id/evaluate or Socket.io debate:argument_submit)
   */
  static async evaluateArgument(
    argumentText: string,
    topic: DebateTopic,
    roundNumber: number,
    side: 'affirmative' | 'negative',
    speechMetrics?: SpeechMetrics,
    inputMode: 'voice' | 'text' = 'text'
  ): Promise<DebateTurn> {
    // Simulate server latency for AI judgment pipeline
    await new Promise(resolve => setTimeout(resolve, 2200));

    // Basic heuristic scoring simulation based on input richness
    const wordCount = argumentText.trim().split(/\s+/).length;
    const hasEvidenceCitation = /(study|evidence|data|percent|treaty|convention|research|demonstrated|proves)/i.test(argumentText);
    const hasCounterRebuttal = /(however|opponent|claimed|asserts|counter|despite|flawed|premise)/i.test(argumentText);

    const logicScore = Math.min(20, Math.max(14, Math.floor(15 + Math.random() * 5)));
    const relevanceScore = Math.min(15, Math.max(12, Math.floor(12 + Math.random() * 3)));
    const evidenceScore = hasEvidenceCitation ? Math.floor(13 + Math.random() * 2) : 10;
    const rebuttalScore = hasCounterRebuttal ? Math.floor(16 + Math.random() * 4) : 12;
    const persuasivenessScore = Math.min(15, Math.max(11, Math.floor(12 + Math.random() * 3)));
    const ruleAdherence = 15;

    // Detect potential simulated fallacies if argument contains specific inflammatory triggers
    const fallacies = [];
    let fallacyDeductions = 0;

    if (/(obviously|stupid|ignorant|idiots|clueless)/i.test(argumentText)) {
      fallacies.push({
        id: `fal_${Date.now()}`,
        name: 'Ad Hominem (Critical)',
        quote: 'attacking person rather than premise',
        explanation: 'Argument employed derogatory descriptors targeting the opponent rather than addressing the motion.',
        severity: 'critical' as const,
        deduction: 6,
      });
      fallacyDeductions -= 6;
    } else if (/(everyone knows|always|never|inevitable collapse|apocalypse)/i.test(argumentText)) {
      fallacies.push({
        id: `fal_${Date.now()}`,
        name: 'Slippery Slope (Minor)',
        quote: 'unsubstantiated chain reaction claims',
        explanation: 'Asserted catastrophic cascading outcomes without establishing sequential causal links.',
        severity: 'minor' as const,
        deduction: 3,
      });
      fallacyDeductions -= 3;
    }

    const total = Math.max(0, logicScore + relevanceScore + evidenceScore + rebuttalScore + persuasivenessScore + ruleAdherence + fallacyDeductions);

    return {
      roundNumber,
      speakerId: CURRENT_USER.id,
      speakerName: CURRENT_USER.name,
      speakerAvatar: CURRENT_USER.avatar,
      side,
      argumentText,
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      scores: {
        logic: logicScore,
        relevance: relevanceScore,
        evidence: evidenceScore,
        rebuttal: rebuttalScore,
        persuasiveness: persuasivenessScore,
        ruleAdherence,
        fallacyDeductions,
        total,
      },
      fallacies,
      speechMetrics,
      inputMode,
      aiFeedbackSummary: `${hasEvidenceCitation
        ? 'Well-grounded thesis utilizing empirical warrants. Direct rebuttal effectively shifted burden of proof.'
        : 'Cohesive structure, though evidence score could be elevated by citing international legal frameworks or specific metrics.'}${
        speechMetrics
          ? ` • Vocal Delivery: ${speechMetrics.speakingSpeedWpm} WPM (${speechMetrics.speedRating}), ${speechMetrics.pauseCount} pauses, Clarity: ${speechMetrics.clarityScore}/100`
          : ''
      }`,
      aiCrossQuestion: `Regarding your emphasis on moral liability: if autonomous telemetry provides cryptographic audit trails for every targeting calculation, does that not surpass human memory in courtroom verification?`,
    };
  }

  private static formatClarity(score: number): string {
    return `${score}/100`;
  }

  /**
   * Generates automated synthetic counter-argument for opponent turn
   */
  static async generateOpponentTurn(
    topic: DebateTopic,
    roundNumber: number,
    opponent: typeof AI_OPPONENTS[0]
  ): Promise<DebateTurn> {
    await new Promise(resolve => setTimeout(resolve, 2400));

    const opponentArguments: Record<number, string> = {
      1: `The premise that autonomous systems diminish accountability is fundamentally backwards. Human warfighters experience tunnel vision, sleep deprivation, and battlefield panic—factors responsible for the vast majority of historical friendly fire and collateral atrocities. Algorithmic targeting enforces programmatic constraints that cannot be bypassed by fear or vengeance.`,
      2: `Furthermore, my opponent ignores the strategic reality of hypersonic kinetic warfare. When incoming anti-ship missile salvos approach at Mach 7, the human biological reaction window of 250 milliseconds is mathematically incapable of intercept coordination. To ban autonomous reaction systems is to guarantee the catastrophic loss of defensive carrier strike groups and civilian ports.`,
      3: `In closing, international regulation must govern doctrinal deployment and safety verification architectures rather than enforcing a naive, technologically regressive prohibition. A ban will disarm rule-abiding liberal democracies while state-sponsored adversaries deploy unverified autonomous swarms in total secrecy.`,
    };

    const text = opponentArguments[roundNumber] || opponentArguments[1];

    return {
      roundNumber,
      speakerId: opponent.id,
      speakerName: opponent.name,
      speakerAvatar: opponent.avatar,
      side: 'negative',
      argumentText: text,
      submittedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      scores: {
        logic: 18,
        relevance: 15,
        evidence: 14,
        rebuttal: 17,
        persuasiveness: 14,
        ruleAdherence: 15,
        fallacyDeductions: -3,
        total: 90,
      },
      fallacies: [
        {
          id: `fal_opp_${roundNumber}`,
          name: 'Hasty Generalization (Minor)',
          quote: 'guarantee the catastrophic loss',
          explanation: 'Extrapolates total defense collapse without factoring in non-autonomous electronic warfare countermeasures.',
          severity: 'minor',
          deduction: 3,
        },
      ],
      aiFeedbackSummary: 'Formidable kinetic rebuttal leveraging millisecond response disparities. Minor penalty for hyperbolic outcome projection.',
      aiCrossQuestion: 'If defensive autonomous reaction is permissible, how do you prevent mission creep into offensive autonomous counter-strikes?',
    };
  }

  /**
   * Calls the AI Cross-Question API: POST /generate-question
   */
  static async generateCrossQuestion(
    topic: string,
    playerArgument: string,
    opponentArgument: string,
    previousArguments: Array<any> = [],
    round: number = 1
  ): Promise<import('../types/debate').CrossQuestionData> {
    try {
      const response = await fetch('/generate-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          playerArgument,
          opponentArgument,
          previousArguments,
          round,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (err) {
      console.warn('Cross-question API network notice, using local generator:', err);
    }

    // Fallback if network offline
    const difficulty = round <= 1 ? 'moderate' : round === 2 ? 'hard' : 'extreme';
    return {
      question: `Regarding "${topic.slice(0, 55)}...": on what empirical precedent do you prove your core mechanism withstands real-world geopolitical defection?`,
      targetPlayer: 'A',
      reason: 'Exposing unsupported claims: lack of verifiable empirical warrants for systemic compliance.',
      difficulty,
      vulnerabilityType: 'unsupported claims',
      round,
    };
  }

  /**
   * Calls the Cross-Answer Evaluation API: POST /evaluate-cross-answer
   */
  static async evaluateCrossAnswer(
    topic: string,
    question: string,
    questionReason: string,
    answer: string,
    targetPlayer: 'A' | 'B' = 'A',
    round: number = 1
  ): Promise<import('../types/debate').CrossAnswerEvaluation> {
    try {
      const response = await fetch('/evaluate-cross-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          question,
          questionReason,
          answer,
          targetPlayer,
          round,
        }),
      });

      if (response.ok) {
        return await response.json();
      }
    } catch (err) {
      console.warn('Evaluate answer API network notice, using local fallback:', err);
    }

    const words = answer.trim().split(/\s+/).length;
    const score = Math.min(95, Math.max(50, Math.floor(65 + Math.min(25, words * 0.4))));
    return {
      score,
      grade: score >= 90 ? 'A' : score >= 80 ? 'B+' : score >= 70 ? 'B' : 'C',
      passed: score >= 70,
      breakdown: {
        directness: 16,
        counterEvidence: 15,
        logicalConsistency: 16,
        rebuttalClarity: 16,
        defenseDepth: 14,
      },
      vulnerabilityAddressed: score >= 70,
      feedback: 'Responded directly to the cross-examination challenge, establishing coherent mitigating factors.',
      strengths: ['Direct address to inquiry premise', 'Maintained composure under pressure'],
      weaknesses: ['Can enhance empirical backing with quantitative statistics'],
      targetPlayer,
      round,
    };
  }

  /**
   * Compiles match verdict dossier
   */
  static async compileVerdict(state: ActiveDebateState): Promise<MatchResult> {
    // Tally scores
    let totalA = 0;
    let totalB = 0;

    state.transcript.forEach(turn => {
      if (turn.side === 'affirmative') {
        totalA += turn.scores?.total || 80;
      } else {
        totalB += turn.scores?.total || 80;
      }
    });

    const isWinnerA = totalA >= totalB;

    return {
      ...MOCK_RESULT,
      debateId: state.id,
      topic: state.topic,
      winnerId: isWinnerA ? state.playerA.id : state.playerB.id,
      winnerName: isWinnerA ? state.playerA.name : state.playerB.name,
      scoreA: totalA,
      scoreB: totalB,
      playerA: state.playerA,
      playerB: state.playerB,
    };
  }
}
