import { UserModel } from '../models/User';
import { DebateModel } from '../models/Debate';
import { AppError } from '../utils/appError';
import { isMongoConnected } from '../config/db';
import { CURRENT_USER } from '../../src/data/mockData';

export class UserService {
  static async getUserProfile(userId: string) {
    if (isMongoConnected) {
      const user = await UserModel.findById(userId).select('-passwordHash');
      if (!user) throw new AppError('User profile not found.', 404);
      return user;
    }

    // Resilient fallback profile
    return {
      id: userId,
      _id: userId,
      username: CURRENT_USER.name,
      avatarUrl: CURRENT_USER.avatar,
      title: CURRENT_USER.title,
      elo: CURRENT_USER.elo,
      rankTier: CURRENT_USER.rankTier,
      streak: CURRENT_USER.streak,
      stats: {
        totalDebates: CURRENT_USER.totalDebates,
        wins: CURRENT_USER.wins,
        losses: CURRENT_USER.losses,
        draws: CURRENT_USER.draws,
        winRate: CURRENT_USER.winRate,
        avgScore: CURRENT_USER.avgScore,
        debateStyle: CURRENT_USER.debateStyle,
        radarStats: CURRENT_USER.radarStats,
      },
    };
  }

  static async getUserStats(userId: string) {
    const profile: any = await this.getUserProfile(userId);
    return {
      elo: profile.elo,
      rankTier: profile.rankTier,
      streak: profile.streak,
      stats: profile.stats,
    };
  }

  static async getUserDebateHistory(userId: string) {
    if (isMongoConnected) {
      return await DebateModel.find({
        $or: [
          { 'participants.affirmative.userId': userId },
          { 'participants.negative.userId': userId },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(20);
    }

    return [];
  }

  static async updateStatsAfterDebate(
    userId: string,
    isWinner: boolean,
    isDraw: boolean,
    roundScore: number,
    eloDelta: number
  ) {
    if (!isMongoConnected) return;

    const user = await UserModel.findById(userId);
    if (!user) return;

    user.elo = Math.max(100, user.elo + eloDelta);
    user.streak = isWinner ? user.streak + 1 : 0;

    // Update rank tier
    if (user.elo >= 2000) user.rankTier = 'Philosopher';
    else if (user.elo >= 1800) user.rankTier = 'Grandmaster';
    else if (user.elo >= 1500) user.rankTier = 'Contender';
    else if (user.elo >= 1200) user.rankTier = 'Advocate';
    else user.rankTier = 'Novice';

    const currentTotal = user.stats.totalDebates;
    const newTotal = currentTotal + 1;
    const newWins = isWinner ? user.stats.wins + 1 : user.stats.wins;
    const newLosses = !isWinner && !isDraw ? user.stats.losses + 1 : user.stats.losses;
    const newDraws = isDraw ? user.stats.draws + 1 : user.stats.draws;

    user.stats.totalDebates = newTotal;
    user.stats.wins = newWins;
    user.stats.losses = newLosses;
    user.stats.draws = newDraws;
    user.stats.winRate = Number(((newWins / newTotal) * 100).toFixed(1));
    user.stats.avgScore = Number(
      ((user.stats.avgScore * currentTotal + roundScore) / newTotal).toFixed(1)
    );

    await user.save();
  }
}
