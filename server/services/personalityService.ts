import { DebatePersonalityModel, IDebatePersonality, IPersonalityRecommendation } from '../models/DebatePersonality';
import { DebateModel, IDebate } from '../models/Debate';
import { isMongoConnected } from '../config/db';
import { CURRENT_USER } from '../../src/data/mockData';

export interface PersonalityArchetypeDefinition {
  name: string;
  tagline: string;
  description: string;
  icon: string;
  weights: {
    logic: number;
    rebuttal: number;
    evidence: number;
    persuasiveness: number;
    aggressiveness: number;
    consistency: number;
    emotionalAppeal: number;
    riskTaking: number;
  };
  strengthsPool: string[];
  weaknessesPool: string[];
}

export const ARCHETYPES: PersonalityArchetypeDefinition[] = [
  {
    name: 'The Strategist',
    tagline: 'Calculates the debate endgame three rounds in advance.',
    description:
      'Constructs structurally unassailable frameworks. Relies on systemic coherence, foresight, and tactical concessions to control debate momentum.',
    icon: 'Compass',
    weights: {
      logic: 0.9,
      rebuttal: 0.75,
      evidence: 0.7,
      persuasiveness: 0.8,
      aggressiveness: 0.5,
      consistency: 0.95,
      emotionalAppeal: 0.45,
      riskTaking: 0.7,
    },
    strengthsPool: [
      'Exceptional framing that traps opponents into defensive positions',
      'High structural consistency across all debate phases',
      'Calculated turn transitions that preserve long-term point parity',
    ],
    weaknessesPool: [
      'Can appear overly cerebral or detached in emotionally resonant motions',
      'May under-attack when an aggressive opponent creates erratic chaos',
    ],
  },
  {
    name: 'The Counter-Attacker',
    tagline: "Turns the opponent's strongest argument into their greatest liability.",
    description:
      'A reactive predator who exposes logical inconsistencies, exploits concessions, and delivers devastating counter-punches during rebuttal turns.',
    icon: 'ShieldAlert',
    weights: {
      logic: 0.8,
      rebuttal: 0.95,
      evidence: 0.65,
      persuasiveness: 0.75,
      aggressiveness: 0.85,
      consistency: 0.7,
      emotionalAppeal: 0.5,
      riskTaking: 0.75,
    },
    strengthsPool: [
      'Rapid dismantling of opponent premises in cross-examination',
      'Penetrating identification of false equivalences and evasive defenses',
      'High refutation velocity that exhausts opponent prep time',
    ],
    weaknessesPool: [
      'May rely excessively on opponent mistakes rather than establishing an affirmative thesis',
      'Risk of becoming overly adversarial or incurring refutation penalties',
    ],
  },
  {
    name: 'The Evidence Hunter',
    tagline: 'Submerges every dispute in unimpeachable empirical reality.',
    description:
      'Armed with statistical density, scientific studies, and forensic citations. Believes that rhetorical flourish is meaningless without hard data.',
    icon: 'FileSearch',
    weights: {
      logic: 0.85,
      rebuttal: 0.7,
      evidence: 0.95,
      persuasiveness: 0.75,
      aggressiveness: 0.55,
      consistency: 0.85,
      emotionalAppeal: 0.35,
      riskTaking: 0.5,
    },
    strengthsPool: [
      'Unmatched empirical citation density and dataset grounding',
      'Virtually immune to factual refutations from opposing debaters',
      'Excels in policy, bioethics, and technical economics motions',
    ],
    weaknessesPool: [
      'Risk of "data-dumping" without connecting numbers to normative moral stakes',
      'Vulnerable when debates shift into philosophical or purely speculative territory',
    ],
  },
  {
    name: 'The Persuader',
    tagline: 'Masters the room through compelling narrative and moral resonance.',
    description:
      'A charismatic orator who connects arguments to human stakes, ethical duty, and vivid narrative resonance, moving adjudicators with rhetorical power.',
    icon: 'Flame',
    weights: {
      logic: 0.7,
      rebuttal: 0.7,
      evidence: 0.6,
      persuasiveness: 0.95,
      aggressiveness: 0.6,
      consistency: 0.75,
      emotionalAppeal: 0.9,
      riskTaking: 0.7,
    },
    strengthsPool: [
      'Magnetic rhetorical pacing and unforgettable impact framing',
      'Evocative moral appeals that contextualize abstract policies into human consequences',
      'High adjudicator engagement and persuasiveness ratings',
    ],
    weaknessesPool: [
      'Occasional vulnerability to "Appeal to Emotion" fallacy deductions if evidence is thin',
      'Can be trapped by rigid syllogistic counter-arguments in technical rounds',
    ],
  },
  {
    name: 'The Logical Machine',
    tagline: 'Dismantles fallacies with ruthless syllogistic precision.',
    description:
      'Treats debate as formal analytical proof. Premise by premise, deduction by deduction, eliminates subjectivity until only undeniable truth remains.',
    icon: 'Cpu',
    weights: {
      logic: 0.98,
      rebuttal: 0.85,
      evidence: 0.8,
      persuasiveness: 0.7,
      aggressiveness: 0.6,
      consistency: 0.95,
      emotionalAppeal: 0.2,
      riskTaking: 0.55,
    },
    strengthsPool: [
      'Pristine formal syllogisms with near-zero fallacy deductions',
      'Unflappable consistency that holds up against emotional theatrics',
      'Mathematical clarity in defining terms and causal chains',
    ],
    weaknessesPool: [
      'Can sound clinical or robotic to non-technical adjudicators',
      'Neglects Pathos, underestimating the persuasive weight of emotional empathy',
    ],
  },
  {
    name: 'The Aggressive Challenger',
    tagline: 'Dictates the battleground through unrelenting rhetorical offense.',
    description:
      'Commands the room with high-tempo pressure, audacious counter-theses, and fearless cross-examination, forcing opponents onto their back foot.',
    icon: 'Swords',
    weights: {
      logic: 0.75,
      rebuttal: 0.85,
      evidence: 0.65,
      persuasiveness: 0.8,
      aggressiveness: 0.98,
      consistency: 0.65,
      emotionalAppeal: 0.65,
      riskTaking: 0.9,
    },
    strengthsPool: [
      'Dominates tempo, denying opponents time to consolidate their best arguments',
      'Audacious gambits that surprise opponents and shift burden of proof',
      'Electrifying clash that commands judge attention and breaks stale consensus',
    ],
    weaknessesPool: [
      'High variance: bold risks can backfire if counter-evidence is strong',
      'Prone to aggressive refutation penalties or ad hominem slips under pressure',
    ],
  },
];

// In-memory store for fallback when MongoDB is not connected
const memoryPersonalities = new Map<string, any>();

// Seed default profile for Vanguard_Alpha
const DEFAULT_VANGUARD_PERSONALITY = {
  userId: CURRENT_USER.id,
  username: CURRENT_USER.name,
  archetype: 'The Counter-Attacker',
  secondaryArchetype: 'The Strategist',
  archetypeTagline: "Turns the opponent's strongest argument into their greatest liability.",
  archetypeDescription:
    'A reactive predator who exposes logical inconsistencies, exploits concessions, and delivers devastating counter-punches during rebuttal turns.',
  archetypeIcon: 'ShieldAlert',
  traits: {
    logic: 92,
    rebuttal: 94,
    evidence: 81,
    persuasiveness: 87,
    aggressiveness: 88,
    consistency: 89,
    emotionalAppeal: 64,
    riskTaking: 83,
  },
  strengths: [
    'Penetrating refutation agility that dismantles opponent premises in under 60 seconds',
    'High cross-examination resilience under hostile AI interrogation',
    'Calculated strategic aggression that commands the debate tempo without losing structural discipline',
  ],
  weaknesses: [
    'Emotional appeal (Pathos) is under-utilized, occasionally appearing clinical on humanitarian motions',
    'Evidence citation density dips slightly in rapid-fire round 3 closing statements',
  ],
  recommendations: [
    {
      id: 'rec_1',
      title: 'Pathos Calibration Drill',
      description: 'Incorporate 1-2 vivid human impact case studies in opening frameworks to balance pure syllogism.',
      focusTrait: 'emotionalAppeal',
      priority: 'High',
      exerciseName: 'Human Stake Framing',
    },
    {
      id: 'rec_2',
      title: 'Empirical Pre-Loading',
      description: 'Pre-compile 3 verifiable statistical datasets for rebuttal rounds to insulate against Evidence Hunters.',
      focusTrait: 'evidence',
      priority: 'Medium',
      exerciseName: 'Data Density Anchor',
    },
    {
      id: 'rec_3',
      title: 'Tempo Modulation',
      description: 'Deliberately decelerate cadence before delivering core syllogisms to amplify rhetorical impact.',
      focusTrait: 'persuasiveness',
      priority: 'Maintenance',
      exerciseName: 'Rhetorical Cadence Pause',
    },
  ],
  debatesAnalyzed: 142,
  history: [
    {
      debateId: 'match_88490',
      completedAt: new Date(Date.now() - 86400000 * 3),
      archetype: 'The Counter-Attacker',
      traits: {
        logic: 90,
        rebuttal: 92,
        evidence: 80,
        persuasiveness: 85,
        aggressiveness: 86,
        consistency: 88,
        emotionalAppeal: 62,
        riskTaking: 81,
      },
      deltaScore: 1.5,
      note: 'Victory vs Kaelen_Frost (+18 ELO)',
    },
    {
      debateId: 'match_88491',
      completedAt: new Date(Date.now() - 86400000),
      archetype: 'The Counter-Attacker',
      traits: {
        logic: 91,
        rebuttal: 93,
        evidence: 81,
        persuasiveness: 86,
        aggressiveness: 87,
        consistency: 88,
        emotionalAppeal: 63,
        riskTaking: 82,
      },
      deltaScore: 1.2,
      note: 'Victory vs Logos_Prime (+21 ELO)',
    },
    {
      debateId: 'match_88492',
      completedAt: new Date(),
      archetype: 'The Counter-Attacker',
      traits: {
        logic: 92,
        rebuttal: 94,
        evidence: 81,
        persuasiveness: 87,
        aggressiveness: 88,
        consistency: 89,
        emotionalAppeal: 64,
        riskTaking: 83,
      },
      deltaScore: 2.1,
      note: 'Victory vs AURA-7 (+24 ELO)',
    },
  ],
  disclaimer:
    'Debate Personality profiles and trait scores are algorithmic performance heuristics designed for competitive debate practice and strategic analysis. They are NOT scientifically or psychologically validated personality metrics.',
  createdAt: new Date(),
  updatedAt: new Date(),
};

memoryPersonalities.set(CURRENT_USER.id, DEFAULT_VANGUARD_PERSONALITY);

export class PersonalityService {
  /**
   * Disclaimer mandated by user instruction
   */
  public static readonly DISCLAIMER =
    'Debate Personality profiles and trait scores are algorithmic performance heuristics designed for competitive debate practice and strategic analysis. They are NOT scientifically or psychologically validated personality metrics.';

  /**
   * Get user's debate personality profile
   */
  public static async getPersonalityByUserId(userId: string): Promise<any> {
    if (isMongoConnected) {
      try {
        const found = await DebatePersonalityModel.findOne({ userId });
        if (found) return found.toObject();
      } catch (err) {
        console.warn('[PersonalityService] Mongo find failed, using memory store:', err);
      }
    }

    if (memoryPersonalities.has(userId)) {
      return memoryPersonalities.get(userId);
    }

    // If new user or no record found, compute from history or initialize
    return await this.calculatePersonality(userId);
  }

  /**
   * Analyze user's historical debates and calculate the 8 personality dimensions
   */
  public static async calculatePersonality(userId: string): Promise<any> {
    // 1. Fetch user debates
    let debates: any[] = [];
    if (isMongoConnected) {
      try {
        debates = await DebateModel.find({
          $or: [
            { 'participants.affirmative.userId': userId },
            { 'participants.negative.userId': userId },
          ],
          status: 'completed',
        }).sort({ completedAt: -1 }).limit(20);
      } catch (e) {
        console.warn('[PersonalityService] Could not fetch debates from DB:', e);
      }
    }

    // 2. Extract arguments, scores, and turns for this user
    let userTurns: any[] = [];
    let roundScores: {
      logic: number;
      rebuttal: number;
      evidence: number;
      persuasiveness: number;
      ruleAdherence: number;
      fallacies: number;
      total: number;
    }[] = [];

    debates.forEach((d) => {
      const isAff = d.participants?.affirmative?.userId === userId;
      const mySide = isAff ? 'affirmative' : 'negative';

      d.transcript?.forEach((t: any) => {
        if (t.speakerId === userId || t.side === mySide) {
          userTurns.push(t);
          if (t.scores) {
            roundScores.push({
              logic: t.scores.logic || 15,
              rebuttal: t.scores.rebuttal || 15,
              evidence: t.scores.evidence || 12,
              persuasiveness: t.scores.persuasiveness || 14,
              ruleAdherence: t.scores.ruleAdherence || 13,
              fallacies: Math.abs(t.scores.fallacyDeductions || 0),
              total: t.scores.total || 75,
            });
          }
        }
      });
    });

    // 3. Compute textual analysis indicators from user arguments
    let totalWords = 0;
    let evidenceKeywordsCount = 0;
    let emotionalKeywordsCount = 0;
    let aggressiveKeywordsCount = 0;
    let riskKeywordsCount = 0;

    const evidencePatterns = [
      /\b(data|study|studies|percent|%|statistics|empirical|researchers|according to|telemetry|article \d+|protocol|cited|verifiable|dataset)\b/gi,
    ];
    const emotionalPatterns = [
      /\b(human suffering|devastating|moral obligation|ethical imperative|heartbreaking|tragedy|innocent lives|dignity|compassion|justice|future generation)\b/gi,
    ];
    const aggressivePatterns = [
      /\b(fallacy|absurd|contradiction|flawed|untenable|refute|categorically|dismantle|false dilemma|hollow|evasion|collapses|proves nothing)\b/gi,
    ];
    const riskPatterns = [
      /\b(even if we concede|boldly assert|contrary to consensus|paradigm shift|unorthodox|inevitable catastrophe|radical counter|existential gamble)\b/gi,
    ];

    userTurns.forEach((turn) => {
      const text = turn.argumentText || '';
      const words = text.split(/\s+/).filter(Boolean);
      totalWords += words.length;

      evidencePatterns.forEach((p) => {
        const matches = text.match(p);
        if (matches) evidenceKeywordsCount += matches.length;
      });

      emotionalPatterns.forEach((p) => {
        const matches = text.match(p);
        if (matches) emotionalKeywordsCount += matches.length;
      });

      aggressivePatterns.forEach((p) => {
        const matches = text.match(p);
        if (matches) aggressiveKeywordsCount += matches.length;
      });

      riskPatterns.forEach((p) => {
        const matches = text.match(p);
        if (matches) riskKeywordsCount += matches.length;
      });
    });

    // 4. Calculate the 8 trait scores (normalized 0 - 100)
    // Default baseline weights for a competitive debater
    const baseLogic = roundScores.length
      ? (roundScores.reduce((acc, r) => acc + (r.logic / 20) * 100, 0) / roundScores.length)
      : 84;
    const baseRebuttal = roundScores.length
      ? (roundScores.reduce((acc, r) => acc + (r.rebuttal / 20) * 100, 0) / roundScores.length)
      : 82;
    const baseEvidence = roundScores.length
      ? (roundScores.reduce((acc, r) => acc + (r.evidence / 15) * 100, 0) / roundScores.length)
      : 76;
    const basePersuasiveness = roundScores.length
      ? (roundScores.reduce((acc, r) => acc + (r.persuasiveness / 15) * 100, 0) / roundScores.length)
      : 80;

    // Word density boosts
    const wordsPerTurn = userTurns.length ? totalWords / userTurns.length : 120;
    const evidenceDensity = wordsPerTurn > 0 ? (evidenceKeywordsCount / (totalWords || 1)) * 1000 : 8;
    const emotionalDensity = wordsPerTurn > 0 ? (emotionalKeywordsCount / (totalWords || 1)) * 1000 : 5;
    const aggressiveDensity = wordsPerTurn > 0 ? (aggressiveKeywordsCount / (totalWords || 1)) * 1000 : 7;
    const riskDensity = wordsPerTurn > 0 ? (riskKeywordsCount / (totalWords || 1)) * 1000 : 4;

    // Consistency calculation: Inverse standard deviation of scores across rounds
    let consistencyScore = 85;
    if (roundScores.length >= 2) {
      const totals = roundScores.map((r) => r.total);
      const mean = totals.reduce((a, b) => a + b, 0) / totals.length;
      const variance = totals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / totals.length;
      const stdDev = Math.sqrt(variance);
      // stdDev < 3 is 95+ consistency, stdDev > 15 is < 60 consistency
      consistencyScore = Math.round(Math.max(50, Math.min(98, 100 - stdDev * 2.8)));
    }

    // Logic score: Combines rubric logic score with low fallacies
    const avgFallacies = roundScores.length
      ? roundScores.reduce((acc, r) => acc + r.fallacies, 0) / roundScores.length
      : 1;
    const logicScore = Math.round(
      Math.max(40, Math.min(99, baseLogic * 0.85 + (10 - avgFallacies * 2) * 1.5))
    );

    // Rebuttal score
    const rebuttalScore = Math.round(
      Math.max(40, Math.min(99, baseRebuttal * 0.9 + (aggressiveDensity > 6 ? 5 : 0)))
    );

    // Evidence usage score
    const evidenceScore = Math.round(
      Math.max(35, Math.min(99, baseEvidence * 0.7 + Math.min(30, evidenceDensity * 2.8)))
    );

    // Persuasiveness score
    const persuasivenessScore = Math.round(
      Math.max(40, Math.min(99, basePersuasiveness * 0.8 + Math.min(20, emotionalDensity * 1.5 + 5)))
    );

    // Aggressiveness score
    const aggressivenessScore = Math.round(
      Math.max(30, Math.min(99, 50 + aggressiveDensity * 4.2))
    );

    // Emotional appeal score
    const emotionalAppealScore = Math.round(
      Math.max(25, Math.min(95, 45 + emotionalDensity * 5.0))
    );

    // Risk taking score
    const riskTakingScore = Math.round(
      Math.max(30, Math.min(98, 52 + riskDensity * 4.5 + (aggressivenessScore > 80 ? 8 : 0)))
    );

    const traits = {
      logic: logicScore,
      rebuttal: rebuttalScore,
      evidence: evidenceScore,
      persuasiveness: persuasivenessScore,
      aggressiveness: aggressivenessScore,
      consistency: consistencyScore,
      emotionalAppeal: emotionalAppealScore,
      riskTaking: riskTakingScore,
    };

    // 5. Match with Archetypes via Affinity Vector dot-product / euclidean closeness
    let bestArchetype = ARCHETYPES[0];
    let secondArchetype = ARCHETYPES[1];
    let highestAffinity = -1;
    let secondHighestAffinity = -1;

    ARCHETYPES.forEach((arch) => {
      // Affinity calculation: dot product normalized
      const affinity =
        (traits.logic / 100) * arch.weights.logic +
        (traits.rebuttal / 100) * arch.weights.rebuttal +
        (traits.evidence / 100) * arch.weights.evidence +
        (traits.persuasiveness / 100) * arch.weights.persuasiveness +
        (traits.aggressiveness / 100) * arch.weights.aggressiveness +
        (traits.consistency / 100) * arch.weights.consistency +
        (traits.emotionalAppeal / 100) * arch.weights.emotionalAppeal +
        (traits.riskTaking / 100) * arch.weights.riskTaking;

      if (affinity > highestAffinity) {
        secondHighestAffinity = highestAffinity;
        secondArchetype = bestArchetype;
        highestAffinity = affinity;
        bestArchetype = arch;
      } else if (affinity > secondHighestAffinity) {
        secondHighestAffinity = affinity;
        secondArchetype = arch;
      }
    });

    // 6. Generate dynamic Strengths, Weaknesses, and Recommendations
    const { strengths, weaknesses, recommendations } = this.generateInsights(traits, bestArchetype);

    const profilePayload: any = {
      userId,
      username: userId === CURRENT_USER.id ? CURRENT_USER.name : 'Debater',
      archetype: bestArchetype.name,
      secondaryArchetype: secondArchetype.name,
      archetypeTagline: bestArchetype.tagline,
      archetypeDescription: bestArchetype.description,
      archetypeIcon: bestArchetype.icon,
      traits,
      strengths,
      weaknesses,
      recommendations,
      debatesAnalyzed: Math.max(debates.length, 1),
      disclaimer: this.DISCLAIMER,
      updatedAt: new Date(),
    };

    // Persist to Mongo or memory
    if (isMongoConnected) {
      try {
        const updated = await DebatePersonalityModel.findOneAndUpdate(
          { userId },
          { $set: profilePayload },
          { upsert: true, new: true }
        );
        return updated.toObject();
      } catch (err) {
        console.error('[PersonalityService] Mongo update failed:', err);
      }
    }

    memoryPersonalities.set(userId, {
      ...profilePayload,
      history: memoryPersonalities.get(userId)?.history || [],
      createdAt: memoryPersonalities.get(userId)?.createdAt || new Date(),
    });

    return memoryPersonalities.get(userId);
  }

  /**
   * Update personality after a completed debate match
   */
  public static async updatePersonalityAfterDebate(
    userId: string,
    debate: {
      id?: string;
      _id?: string;
      debateId?: string;
      topicTitle?: string;
      winnerId?: string;
      transcript?: any[];
      participants?: any;
    }
  ): Promise<any> {
    if (!userId || userId.startsWith('ai_opp_')) return null;

    console.log(`[PersonalityService] Updating debate personality for ${userId} following match completion.`);

    // Get current personality to calculate delta
    const current = await this.getPersonalityByUserId(userId);
    const updated = await this.calculatePersonality(userId);

    const debateId = String(debate.id || debate._id || debate.debateId || 'match_' + Date.now());
    const isWinner = debate.winnerId === userId;
    const delta = Math.round(
      (updated.traits.logic - (current?.traits?.logic || updated.traits.logic)) +
      (updated.traits.rebuttal - (current?.traits?.rebuttal || updated.traits.rebuttal)) +
      (isWinner ? 2 : -1)
    );

    const historyPoint = {
      debateId,
      completedAt: new Date(),
      archetype: updated.archetype,
      traits: { ...updated.traits },
      deltaScore: delta,
      note: `${isWinner ? 'Victory' : 'Completion'}: ${debate.topicTitle || 'Debate Match'} (${delta >= 0 ? '+' : ''}${delta})`,
    };

    if (isMongoConnected) {
      try {
        await DebatePersonalityModel.updateOne(
          { userId },
          {
            $push: {
              history: {
                $each: [historyPoint],
                $slice: -15, // Keep last 15 points
              },
            },
            $set: { lastDebateId: debateId, updatedAt: new Date() },
          }
        );
      } catch (e) {
        console.warn('[PersonalityService] Mongo history push error:', e);
      }
    }

    if (memoryPersonalities.has(userId)) {
      const mem = memoryPersonalities.get(userId);
      const existingHistory = mem.history || [];
      existingHistory.push(historyPoint);
      if (existingHistory.length > 15) existingHistory.shift();
      mem.history = existingHistory;
      mem.lastDebateId = debateId;
      mem.traits = updated.traits;
      mem.archetype = updated.archetype;
      mem.debatesAnalyzed = (mem.debatesAnalyzed || 0) + 1;
      memoryPersonalities.set(userId, mem);
    }

    return updated;
  }

  /**
   * Helper to derive dynamic strengths, weaknesses, and improvement recommendations
   */
  private static generateInsights(
    traits: {
      logic: number;
      rebuttal: number;
      evidence: number;
      persuasiveness: number;
      aggressiveness: number;
      consistency: number;
      emotionalAppeal: number;
      riskTaking: number;
    },
    archetype: PersonalityArchetypeDefinition
  ): {
    strengths: string[];
    weaknesses: string[];
    recommendations: IPersonalityRecommendation[];
  } {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const recommendations: IPersonalityRecommendation[] = [];

    // Sort traits by highest to lowest
    const sortedTraits = (Object.keys(traits) as (keyof typeof traits)[]).sort(
      (a, b) => traits[b] - traits[a]
    );

    const topTraits = sortedTraits.slice(0, 3);
    const bottomTraits = sortedTraits.slice(-2);

    // Derive strengths
    topTraits.forEach((t) => {
      switch (t) {
        case 'logic':
          strengths.push('Watertight syllogistic framing that minimizes cognitive fallacies');
          break;
        case 'rebuttal':
          strengths.push('High refutation speed, swiftly neutralizing opponent core claims');
          break;
        case 'evidence':
          strengths.push('Forensic empirical grounding and statistical citation density');
          break;
        case 'persuasiveness':
          strengths.push('Compelling rhetoric and framing that resonates with adjudicators');
          break;
        case 'aggressiveness':
          strengths.push('Relentless tempo control that forces opponents onto the defensive');
          break;
        case 'consistency':
          strengths.push('Unwavering round-to-round structural execution and point security');
          break;
        case 'emotionalAppeal':
          strengths.push('Vivid normative and humanitarian framing that elevates moral stakes');
          break;
        case 'riskTaking':
          strengths.push('Audacious counter-theses and unconventional tactical concessions');
          break;
      }
    });

    // Blend in archetype strengths
    if (archetype.strengthsPool && archetype.strengthsPool[0]) {
      strengths.unshift(archetype.strengthsPool[0]);
    }

    // Derive weaknesses
    bottomTraits.forEach((t) => {
      switch (t) {
        case 'logic':
          weaknesses.push('Occasional vulnerability to false dilemma or slippery slope deductions');
          break;
        case 'rebuttal':
          weaknesses.push('Under-addressing secondary counter-arguments in round 2 exchanges');
          break;
        case 'evidence':
          weaknesses.push('Relies on theoretical assertion over concrete empirical case studies');
          break;
        case 'persuasiveness':
          weaknesses.push('Delivery can become overly technical or dry for general audiences');
          break;
        case 'aggressiveness':
          weaknesses.push('Passive cross-examination allowing opponents too much recovery time');
          break;
        case 'consistency':
          weaknesses.push('Noticeable scoring variance between opening framework and closing summary');
          break;
        case 'emotionalAppeal':
          weaknesses.push('Under-utilizes human-interest framing, missing moral persuasion points');
          break;
        case 'riskTaking':
          weaknesses.push('Overly predictable lines of defense that seasoned opponents can anticipate');
          break;
      }
    });

    // Derive actionable Recommendations for improvement
    bottomTraits.forEach((t, idx) => {
      const priority: 'High' | 'Medium' = idx === 0 ? 'High' : 'Medium';
      switch (t) {
        case 'evidence':
          recommendations.push({
            id: 'rec_ev',
            title: 'Empirical Pre-Loading Drill',
            description: 'Before round 1, outline at least two peer-reviewed studies or governmental datasets to anchor opening claims.',
            focusTrait: 'evidence',
            priority,
            exerciseName: 'Empirical Grounding Drill',
          });
          break;
        case 'emotionalAppeal':
          recommendations.push({
            id: 'rec_emo',
            title: 'Human Stake Framing Drill',
            description: 'Frame abstract economic or technical motions around their tangible impact on human livelihoods and future generations.',
            focusTrait: 'emotionalAppeal',
            priority,
            exerciseName: 'Pathos Calibration',
          });
          break;
        case 'rebuttal':
          recommendations.push({
            id: 'rec_reb',
            title: 'Premise-Targeting Refutation Drill',
            description: 'Refrain from arguing conclusions directly; attack the implicit premise or hidden assumption of the opponent.',
            focusTrait: 'rebuttal',
            priority,
            exerciseName: 'Sub-Premise Dismantling',
          });
          break;
        case 'aggressiveness':
          recommendations.push({
            id: 'rec_agg',
            title: 'Proactive Cross-Examination Drill',
            description: 'Open cross-examinations with closed binary questions that limit opponent deflection and establish conversational dominance.',
            focusTrait: 'aggressiveness',
            priority,
            exerciseName: 'Rapid Cross-Inquiry',
          });
          break;
        case 'consistency':
          recommendations.push({
            id: 'rec_con',
            title: 'Round Fatigue Mitigation',
            description: 'Reserve 25% of prep time specifically for formulating your round 3 whip speech to prevent scoring drop-offs.',
            focusTrait: 'consistency',
            priority,
            exerciseName: 'Whip Speech Synchronization',
          });
          break;
        case 'riskTaking':
          recommendations.push({
            id: 'rec_risk',
            title: 'Strategic Concession Gambit',
            description: 'Concede an opponent minor claim willingly to channel debate energy onto your strongest decisive battleground.',
            focusTrait: 'riskTaking',
            priority,
            exerciseName: 'Calculated Concession Drill',
          });
          break;
        case 'logic':
          recommendations.push({
            id: 'rec_log',
            title: 'Syllogism Rigor Audit',
            description: 'Formally write out Major Premise -> Minor Premise -> Conclusion before submitting your opening argument.',
            focusTrait: 'logic',
            priority,
            exerciseName: 'Syllogistic Audit',
          });
          break;
        case 'persuasiveness':
          recommendations.push({
            id: 'rec_per',
            title: 'Rhetorical Climax Structuring',
            description: 'Conclude each turn with a high-impact synthesis sentence that directly links your argument to the motion wording.',
            focusTrait: 'persuasiveness',
            priority,
            exerciseName: 'Peroration Crafting',
          });
          break;
      }
    });

    // Add a maintenance drill for their top trait
    const topTrait = topTraits[0];
    recommendations.push({
      id: 'rec_maint',
      title: `${topTrait.toUpperCase()} Mastery Maintenance`,
      description: `Continue refining your primary competitive strength (${topTrait}) to maintain your ${archetype.name} archetype edge.`,
      focusTrait: topTrait,
      priority: 'Maintenance',
      exerciseName: 'Signature Strength Sparring',
    });

    return {
      strengths: strengths.slice(0, 4),
      weaknesses: weaknesses.slice(0, 3),
      recommendations,
    };
  }
}
