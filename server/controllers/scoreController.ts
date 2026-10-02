import { Request, Response, NextFunction } from 'express';
import { ScoreService } from '../services/scoreService';

export class ScoreController {
  static async getScoresByDebateId(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const scores = await ScoreService.getScoresByDebateId(req.params.debateId);
      res.status(200).json({
        success: true,
        count: scores.length,
        data: scores,
      });
    } catch (error) {
      next(error);
    }
  }
}
