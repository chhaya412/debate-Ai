import { ScoreModel, IScore, IFallacy } from '../models/Score';
import { isMongoConnected } from '../config/db';
import { AppError } from '../utils/appError';

export class ScoreService {
  static async recordScore(data: {
    debateId: string;
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
    aiFeedbackSummary?: string;
    aiCrossQuestion?: string;
  }) {
    if (isMongoConnected) {
      return await ScoreModel.create(data);
    }

    return {
      _id: `score_${Date.now()}`,
      ...data,
      createdAt: new Date(),
    };
  }

  static async getScoresByDebateId(debateId: string) {
    if (isMongoConnected) {
      return await ScoreModel.find({ debateId }).sort({ roundNumber: 1, createdAt: 1 });
    }

    return [];
  }
}
