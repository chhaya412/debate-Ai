import mongoose, { Schema, Document } from 'mongoose';

export interface ITraitBreakdown {
  score: number;
  grade: string;
  description: string;
  contributingFactors: string[];
}

export interface IPersonalityRecommendation {
  id: string;
  title: string;
  description: string;
  focusTrait: 'logic' | 'rebuttal' | 'evidence' | 'persuasiveness' | 'aggressiveness' | 'consistency' | 'emotionalAppeal' | 'riskTaking';
  priority: 'High' | 'Medium' | 'Maintenance';
  exerciseName: string;
}

export interface IPersonalityHistoryPoint {
  debateId: string;
  completedAt: Date;
  archetype: string;
  traits: {
    logic: number;
    rebuttal: number;
    evidence: number;
    persuasiveness: number;
    aggressiveness: number;
    consistency: number;
    emotionalAppeal: number;
    riskTaking: number;
  };
  deltaScore?: number;
  note?: string;
}

export interface IDebatePersonality extends Document {
  userId: string;
  username: string;
  archetype: string;
  secondaryArchetype?: string;
  archetypeTagline: string;
  archetypeDescription: string;
  archetypeIcon: string;
  traits: {
    logic: number;
    rebuttal: number;
    evidence: number;
    persuasiveness: number;
    aggressiveness: number;
    consistency: number;
    emotionalAppeal: number;
    riskTaking: number;
  };
  traitBreakdowns?: {
    logic?: ITraitBreakdown;
    rebuttal?: ITraitBreakdown;
    evidence?: ITraitBreakdown;
    persuasiveness?: ITraitBreakdown;
    aggressiveness?: ITraitBreakdown;
    consistency?: ITraitBreakdown;
    emotionalAppeal?: ITraitBreakdown;
    riskTaking?: ITraitBreakdown;
  };
  strengths: string[];
  weaknesses: string[];
  recommendations: IPersonalityRecommendation[];
  debatesAnalyzed: number;
  history: IPersonalityHistoryPoint[];
  disclaimer: string;
  lastDebateId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PersonalityRecommendationSchema = new Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    focusTrait: {
      type: String,
      enum: ['logic', 'rebuttal', 'evidence', 'persuasiveness', 'aggressiveness', 'consistency', 'emotionalAppeal', 'riskTaking'],
      required: true,
    },
    priority: { type: String, enum: ['High', 'Medium', 'Maintenance'], default: 'Medium' },
    exerciseName: { type: String, default: 'Strategic Drill' },
  },
  { _id: false }
);

const PersonalityHistoryPointSchema = new Schema(
  {
    debateId: { type: String, required: true },
    completedAt: { type: Date, default: Date.now },
    archetype: { type: String, required: true },
    traits: {
      logic: { type: Number, required: true },
      rebuttal: { type: Number, required: true },
      evidence: { type: Number, required: true },
      persuasiveness: { type: Number, required: true },
      aggressiveness: { type: Number, required: true },
      consistency: { type: Number, required: true },
      emotionalAppeal: { type: Number, required: true },
      riskTaking: { type: Number, required: true },
    },
    deltaScore: { type: Number, default: 0 },
    note: { type: String },
  },
  { _id: false }
);

const DebatePersonalitySchema = new Schema(
  {
    userId: { type: String, required: true, unique: true, index: true },
    username: { type: String, required: true },
    archetype: {
      type: String,
      required: true,
      default: 'The Strategist',
    },
    secondaryArchetype: { type: String, default: 'The Counter-Attacker' },
    archetypeTagline: {
      type: String,
      default: 'Calculates the debate endgame three rounds in advance.',
    },
    archetypeDescription: {
      type: String,
      default: 'Approaches every clash with architectural foresight, structuring arguments to control the frame.',
    },
    archetypeIcon: { type: String, default: 'Compass' },
    traits: {
      logic: { type: Number, default: 82, min: 0, max: 100 },
      rebuttal: { type: Number, default: 80, min: 0, max: 100 },
      evidence: { type: Number, default: 75, min: 0, max: 100 },
      persuasiveness: { type: Number, default: 84, min: 0, max: 100 },
      aggressiveness: { type: Number, default: 72, min: 0, max: 100 },
      consistency: { type: Number, default: 86, min: 0, max: 100 },
      emotionalAppeal: { type: Number, default: 68, min: 0, max: 100 },
      riskTaking: { type: Number, default: 70, min: 0, max: 100 },
    },
    traitBreakdowns: { type: Schema.Types.Mixed, default: {} },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    recommendations: { type: [PersonalityRecommendationSchema], default: [] },
    debatesAnalyzed: { type: Number, default: 0 },
    history: { type: [PersonalityHistoryPointSchema], default: [] },
    disclaimer: {
      type: String,
      default:
        'Debate Personality profiles and trait scores are algorithmic performance heuristics designed for competitive debate practice and strategic analysis. They are NOT scientifically or psychologically validated personality metrics.',
    },
    lastDebateId: { type: String },
  },
  {
    timestamps: true,
  }
);

export const DebatePersonalityModel = mongoose.model<IDebatePersonality>(
  'DebatePersonality',
  DebatePersonalitySchema
);
