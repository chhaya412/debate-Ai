import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  avatarUrl: string;
  title: string;
  elo: number;
  rankTier: 'Novice' | 'Advocate' | 'Contender' | 'Grandmaster' | 'Philosopher';
  streak: number;
  stats: {
    totalDebates: number;
    wins: number;
    losses: number;
    draws: number;
    winRate: number;
    avgScore: number;
    debateStyle: string;
    radarStats: {
      logic: number;
      rebuttal: number;
      relevance: number;
      evidence: number;
      persuasiveness: number;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    avatarUrl: {
      type: String,
      default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
    title: { type: String, default: 'Competitive Dialectician' },
    elo: { type: Number, default: 1200 },
    rankTier: {
      type: String,
      enum: ['Novice', 'Advocate', 'Contender', 'Grandmaster', 'Philosopher'],
      default: 'Advocate',
    },
    streak: { type: Number, default: 0 },
    stats: {
      totalDebates: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      draws: { type: Number, default: 0 },
      winRate: { type: Number, default: 0 },
      avgScore: { type: Number, default: 75 },
      debateStyle: { type: String, default: 'Aggressive Analytical' },
      radarStats: {
        logic: { type: Number, default: 80 },
        rebuttal: { type: Number, default: 75 },
        relevance: { type: Number, default: 85 },
        evidence: { type: Number, default: 70 },
        persuasiveness: { type: Number, default: 75 },
      },
    },
  },
  { timestamps: true }
);

// High-performance query indexes
UserSchema.index({ elo: -1 });
UserSchema.index({ 'stats.wins': -1 });
UserSchema.index({ 'stats.totalDebates': -1 });

export const UserModel: mongoose.Model<IUser> = (mongoose.models.User as any) || mongoose.model<IUser>('User', UserSchema);
