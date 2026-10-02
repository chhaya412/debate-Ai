import { Request, Response, NextFunction } from 'express';
import { UserAchievementModel } from '../models/Achievement';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export const DEFAULT_ACHIEVEMENTS = [
  {
    achievementId: 'ach_first_clash',
    title: 'First Dialectical Clash',
    description: 'Complete your initial competitive debate round in the AI Arena.',
    category: 'dialectics',
    icon: 'Swords',
    maxProgress: 1,
  },
  {
    achievementId: 'ach_logic_sovereign',
    title: 'Logic Sovereign',
    description: 'Earn an 18/20 or higher in Aristotelian Syllogistic Logic scoring.',
    category: 'scoring',
    icon: 'Brain',
    maxProgress: 1,
  },
  {
    achievementId: 'ach_rebuttal_maestro',
    title: 'Rebuttal Maestro',
    description: 'Score 18/20 in counter-rebuttal and refutation accuracy.',
    category: 'scoring',
    icon: 'Shield',
    maxProgress: 1,
  },
  {
    achievementId: 'ach_evidence_scholar',
    title: 'Empirical Scholar',
    description: 'Support a thesis with verifiable empirical evidence and data warrants.',
    category: 'scoring',
    icon: 'BookOpen',
    maxProgress: 1,
  },
  {
    achievementId: 'ach_cross_exam_survivor',
    title: 'Socratic Defender',
    description: 'Successfully defend your premises during AI Cross-Examination with Grade A or higher.',
    category: 'mastery',
    icon: 'Sparkles',
    maxProgress: 1,
  },
  {
    achievementId: 'ach_voice_orator',
    title: 'Voice Orator',
    description: 'Deliver a spoken argument using real-time speech recognition.',
    category: 'voice',
    icon: 'Mic',
    maxProgress: 1,
  },
  {
    achievementId: 'ach_grandmaster',
    title: 'Grandmaster Ascendant',
    description: 'Surpass 1,400 ELO in parliamentary competitive ranking.',
    category: 'mastery',
    icon: 'Crown',
    maxProgress: 1400,
  },
  {
    achievementId: 'ach_unbroken_streak',
    title: 'Unbroken Momentum',
    description: 'Achieve a consecutive 3-match win streak.',
    category: 'streak',
    icon: 'Flame',
    maxProgress: 3,
  },
];

export class AchievementController {
  /**
   * GET /api/achievements/:userId
   * Retrieves all achievements for a given user with unlock states
   */
  static async getUserAchievements(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId || 'usr_human_1';

      // Find existing user records
      let records: any[] = [];
      try {
        records = await UserAchievementModel.find({ userId });
      } catch {
        records = [];
      }

      const recordsMap = new Map(records.map(r => [r.achievementId, r]));

      // Merge defaults with user progress
      const result = DEFAULT_ACHIEVEMENTS.map(def => {
        const userRec = recordsMap.get(def.achievementId);
        return {
          id: def.achievementId,
          title: def.title,
          description: def.description,
          category: def.category,
          icon: def.icon,
          unlocked: userRec ? userRec.unlocked : false,
          unlockedAt: userRec?.unlockedAt || null,
          progress: userRec ? userRec.progress : 0,
          maxProgress: def.maxProgress,
        };
      });

      const unlockedCount = result.filter(a => a.unlocked).length;

      res.status(200).json({
        success: true,
        data: {
          totalAchievements: result.length,
          unlockedCount,
          completionPercentage: Math.round((unlockedCount / result.length) * 100),
          achievements: result,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/achievements/unlock
   * Internal/Service endpoint to grant an achievement
   */
  static async unlockAchievement(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { achievementId, progress } = req.body;
      const userId = req.user?.id || req.body.userId || 'usr_human_1';

      const def = DEFAULT_ACHIEVEMENTS.find(a => a.achievementId === achievementId);
      if (!def) {
        res.status(404).json({ success: false, error: 'Achievement not found.' });
        return;
      }

      const isComplete = (progress || 1) >= def.maxProgress;

      try {
        await UserAchievementModel.findOneAndUpdate(
          { userId, achievementId },
          {
            userId,
            achievementId,
            title: def.title,
            description: def.description,
            category: def.category,
            icon: def.icon,
            unlocked: isComplete,
            unlockedAt: isComplete ? new Date() : undefined,
            progress: progress || 1,
            maxProgress: def.maxProgress,
          },
          { upsert: true, new: true }
        );
      } catch {
        // graceful fallback if db offline
      }

      res.status(200).json({
        success: true,
        message: isComplete ? `Achievement unlocked: ${def.title}!` : 'Progress updated.',
        unlocked: isComplete,
      });
    } catch (error) {
      next(error);
    }
  }
}
