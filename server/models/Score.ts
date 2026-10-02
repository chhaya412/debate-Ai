import mongoose, { Schema, Document } from 'mongoose';

export interface IFallacy {
  id: string;
  name: string;
  quote: string;
  explanation: string;
  severity: 'minor' | 'moderate' | 'critical';
  deduction: number;
}

export interface IScore extends Document {
  debateId: mongoose.Types.ObjectId;
  roundNumber: number;
  speakerId: string;
  side: 'affirmative' | 'negative';
  logic: number;
  relevance: number;
  evidence: number;
  rebuttal: number;
  persuasiveness: number;
  ruleAdherence: number;
  fallacyDeductions: number;
  total: number;
  fallacies: IFallacy[];
  aiFeedbackSummary: string;
  aiCrossQuestion?: string;
  createdAt: Date;
}

const ScoreSchema: Schema = new Schema(
  {
    debateId: { type: Schema.Types.ObjectId, ref: 'Debate', required: true, index: true },
    roundNumber: { type: Number, required: true },
    speakerId: { type: String, required: true },
    side: { type: String, enum: ['affirmative', 'negative'], required: true },
    logic: { type: Number, required: true, min: 0, max: 20 },
    relevance: { type: Number, required: true, min: 0, max: 15 },
    evidence: { type: Number, required: true, min: 0, max: 15 },
    rebuttal: { type: Number, required: true, min: 0, max: 20 },
    persuasiveness: { type: Number, required: true, min: 0, max: 15 },
    ruleAdherence: { type: Number, required: true, min: 0, max: 15 },
    fallacyDeductions: { type: Number, default: 0 },
    total: { type: Number, required: true, min: 0, max: 100 },
    fallacies: [
      {
        id: String,
        name: String,
        quote: String,
        explanation: String,
        severity: { type: String, enum: ['minor', 'moderate', 'critical'] },
        deduction: Number,
      },
    ],
    aiFeedbackSummary: { type: String, default: '' },
    aiCrossQuestion: { type: String, default: '' },
  },
  { timestamps: true }
);

export const ScoreModel: mongoose.Model<IScore> = (mongoose.models.Score as any) || mongoose.model<IScore>('Score', ScoreSchema);
