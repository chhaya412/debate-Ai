import { UserModel } from '../models/User';
import { isMongoConnected } from '../config/db';
import { MOCK_LEADERBOARD } from '../../src/data/mockData';

export class LeaderboardService {
  static async getLeaderboard(filter?: { tier?: string; limit?: number }) {
    if (isMongoConnected) {
      const query: any = {};
      if (filter?.tier && filter.tier !== 'All') {
        query.rankTier = filter.tier;
      }

      const users = await UserModel.find(query)
        .sort({ elo: -1, 'stats.wins': -1 })
        .limit(filter?.limit || 50)
        .select('-passwordHash');

      return users.map((user, idx) => ({
        rank: idx + 1,
        user: {
          id: user._id.toString(),
          name: user.username,
          title: user.title,
          avatar: user.avatarUrl,
          rankTier: user.rankTier,
          elo: user.elo,
          winRate: user.stats.winRate,
          streak: user.streak,
          avgScore: user.stats.avgScore,
          totalDebates: user.stats.totalDebates,
          wins: user.stats.wins,
        },
        badges: user.rankTier === 'Philosopher' ? ['Apex Mind', 'Undefeated Streak'] : ['Contender'],
      }));
    }

    // Memory fallback from MOCK_LEADERBOARD
    let list = MOCK_LEADERBOARD;
    if (filter?.tier && filter.tier !== 'All') {
      list = list.filter(item => item.user.rankTier === filter.tier);
    }
    return list.slice(0, filter?.limit || 50);
  }
}
