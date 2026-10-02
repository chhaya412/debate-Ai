import mongoose, { Schema, Document } from 'mongoose';

export interface IAchievement extends Document {
  id: string;
  title: string;
  description: string;
  category: 'dialectics' | 'scoring' | 'mastery' | 'voice' | 'streak';
  icon: string;
  xpReward: number;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

export interface IUserAchievementRecord extends Document {
  userId: string;
  achievementId: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
}

const UserAchievementSchema: Schema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    achievementId: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, default: 'dialectics' },
    icon: { type: String, default: 'Award' },
    unlocked: { type: Boolean, default: false },
    unlockedAt: { type: Date },
    progress: { type: Number, default: 0 },
    maxProgress: { type: Number, default: 1 },
  },
  { timestamps: true }
);

UserAchievementSchema.index({ userId: 1, achievementId: 1 }, { unique: true });
UserAchievementSchema.index({ userId: 1, unlocked: 1 });

export const UserAchievementModel: mongoose.Model<IUserAchievementRecord> =
  (mongoose.models.UserAchievement as any) ||
  mongoose.model<IUserAchievementRecord>('UserAchievement', UserAchievementSchema);
