import { Request, Response, NextFunction } from 'express';
import { DebateService } from '../services/debateService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class DebateController {
  static async createDebate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const creatorUser = {
        id: req.user?.id || 'usr_human_1',
        username: req.user?.username || 'HumanDebater',
      };

      const debate = await DebateService.createDebate({
        ...req.body,
        creatorUser,
      });

      res.status(201).json({
        success: true,
        message: 'Debate arena initialized.',
        data: debate,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getDebate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const debate = await DebateService.getDebateById(req.params.id);
      res.status(200).json({
        success: true,
        data: debate,
      });
    } catch (error) {
      next(error);
    }
  }

  static async submitArgument(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { side, argumentText, speakerName, speakerAvatar } = req.body;
      const speakerId = req.user?.id || 'usr_affirmative';

      const result = await DebateService.submitArgument(
        req.params.id,
        speakerId,
        speakerName || req.user?.username || 'Debater',
        speakerAvatar || '',
        side,
        argumentText
      );

      res.status(200).json({
        success: true,
        message: 'Argument evaluated and scored.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  static async endDebate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const debate = await DebateService.getDebateById(req.params.id);
      const result = await DebateService.concludeDebate(debate);
      res.status(200).json({
        success: true,
        message: 'Debate concluded and verdict rendered.',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
