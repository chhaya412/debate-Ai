import mongoose, { Schema, Document } from 'mongoose';
import { IFallacy } from './Score';

export interface IDebateTurnRecord {
  roundNumber: number;
  speakerId: string;
  speakerName: string;
  speakerAvatar: string;
  side: 'affirmative' | 'negative';
  argumentText: string;
  submittedAt: Date;
  scores?: {
    logic: number;
    relevance: number;
    evidence: number;
    rebuttal: number;
    persuasiveness: number;
    ruleAdherence: number;
    fallacyDeductions: number;
    total: number;
  };
  fallacies?: IFallacy[];
  aiFeedbackSummary?: string;
  aiCrossQuestion?: string;
}

export interface IDebate extends Document {
  topicId?: mongoose.Types.ObjectId;
  topicTitle: string;
  motion: string;
  category: string;
  difficulty: 'Novice' | 'Competitive' | 'Grandmaster';
  mode: '1v1 Human' | 'Human vs AI Master' | 'Speed Debate (Blitz)';
  totalRounds: number;
  currentRound: number;
  turnDuration: number;
  activeSpeakerSide: 'affirmative' | 'negative';
  status: 'waiting' | 'in_progress' | 'analyzing' | 'completed' | 'abandoned';
  participants: {
    affirmative: {
      userId: string;
      username: string;
      avatarUrl: string;
      eloBefore: number;
      eloAfter?: number;
      totalScore?: number;
    };
    negative: {
      userId: string;
      username: string;
      avatarUrl: string;
      eloBefore: number;
      eloAfter?: number;
      totalScore?: number;
    };
  };
  transcript: IDebateTurnRecord[];
  winnerId?: string | 'draw';
  verdictExplanation?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DebateSchema: Schema = new Schema(
  {
    topicId: { type: Schema.Types.ObjectId, ref: 'Topic' },
    topicTitle: { type: String, required: true },
    motion: { type: String, required: true },
    category: { type: String, default: 'General' },
    difficulty: {
      type: String,
      enum: ['Novice', 'Competitive', 'Grandmaster'],
      default: 'Competitive',
    },
    mode: {
      type: String,
      enum: ['1v1 Human', 'Human vs AI Master', 'Speed Debate (Blitz)'],
      default: 'Human vs AI Master',
    },
    totalRounds: { type: Number, default: 3 },
    currentRound: { type: Number, default: 1 },
    turnDuration: { type: Number, default: 120 },
    activeSpeakerSide: {
      type: String,
      enum: ['affirmative', 'negative'],
      default: 'affirmative',
    },
    status: {
      type: String,
      enum: ['waiting', 'in_progress', 'analyzing', 'completed', 'abandoned'],
      default: 'in_progress',
    },
    participants: {
      affirmative: {
        userId: { type: String, required: true },
        username: { type: String, required: true },
        avatarUrl: { type: String, default: '' },
        eloBefore: { type: Number, default: 1200 },
        eloAfter: { type: Number },
        totalScore: { type: Number, default: 0 },
      },
      negative: {
        userId: { type: String, required: true },
        username: { type: String, required: true },
        avatarUrl: { type: String, default: '' },
        eloBefore: { type: Number, default: 1200 },
        eloAfter: { type: Number },
        totalScore: { type: Number, default: 0 },
      },
    },
    transcript: [
      {
        roundNumber: Number,
        speakerId: String,
        speakerName: String,
        speakerAvatar: String,
        side: { type: String, enum: ['affirmative', 'negative'] },
        argumentText: String,
        submittedAt: { type: Date, default: Date.now },
        scores: {
          logic: Number,
          relevance: Number,
          evidence: Number,
          rebuttal: Number,
          persuasiveness: Number,
          ruleAdherence: Number,
          fallacyDeductions: Number,
          total: Number,
        },
        fallacies: Array,
        aiFeedbackSummary: String,
        aiCrossQuestion: String,
      },
    ],
    winnerId: { type: String },
    verdictExplanation: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// High-performance query indexes
DebateSchema.index({ status: 1, createdAt: -1 });
DebateSchema.index({ 'participants.affirmative.userId': 1, createdAt: -1 });
DebateSchema.index({ 'participants.negative.userId': 1, createdAt: -1 });
DebateSchema.index({ createdAt: -1 });

export const DebateModel: mongoose.Model<IDebate> = (mongoose.models.Debate as any) || mongoose.model<IDebate>('Debate', DebateSchema);
