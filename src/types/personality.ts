export interface PersonalityTraits {
  logic: number; // 0-100: Syllogistic validity, deductive rigor, fallacy minimization
  rebuttal: number; // 0-100: Counter-argument directness, refutation speed, premise targeting
  evidence: number; // 0-100: Empirical citation density, data/study mentions, dataset grounding
  persuasiveness: number; // 0-100: Rhetorical resonance, framing clarity, audience impact
  aggressiveness: number; // 0-100: Tempo dominance, active challenge frequency, cross-exam pressure
  consistency: number; // 0-100: Low variance across rounds, point preservation
  emotionalAppeal: number; // 0-100: Pathos, human-stake framing, moral urgency
  riskTaking: number; // 0-100: Bold counter-theses, strategic concessions, high-difficulty clash
}

export type PersonalityArchetypeName =
  | 'The Strategist'
  | 'The Counter-Attacker'
  | 'The Evidence Hunter'
  | 'The Persuader'
  | 'The Logical Machine'
  | 'The Aggressive Challenger';

export interface PersonalityRecommendation {
  id: string;
  title: string;
  description: string;
  focusTrait: keyof PersonalityTraits;
  priority: 'High' | 'Medium' | 'Maintenance';
  exerciseName: string;
}

export interface PersonalityHistoryItem {
  debateId: string;
  completedAt: string | Date;
  archetype: string;
  traits: PersonalityTraits;
  deltaScore?: number;
  note?: string;
}

export interface DebatePersonalityProfile {
  userId: string;
  username: string;
  archetype: PersonalityArchetypeName | string;
  secondaryArchetype?: string;
  archetypeTagline: string;
  archetypeDescription: string;
  archetypeIcon: string;
  traits: PersonalityTraits;
  strengths: string[];
  weaknesses: string[];
  recommendations: PersonalityRecommendation[];
  debatesAnalyzed: number;
  history: PersonalityHistoryItem[];
  disclaimer: string;
  updatedAt: string | Date;
}

export interface ArchetypeDefinition {
  name: string;
  tagline: string;
  description: string;
  icon: string;
  weights: PersonalityTraits;
  strengthsPool: string[];
  weaknessesPool: string[];
}
