import { Request, Response, NextFunction } from 'express';
import { LeaderboardService } from '../services/leaderboardService';

export class LeaderboardController {
  static async getLeaderboard(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tier, limit } = req.query;
      const rankings = await LeaderboardService.getLeaderboard({
        tier: tier as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
      });

      res.status(200).json({
        success: true,
        count: rankings.length,
        data: rankings,
      });
    } catch (error) {
      next(error);
    }
  }
}
