import { SpeechMetrics } from './voice';

export type DebateSide = 'affirmative' | 'negative';
export type DebateDifficulty = 'Novice' | 'Competitive' | 'Grandmaster';
export type DebateMode = '1v1 Human' | 'Human vs AI Master' | 'Speed Debate (Blitz)';
export type DebateStatus = 'waiting' | 'in_progress' | 'analyzing' | 'completed';

export interface LogicalFallacy {
  id: string;
  name: string;
  quote: string;
  explanation: string;
  severity: 'minor' | 'moderate' | 'critical';
  deduction: number;
}

export interface RoundScoreBreakdown {
  logic: number; // Max 20
  relevance: number; // Max 15
  evidence: number; // Max 15
  rebuttal: number; // Max 20
  persuasiveness: number; // Max 15
  ruleAdherence: number; // Max 15
  fallacyDeductions: number; // 0 to -20
  total: number; // Scaled 0 - 100
}

export interface DebateTurn {
  roundNumber: number;
  speakerId: string;
  speakerName: string;
  speakerAvatar: string;
  side: DebateSide;
  argumentText: string;
  submittedAt: string;
  scores?: RoundScoreBreakdown;
  fallacies?: LogicalFallacy[];
  rebuttalTarget?: string;
  aiCrossQuestion?: string;
  aiFeedbackSummary?: string;
  speechMetrics?: SpeechMetrics;
  inputMode?: 'voice' | 'text';
}

export interface DebaterProfile {
  id: string;
  name: string;
  title: string;
  avatar: string;
  elo: number;
  rankTier: 'Novice' | 'Advocate' | 'Contender' | 'Grandmaster' | 'Philosopher';
  winRate: number; // Percentage
  totalDebates: number;
  wins: number;
  losses: number;
  draws: number;
  avgScore: number;
  streak: number;
  debateStyle: 'Aggressive Analytical' | 'Socratic Inquisitor' | 'Empirical Evidence-Driven' | 'Rhetorical Stylist';
  radarStats: {
    logic: number;
    rebuttal: number;
    relevance: number;
    evidence: number;
    persuasiveness: number;
  };
}

export interface DebateTopic {
  id: string;
  title: string;
  category: 'Artificial Intelligence' | 'Global Ethics' | 'Economy' | 'Space Exploration' | 'Bioethics';
  description: string;
  motion: string;
  difficulty: DebateDifficulty;
  recommendedRounds: number;
  backgroundContext: string;
}

export interface CrossQuestionData {
  question: string;
  targetPlayer: 'A' | 'B';
  reason: string;
  difficulty: 'easy' | 'moderate' | 'medium' | 'hard' | 'extreme';
  vulnerabilityType?: string;
  round?: number;
}

export interface CrossAnswerEvaluation {
  score: number;
  grade: string;
  passed: boolean;
  breakdown: {
    directness: number;
    counterEvidence: number;
    logicalConsistency: number;
    rebuttalClarity: number;
    defenseDepth: number;
  };
  vulnerabilityAddressed: boolean;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  targetPlayer?: 'A' | 'B';
  round?: number;
}

export interface ActiveDebateState {
  id: string;
  topic: DebateTopic;
  mode: DebateMode;
  difficulty: DebateDifficulty;
  totalRounds: number;
  currentRound: number;
  activeSpeakerSide: DebateSide;
  secondsRemaining: number;
  turnDuration: number;
  status: DebateStatus;
  playerA: DebaterProfile;
  playerB: DebaterProfile;
  transcript: DebateTurn[];
  isAiAnalyzing: boolean;
  aiStatusMessage?: string;
  liveCrossQuestion?: CrossQuestionData;
  activeCrossExam?: {
    questionData: CrossQuestionData;
    status: 'pending' | 'answering' | 'evaluating' | 'evaluated';
    userAnswer?: string;
    evaluation?: CrossAnswerEvaluation;
  };
}

export interface MatchResult {
  debateId: string;
  topic: DebateTopic;
  completedAt: string;
  winnerId: string | 'draw';
  winnerName: string;
  scoreA: number;
  scoreB: number;
  categoryScoresA: RoundScoreBreakdown;
  categoryScoresB: RoundScoreBreakdown;
  playerA: DebaterProfile;
  playerB: DebaterProfile;
  verdictExplanation: string;
  strengthsA: string[];
  weaknessesA: string[];
  strengthsB: string[];
  weaknessesB: string[];
  allFallaciesA: LogicalFallacy[];
  allFallaciesB: LogicalFallacy[];
  eloChangeA: number;
  eloChangeB: number;
}

export interface LeaderboardEntry {
  rank: number;
  user: DebaterProfile;
  change: 'up' | 'down' | 'same';
  badges: string[];
}
