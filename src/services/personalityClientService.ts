import { DebatePersonalityProfile, ArchetypeDefinition } from '../types/personality';
import { CURRENT_USER } from '../data/mockData';

const DEFAULT_PROFILE: DebatePersonalityProfile = {
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
    'Watertight syllogistic framing that minimizes cognitive fallacies',
  ],
  weaknesses: [
    'Emotional appeal (Pathos) is under-utilized, occasionally appearing clinical on humanitarian motions',
    'Evidence citation density dips slightly in rapid-fire round 3 closing statements',
    'Overly reliant on opponent mistakes rather than establishing an unshakeable affirmative paradigm',
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
      title: 'Empirical Pre-Loading Drill',
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
      completedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
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
      completedAt: new Date(Date.now() - 86400000).toISOString(),
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
      completedAt: new Date().toISOString(),
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
  updatedAt: new Date().toISOString(),
};

export class PersonalityClientService {
  /**
   * Fetch current user's personality profile
   */
  static async getPersonality(userId: string = CURRENT_USER.id): Promise<DebatePersonalityProfile> {
    try {
      const res = await fetch(`/api/personality/${userId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    } catch (err) {
      console.warn('[PersonalityClientService] Fetch failed, returning local default:', err);
    }
    return DEFAULT_PROFILE;
  }

  /**
   * Trigger recalculation of personality from historical debates
   */
  static async recalculate(userId: string = CURRENT_USER.id): Promise<DebatePersonalityProfile> {
    try {
      const res = await fetch(`/api/personality/calculate/${userId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    } catch (err) {
      console.warn('[PersonalityClientService] Recalculate failed, updating local state:', err);
    }

    // Local simulation update
    const updated = {
      ...DEFAULT_PROFILE,
      traits: {
        ...DEFAULT_PROFILE.traits,
        rebuttal: Math.min(99, DEFAULT_PROFILE.traits.rebuttal + 1),
        logic: Math.min(99, DEFAULT_PROFILE.traits.logic + 1),
      },
      debatesAnalyzed: DEFAULT_PROFILE.debatesAnalyzed + 1,
      updatedAt: new Date().toISOString(),
    };
    return updated;
  }

  /**
   * Fetch all 6 archetype encyclopedic definitions
   */
  static async getArchetypes(): Promise<ArchetypeDefinition[]> {
    try {
      const res = await fetch('/api/personality/archetypes/all');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success && json.data) {
        return json.data;
      }
    } catch (err) {
      console.warn('[PersonalityClientService] Archetypes fetch failed:', err);
    }

    return [
      {
        name: 'The Strategist',
        tagline: 'Calculates the debate endgame three rounds in advance.',
        description: 'Constructs structurally unassailable frameworks. Relies on systemic coherence and foresight.',
        icon: 'Compass',
        weights: { logic: 90, rebuttal: 75, evidence: 70, persuasiveness: 80, aggressiveness: 50, consistency: 95, emotionalAppeal: 45, riskTaking: 70 },
        strengthsPool: ['Exceptional framing', 'High structural consistency'],
        weaknessesPool: ['Can appear overly cerebral', 'Under-attacks chaotic opponents'],
      },
      {
        name: 'The Counter-Attacker',
        tagline: "Turns the opponent's strongest argument into their greatest liability.",
        description: 'Exposes logical inconsistencies and delivers devastating counter-punches during rebuttal turns.',
        icon: 'ShieldAlert',
        weights: { logic: 80, rebuttal: 95, evidence: 65, persuasiveness: 75, aggressiveness: 85, consistency: 70, emotionalAppeal: 50, riskTaking: 75 },
        strengthsPool: ['Rapid premise dismantling', 'High refutation velocity'],
        weaknessesPool: ['Relies heavily on opponent mistakes', 'Adversarial tone risk'],
      },
      {
        name: 'The Evidence Hunter',
        tagline: 'Submerges every dispute in unimpeachable empirical reality.',
        description: 'Armed with statistical density, scientific studies, and forensic citations.',
        icon: 'FileSearch',
        weights: { logic: 85, rebuttal: 70, evidence: 95, persuasiveness: 75, aggressiveness: 55, consistency: 85, emotionalAppeal: 35, riskTaking: 50 },
        strengthsPool: ['Forensic citation density', 'Immune to factual refutations'],
        weaknessesPool: ['Data-dumping risks', 'Struggles with abstract values'],
      },
      {
        name: 'The Persuader',
        tagline: 'Masters the room through compelling narrative and moral resonance.',
        description: 'Connects arguments to human stakes, ethical duty, and vivid narrative resonance.',
        icon: 'Flame',
        weights: { logic: 70, rebuttal: 70, evidence: 60, persuasiveness: 95, aggressiveness: 60, consistency: 75, emotionalAppeal: 90, riskTaking: 70 },
        strengthsPool: ['Magnetic rhetorical pacing', 'Evocative moral appeals'],
        weaknessesPool: ['Vulnerable if evidence is thin', 'Syllogistic traps'],
      },
      {
        name: 'The Logical Machine',
        tagline: 'Dismantles fallacies with ruthless syllogistic precision.',
        description: 'Treats debate as formal analytical proof, eliminating subjectivity premise by premise.',
        icon: 'Cpu',
        weights: { logic: 98, rebuttal: 85, evidence: 80, persuasiveness: 70, aggressiveness: 60, consistency: 95, emotionalAppeal: 20, riskTaking: 55 },
        strengthsPool: ['Pristine syllogisms', 'Near-zero fallacy deductions'],
        weaknessesPool: ['Can sound robotic', 'Neglects emotional empathy'],
      },
      {
        name: 'The Aggressive Challenger',
        tagline: 'Dictates the battleground through unrelenting rhetorical offense.',
        description: 'Commands the room with high-tempo pressure, audacious counter-theses, and fearless clash.',
        icon: 'Swords',
        weights: { logic: 75, rebuttal: 85, evidence: 65, persuasiveness: 80, aggressiveness: 98, consistency: 65, emotionalAppeal: 65, riskTaking: 90 },
        strengthsPool: ['Dominates tempo', 'Audacious tactical gambits'],
        weaknessesPool: ['High scoring variance', 'Prone to refutation penalties'],
      },
    ];
  }
}
