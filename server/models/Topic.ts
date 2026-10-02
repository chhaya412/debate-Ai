import mongoose, { Schema, Document } from 'mongoose';

export interface ITopic extends Document {
  title: string;
  motion: string;
  category: 'Artificial Intelligence' | 'Global Ethics' | 'Economy' | 'Space Exploration' | 'Bioethics' | 'General';
  description: string;
  difficulty: 'Novice' | 'Competitive' | 'Grandmaster';
  recommendedRounds: number;
  status: 'active' | 'archived' | 'draft';
  timesUsed: number;
  createdBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TopicSchema: Schema = new Schema(
  {
    title: { type: String, required: true, trim: true },
    motion: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ['Artificial Intelligence', 'Global Ethics', 'Economy', 'Space Exploration', 'Bioethics', 'General'],
      default: 'General',
    },
    description: { type: String, default: '' },
    difficulty: {
      type: String,
      enum: ['Novice', 'Competitive', 'Grandmaster'],
      default: 'Competitive',
    },
    recommendedRounds: { type: Number, default: 3 },
    status: {
      type: String,
      enum: ['active', 'archived', 'draft'],
      default: 'active',
    },
    timesUsed: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const TopicModel: mongoose.Model<ITopic> = (mongoose.models.Topic as any) || mongoose.model<ITopic>('Topic', TopicSchema);
