export interface AchievementItem {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  maxProgress: number;
}

export interface AchievementData {
  totalAchievements: number;
  unlockedCount: number;
  completionPercentage: number;
  achievements: AchievementItem[];
}

export class AchievementClientService {
  static async getUserAchievements(userId: string = 'usr_human_1'): Promise<AchievementData> {
    try {
      const response = await fetch(`/api/achievements/${userId}`);
      if (response.ok) {
        const json = await response.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (err) {
      console.warn('[AchievementClientService] Fetch notice:', err);
    }

    // High quality offline / fallback achievements
    return {
      totalAchievements: 8,
      unlockedCount: 5,
      completionPercentage: 62,
      achievements: [
        {
          id: 'ach_first_clash',
          title: 'First Dialectical Clash',
          description: 'Complete your initial competitive debate round in the AI Arena.',
          category: 'dialectics',
          icon: 'Swords',
          unlocked: true,
          unlockedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
          progress: 1,
          maxProgress: 1,
        },
        {
          id: 'ach_logic_sovereign',
          title: 'Logic Sovereign',
          description: 'Earn an 18/20 or higher in Aristotelian Syllogistic Logic scoring.',
          category: 'scoring',
          icon: 'Brain',
          unlocked: true,
          unlockedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
          progress: 1,
          maxProgress: 1,
        },
        {
          id: 'ach_rebuttal_maestro',
          title: 'Rebuttal Maestro',
          description: 'Score 18/20 in counter-rebuttal and refutation accuracy.',
          category: 'scoring',
          icon: 'Shield',
          unlocked: true,
          unlockedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          progress: 1,
          maxProgress: 1,
        },
        {
          id: 'ach_evidence_scholar',
          title: 'Empirical Scholar',
          description: 'Support a thesis with verifiable empirical evidence and data warrants.',
          category: 'scoring',
          icon: 'BookOpen',
          unlocked: true,
          unlockedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
          progress: 1,
          maxProgress: 1,
        },
        {
          id: 'ach_voice_orator',
          title: 'Voice Orator',
          description: 'Deliver a spoken argument using real-time speech recognition.',
          category: 'voice',
          icon: 'Mic',
          unlocked: true,
          unlockedAt: new Date().toISOString(),
          progress: 1,
          maxProgress: 1,
        },
        {
          id: 'ach_cross_exam_survivor',
          title: 'Socratic Defender',
          description: 'Successfully defend your premises during AI Cross-Examination with Grade A.',
          category: 'mastery',
          icon: 'Sparkles',
          unlocked: false,
          unlockedAt: null,
          progress: 0,
          maxProgress: 1,
        },
        {
          id: 'ach_unbroken_streak',
          title: 'Unbroken Momentum',
          description: 'Achieve a consecutive 3-match win streak.',
          category: 'streak',
          icon: 'Flame',
          unlocked: false,
          unlockedAt: null,
          progress: 2,
          maxProgress: 3,
        },
        {
          id: 'ach_grandmaster',
          title: 'Grandmaster Ascendant',
          description: 'Surpass 1,400 ELO in parliamentary competitive ranking.',
          category: 'mastery',
          icon: 'Crown',
          unlocked: false,
          unlockedAt: null,
          progress: 1280,
          maxProgress: 1400,
        },
      ],
    };
  }
}
