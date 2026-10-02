import { GoogleGenAI } from '@google/genai';
import { ENV } from '../config/env';

export type CrossQuestionDifficulty = 'easy' | 'moderate' | 'medium' | 'hard' | 'extreme';
export type VulnerabilityCategory =
  | 'unsupported claims'
  | 'contradictions'
  | 'weak evidence'
  | 'assumptions'
  | 'logical fallacies'
  | 'missing evidence'
  | 'inconsistencies with previous statements';

export interface GenerateQuestionInput {
  topic: string;
  playerArgument: string;
  opponentArgument?: string;
  previousArguments?: Array<{
    speaker?: string;
    side?: string;
    round?: number;
    text?: string;
    argumentText?: string;
  }>;
  round?: number;
}

export interface GenerateQuestionOutput {
  question: string;
  targetPlayer: 'A' | 'B';
  reason: string;
  difficulty: CrossQuestionDifficulty;
  vulnerabilityType?: VulnerabilityCategory;
}

export interface EvaluateAnswerInput {
  topic: string;
  question: string;
  questionReason?: string;
  answer: string;
  targetPlayer?: 'A' | 'B';
  round?: number;
}

export interface EvaluateAnswerOutput {
  score: number; // 0 - 100
  grade: string; // A+, A, B+, B, C, F
  passed: boolean;
  breakdown: {
    directness: number; // 0 - 20: Addresses the core question without evading
    counterEvidence: number; // 0 - 20: Provides verifiable data, precedents, or citations
    logicalConsistency: number; // 0 - 20: Resolves the identified contradiction or assumption
    rebuttalClarity: number; // 0 - 20: Rhetorical precision and impact articulation
    defenseDepth: number; // 0 - 20: Resiliency against edge cases and counter-factuals
  };
  vulnerabilityAddressed: boolean;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
}

export class AiCrossQuestionService {
  private static aiClient: GoogleGenAI | null = null;

  private static getClient(): GoogleGenAI | null {
    if (!this.aiClient && ENV.GEMINI_API_KEY && ENV.GEMINI_API_KEY.startsWith('AIza')) {
      try {
        this.aiClient = new GoogleGenAI({ apiKey: ENV.GEMINI_API_KEY });
      } catch (err) {
        console.warn('[AiCrossQuestionService] GenAI initialization notice:', err);
      }
    }
    return this.aiClient;
  }

  /**
   * Determine progressive difficulty based on debate round
   */
  public static calculateDifficulty(round: number): CrossQuestionDifficulty {
    if (round <= 1) return 'moderate';
    if (round === 2) return 'hard';
    return 'extreme';
  }

  /**
   * Analyzes both players' arguments and generates a challenging cross-examination question
   */
  public static async generateQuestion(input: GenerateQuestionInput): Promise<GenerateQuestionOutput> {
    const roundNumber = Number(input.round) || 1;
    const difficulty = this.calculateDifficulty(roundNumber);
    const client = this.getClient();

    if (client) {
      try {
        const prompt = `You are a World Universities Debating Championship Grandmaster Chief Adjudicator.
Analyze the following debate discourse and formulate an aggressive, surgically precise Cross-Examination question.

DEBATE MOTION/TOPIC: "${input.topic}"
ROUND: ${roundNumber} (Difficulty Level: ${difficulty})

PLAYER A'S ARGUMENT:
"${input.playerArgument || 'No explicit argument recorded.'}"

PLAYER B'S OPPONENT ARGUMENT:
"${input.opponentArgument || 'No explicit argument recorded.'}"

PREVIOUS ROUND STATEMENTS:
${
  input.previousArguments && input.previousArguments.length > 0
    ? input.previousArguments.map((pa, i) => `Round ${pa.round || i + 1} (${pa.speaker || pa.side || 'Speaker'}): ${pa.text || pa.argumentText || ''}`).join('\n')
    : 'None'
}

YOUR MISSION:
Examine both arguments to identify the single most glaring flaw among these 7 vulnerability categories:
1. unsupported claims (sweeping assertions without empirical warrants)
2. contradictions (clash between statements or internal logic)
3. weak evidence (anecdotal, outdated, or speculative proof)
4. assumptions (unstated, non-guaranteed prerequisites)
5. logical fallacies (ad hominem, slippery slope, straw man, false dilemma, etc.)
6. missing evidence (crucial absent empirical proof for burden of proof)
7. inconsistencies with previous statements (contradictions with earlier rounds)

Select TARGET PLAYER ("A" or "B") who exhibits the more severe dialectical vulnerability in this round.
Generate a challenging question tailored to round ${roundNumber} (progressive difficulty: ${difficulty}).
Format the response strictly as valid JSON matching this schema:
{
  "question": "string (the direct interrogative challenge to the target player)",
  "targetPlayer": "A" or "B",
  "reason": "string (explicitly explaining what vulnerability is exposed and why)",
  "difficulty": "${difficulty}",
  "vulnerabilityType": "unsupported claims" | "contradictions" | "weak evidence" | "assumptions" | "logical fallacies" | "missing evidence" | "inconsistencies with previous statements"
}`;

        const response = await client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const raw = response.text?.trim();
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.question && (parsed.targetPlayer === 'A' || parsed.targetPlayer === 'B')) {
            return {
              question: parsed.question,
              targetPlayer: parsed.targetPlayer,
              reason: parsed.reason || `Exposing ${parsed.vulnerabilityType || 'assumptions'} in the argumentative structure.`,
              difficulty: parsed.difficulty || difficulty,
              vulnerabilityType: parsed.vulnerabilityType,
            };
          }
        }
      } catch (err: any) {
        console.warn('[AiCrossQuestionService] Gemini call notice, utilizing deterministic engine:', err.message);
      }
    }

    // High-performance deterministic dialectical analysis engine
    return this.deterministicGenerateQuestion(input, roundNumber, difficulty);
  }

  /**
   * Deterministic dialectical analysis engine that deeply scans text for the 7 vulnerabilities
   */
  private static deterministicGenerateQuestion(
    input: GenerateQuestionInput,
    round: number,
    difficulty: CrossQuestionDifficulty
  ): GenerateQuestionOutput {
    const textA = (input.playerArgument || '').trim();
    const textB = (input.opponentArgument || '').trim();
    const prevArgs = input.previousArguments || [];

    // Analyze Player A & B vulnerability profiles
    const analysisA = this.inspectArgumentVulnerabilities(textA, prevArgs, 'A');
    const analysisB = this.inspectArgumentVulnerabilities(textB, prevArgs, 'B');

    // Choose target player based on highest vulnerability severity
    let target: 'A' | 'B' = 'A';
    let chosenVulnerability = analysisA;

    if (analysisB.severityScore > analysisA.severityScore) {
      target = 'B';
      chosenVulnerability = analysisB;
    } else if (analysisA.severityScore > analysisB.severityScore) {
      target = 'A';
      chosenVulnerability = analysisA;
    } else {
      // Tie-breaker: target Player B in even rounds if both have comparable flaws
      if (textB.length > 20 && round % 2 === 0) {
        target = 'B';
        chosenVulnerability = analysisB;
      } else {
        target = 'A';
        chosenVulnerability = analysisA;
      }
    }

    const targetText = target === 'A' ? textA : textB;
    const opponentText = target === 'A' ? textB : textA;

    // Generate tailored question according to round and identified vulnerability
    const generated = this.craftQuestionByVulnerability(
      input.topic,
      target,
      targetText,
      opponentText,
      chosenVulnerability,
      round,
      difficulty
    );

    return {
      question: generated.question,
      targetPlayer: target,
      reason: generated.reason,
      difficulty,
      vulnerabilityType: chosenVulnerability.type,
    };
  }

  /**
   * Scans an argument for the 7 specific dialectical flaws
   */
  private static inspectArgumentVulnerabilities(
    text: string,
    previousArgs: any[],
    playerTag: 'A' | 'B'
  ): { type: VulnerabilityCategory; severityScore: number; detail: string } {
    if (!text || text.length < 15) {
      return {
        type: 'missing evidence',
        severityScore: 40,
        detail: 'The argument lacks substantive empirical or logical foundation.',
      };
    }

    // 1. Check for Logical Fallacies (Ad Hominem, Slippery Slope, etc.)
    if (/\b(idiot|stupid|ignorant|clueless|moron|liar|naive|corrupt|shameful|pathetic)\b/i.test(text)) {
      return {
        type: 'logical fallacies',
        severityScore: 95,
        detail: 'Ad hominem character attack directed against opponent persona rather than motion premises.',
      };
    }
    if (/\b(inevitable collapse|apocalypse|total disaster|extinction of humanity|guaranteed catastrophe|destroy everything)\b/i.test(text)) {
      return {
        type: 'logical fallacies',
        severityScore: 90,
        detail: 'Slippery slope fallacy asserting catastrophic cascading outcomes without proven sequential links.',
      };
    }

    // 2. Check for Inconsistencies with Previous Statements
    if (previousArgs.length > 0) {
      const priorTextFromSameSpeaker = previousArgs
        .filter(p => !p.speaker || p.speaker === playerTag || p.side === (playerTag === 'A' ? 'affirmative' : 'negative'))
        .map(p => p.text || p.argumentText || '')
        .join(' ');

      if (priorTextFromSameSpeaker.length > 15) {
        const priorFavoredBan = /\b(total ban|prohibit|zero tolerance|unconditional|never allow)\b/i.test(priorTextFromSameSpeaker);
        const nowAllowsExceptions = /\b(exceptions?|regulated deployment|conditional|permissible|border patrol|allow)\b/i.test(text);

        if (priorFavoredBan && nowAllowsExceptions) {
          return {
            type: 'inconsistencies with previous statements',
            severityScore: 92,
            detail: 'Shifted baseline thesis from unconditional prohibition to conditional regulation.',
          };
        }
      }
    }

    // 3. Check for Unsupported Claims
    const hasNumbers = /\d+%|\$[\d,]+|\b(in 20\d\d|article \d+|study|statistics|empirical|peer-reviewed)\b/i.test(text);
    const hasHighImpactClaims = /\b(proves that|everyone agrees|undeniable|guarantees|drastically reduces|completely eliminates|100%|infallible)\b/i.test(text);

    if (hasHighImpactClaims && !hasNumbers) {
      return {
        type: 'unsupported claims',
        severityScore: 84,
        detail: 'Presents definitive outcome claims without citing verifying empirical metrics or citations.',
      };
    }

    // 4. Check for Hidden Assumptions
    if (/\b(naturally|obviously|inherently|will never|inevitably|must assume|simply agree|all nations will)\b/i.test(text)) {
      return {
        type: 'assumptions',
        severityScore: 80,
        detail: 'Relies on unexamined assumption regarding universal compliance or unyielding actor behavior.',
      };
    }

    // 5. Check for Weak Evidence
    if (/\b(some people say|many believe|it is widely known|history shows|anecdotally)\b/i.test(text)) {
      return {
        type: 'weak evidence',
        severityScore: 76,
        detail: 'Cites generic public consensus or subjective impressions rather than rigorous institutional data.',
      };
    }

    // 6. Check for Contradictions with Motion / Core Thesis
    if (/\b(however|although|despite this|on the other hand|yet we also)\b/i.test(text)) {
      return {
        type: 'contradictions',
        severityScore: 74,
        detail: 'Tension between concessions granted and the primary burden of proof.',
      };
    }

    // 7. Check for Missing Evidence
    if (!hasNumbers && text.length > 50) {
      return {
        type: 'missing evidence',
        severityScore: 70,
        detail: 'Operates entirely on rhetorical assertions without external verifiable precedent or empirical citation.',
      };
    }

    return {
      type: 'assumptions',
      severityScore: 50,
      detail: 'Implicit assumption that operational benefits outweigh systemic transition costs.',
    };
  }

  /**
   * Crafts a sharp, Socratic challenge tailored to the round and vulnerability
   */
  private static craftQuestionByVulnerability(
    topic: string,
    target: 'A' | 'B',
    targetText: string,
    opponentText: string,
    vulnerability: { type: VulnerabilityCategory; detail: string },
    round: number,
    difficulty: CrossQuestionDifficulty
  ): { question: string; reason: string } {
    const motionSnippet = topic.slice(0, 60);

    switch (vulnerability.type) {
      case 'unsupported claims':
        if (round >= 3) {
          return {
            question: `You assert definitive systemic outcomes for "${motionSnippet}", yet you have not provided empirical causal validation: what verified mechanism guarantees your claimed result under non-idealized geopolitical friction?`,
            reason: `Exposing unsupported claims: target presented sweeping causal guarantees without providing verifiable longitudinal data or institutional precedents.`,
          };
        } else if (round === 2) {
          return {
            question: `On what empirical baseline do you substantiate the claim that this intervention will produce net positive outcomes without triggering retaliatory countermeasures from opposing factions?`,
            reason: `Exposing unsupported claims: asserting functional benefits while ignoring opposing strategic responses.`,
          };
        }
        return {
          question: `What primary source or audited metric substantiates your core assertion regarding the feasibility of this policy?`,
          reason: `Exposing unsupported claims: initial constructive lacks direct empirical citations.`,
        };

      case 'inconsistencies with previous statements':
        return {
          question: `In earlier rounds your position emphasized absolute safeguards, whereas your latest rebuttal concedes functional exemptions. How do you resolve this internal contradiction without abandoning your central burden of proof?`,
          reason: `Exposing inconsistencies with previous statements: dialectical shift between early foundational claims and later pragmatic concessions.`,
        };

      case 'contradictions':
        return {
          question: `Your argument acknowledges the necessity of enforcement, yet denies the regulatory overhead required to police compliance: how can both premises hold true simultaneously under scrutiny?`,
          reason: `Exposing contradictions: mutually irreconcilable premises regarding enforcement capabilities and institutional reach.`,
        };

      case 'weak evidence':
        return {
          question: `You cite broad historical trends rather than controlled empirical findings: how do you demonstrate that your historical analogy remains valid given contemporary technological and legal disparities?`,
          reason: `Exposing weak evidence: reliance on loose historical parallels rather than rigorous sector-specific data.`,
        };

      case 'logical fallacies':
        if (/\b(idiot|stupid|ignorant|clueless|moron|liar|naive|corrupt|shameful|pathetic)\b/i.test(targetText)) {
          return {
            question: `You directed personal characterizations toward your opponent rather than refuting their premise: how does this persona critique logically invalidate their core thesis on "${motionSnippet}"?`,
            reason: `Exposing logical fallacies: Ad Hominem attack bypassing substantive debate motion.`,
          };
        }
        return {
          question: `Your argument pivots toward worst-case apocalyptic projections rather than sequential causal proof. If your initial premise fails to trigger the catastrophic threshold, does your entire case collapse?`,
          reason: `Exposing logical fallacies: reliance on hyperbolic chain-reaction argumentation (slippery slope) to manufacture urgency.`,
        };

      case 'missing evidence':
        return {
          question: `You have articulated the normative principle behind "${motionSnippet}", but omitted quantitative proof of harm: where is the empirical documentation demonstrating that the status quo harm is systemic rather than isolated?`,
          reason: `Exposing missing evidence: failure to substantiate the threshold magnitude of the status quo harm.`,
        };

      case 'assumptions':
      default:
        if (round >= 3) {
          return {
            question: `Your entire case rests upon the unexamined assumption that rational state actors will honor international conventions during existential conflict: what happens to your model the moment a rogue actor defects?`,
            reason: `Exposing assumptions: presupposing perpetual adherence to normative rules without an enforcement hammer during existential crisis.`,
          };
        } else if (round === 2) {
          return {
            question: `You assume the proposed policy operates in a vacuum, ignoring market substitution effects: why won't demand simply migrate to illicit, unmonitored alternative channels?`,
            reason: `Exposing assumptions: failing to model secondary behavioral and economic substitution effects.`,
          };
        }
        return {
          question: `What fundamental presupposition in your argument must an uncommitted adjudicator accept in order for your conclusion to remain valid?`,
          reason: `Exposing assumptions: identifying baseline premises that have been taken for granted without warrant.`,
        };
    }
  }

  /**
   * Evaluates how effectively the player answered the AI-generated cross-examination question
   */
  public static async evaluateAnswer(input: EvaluateAnswerInput): Promise<EvaluateAnswerOutput> {
    const client = this.getClient();
    const roundNumber = Number(input.round) || 1;

    if (client) {
      try {
        const prompt = `You are an elite debate adjudicator evaluating a debater's response to an AI Cross-Examination challenge.

DEBATE MOTION: "${input.topic}"
AI CROSS-EXAMINATION QUESTION: "${input.question}"
EXPOSED VULNERABILITY: "${input.questionReason || 'Core assumption or evidentiary deficit'}"
DEBATER'S DEFENSE/ANSWER:
"${input.answer}"

Evaluate the answer across these 5 specific dimensions (each 0 - 20 points):
1. directness (Did the debater directly tackle the question rather than evading or pivoting?)
2. counterEvidence (Did they cite specific proof, precedents, or data to substantiate their defense?)
3. logicalConsistency (Did they successfully resolve the identified tension without introducing new contradictions?)
4. rebuttalClarity (How precise, articulate, and compelling was the framing of their defense?)
5. defenseDepth (Did they withstand edge cases, systemic trade-offs, and counter-factual scenarios?)

Provide output strictly as JSON with this schema:
{
  "score": number (0 to 100),
  "grade": "A+" | "A" | "A-" | "B+" | "B" | "C" | "F",
  "passed": boolean (true if score >= 70),
  "breakdown": {
    "directness": number (0-20),
    "counterEvidence": number (0-20),
    "logicalConsistency": number (0-20),
    "rebuttalClarity": number (0-20),
    "defenseDepth": number (0-20)
  },
  "vulnerabilityAddressed": boolean,
  "feedback": "string (executive summary of defense effectiveness)",
  "strengths": ["string", "string"],
  "weaknesses": ["string", "string"]
}`;

        const response = await client.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const raw = response.text?.trim();
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.breakdown && typeof parsed.score === 'number') {
            return {
              score: Math.min(100, Math.max(0, parsed.score)),
              grade: parsed.grade || this.calculateGrade(parsed.score),
              passed: parsed.score >= 70,
              breakdown: {
                directness: Number(parsed.breakdown.directness) || 15,
                counterEvidence: Number(parsed.breakdown.counterEvidence) || 14,
                logicalConsistency: Number(parsed.breakdown.logicalConsistency) || 15,
                rebuttalClarity: Number(parsed.breakdown.rebuttalClarity) || 15,
                defenseDepth: Number(parsed.breakdown.defenseDepth) || 14,
              },
              vulnerabilityAddressed: parsed.vulnerabilityAddressed ?? (parsed.score >= 70),
              feedback: parsed.feedback || 'Defense addressed key aspects of the inquiry.',
              strengths: parsed.strengths || ['Direct answer to cross-examination challenge'],
              weaknesses: parsed.weaknesses || ['Could deepen empirical substantiation'],
            };
          }
        }
      } catch (err: any) {
        console.warn('[AiCrossQuestionService] Gemini answer eval notice, utilizing deterministic engine:', err.message);
      }
    }

    return this.deterministicEvaluateAnswer(input);
  }

  /**
   * Deterministic scoring engine for cross-examination answer defense
   */
  private static deterministicEvaluateAnswer(input: EvaluateAnswerInput): EvaluateAnswerOutput {
    const text = (input.answer || '').trim();
    const words = text.split(/\s+/).filter(Boolean);
    const len = words.length;

    // 1. Directness (0-20)
    let directness = 12;
    if (len < 10) {
      directness = 6;
    } else {
      if (/\b(because|specifically|to address this|the answer is|in response|regarding|we solve this by)\b/i.test(text)) {
        directness += 5;
      }
      if (/\b(firstly|secondly|primarily|namely)\b/i.test(text)) {
        directness += 3;
      }
    }
    directness = Math.min(20, Math.max(0, directness));

    // 2. Counter Evidence (0-20)
    let counterEvidence = 10;
    const hasCitations = /\b(study|percent|\d+%|treaty|convention|article|precedent|data|audit|court|research|harvard|geneva|un|protocol)\b/i.test(text);
    if (hasCitations) {
      counterEvidence += 7;
    }
    if (/\b(for example|such as|demonstrated in|empirically)\b/i.test(text)) {
      counterEvidence += 3;
    }
    counterEvidence = Math.min(20, Math.max(0, counterEvidence));

    // 3. Logical Consistency (0-20)
    let logicalConsistency = 13;
    if (/\b(therefore|thus|consequently|ensures that|demonstrates that|leads to)\b/i.test(text)) {
      logicalConsistency += 4;
    }
    // Penalize evasive or fallacious patterns
    if (/\b(who cares|obviously|irrelevant question|you are stupid)\b/i.test(text)) {
      logicalConsistency -= 8;
    }
    logicalConsistency = Math.min(20, Math.max(0, logicalConsistency));

    // 4. Rebuttal Clarity (0-20)
    let rebuttalClarity = 12;
    if (len >= 30 && len <= 120) {
      rebuttalClarity += 5; // ideal concise cross-exam defense length
    } else if (len > 120) {
      rebuttalClarity += 3;
    }
    if (/\b(distinction|clarify|crucial difference|reframe)\b/i.test(text)) {
      rebuttalClarity += 3;
    }
    rebuttalClarity = Math.min(20, Math.max(0, rebuttalClarity));

    // 5. Defense Depth (0-20)
    let defenseDepth = 11;
    if (/\b(even if|contingency|fallback|mitigation|enforcement mechanism|safeguard|penalty|failsafe)\b/i.test(text)) {
      defenseDepth += 7;
    }
    if (len > 40) {
      defenseDepth += 2;
    }
    defenseDepth = Math.min(20, Math.max(0, defenseDepth));

    const total = directness + counterEvidence + logicalConsistency + rebuttalClarity + defenseDepth;
    const passed = total >= 70;
    const vulnerabilityAddressed = directness >= 15 && logicalConsistency >= 15;

    const strengths: string[] = [];
    const weaknesses: string[] = [];

    if (directness >= 16) strengths.push('Direct, unevasive response that tackled the crux of the inquiry.');
    else weaknesses.push('Deflection tendency: did not cleanly confront the primary assumption.');

    if (counterEvidence >= 16) strengths.push('Substantiated defense with concrete empirical markers or structural precedent.');
    else weaknesses.push('Evidence deficit: relied on conceptual claims without corroborating verification.');

    if (defenseDepth >= 16) strengths.push('Excellent edge-case anticipation and systemic failsafe explanation.');
    else weaknesses.push('Vulnerable to secondary failure modes if the primary mechanism breaks down.');

    const feedback = passed
      ? 'Strong cross-examination response. Debater acknowledged the core dialectical vulnerability and established plausible systemic mitigation without conceding strategic ground.'
      : 'Incomplete defense under pressure. The explanation skirted the core assumption and left the argument exposed to opponent exploitation.';

    return {
      score: total,
      grade: this.calculateGrade(total),
      passed,
      breakdown: {
        directness,
        counterEvidence,
        logicalConsistency,
        rebuttalClarity,
        defenseDepth,
      },
      vulnerabilityAddressed,
      feedback,
      strengths: strengths.length ? strengths : ['Structured communication under interrogation'],
      weaknesses: weaknesses.length ? weaknesses : ['Could provide tighter statistical warrants'],
    };
  }

  private static calculateGrade(score: number): string {
    if (score >= 93) return 'A+';
    if (score >= 88) return 'A';
    if (score >= 82) return 'A-';
    if (score >= 76) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'F';
  }
}
