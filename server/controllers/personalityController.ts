import { Request, Response, NextFunction } from 'express';
import { PersonalityService, ARCHETYPES } from '../services/personalityService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class PersonalityController {
  /**
   * GET /api/personality/:userId
   * Retrieve debate personality profile, traits, strengths, weaknesses, and recommendations
   */
  static async getPersonality(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId || 'usr_player_1';
      const personality = await PersonalityService.getPersonalityByUserId(userId);

      res.status(200).json({
        success: true,
        data: personality,
        disclaimer: PersonalityService.DISCLAIMER,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/personality/calculate/:userId
   * Recalculate personality based on historical debates and update profile
   */
  static async recalculatePersonality(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId || req.user?.id || 'usr_player_1';
      const recalculated = await PersonalityService.calculatePersonality(userId);

      res.status(200).json({
        success: true,
        message: 'Debate personality recalculated successfully.',
        data: recalculated,
        disclaimer: PersonalityService.DISCLAIMER,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/personality/:userId/history
   * Retrieve historical progression of personality and scores across debates
   */
  static async getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.params.userId || 'usr_player_1';
      const personality = await PersonalityService.getPersonalityByUserId(userId);

      res.status(200).json({
        success: true,
        data: personality.history || [],
        debatesAnalyzed: personality.debatesAnalyzed || 0,
        currentArchetype: personality.archetype,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/personality/archetypes/all
   * Get all debate archetype profiles
   */
  static async getAllArchetypes(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        data: ARCHETYPES,
        disclaimer: PersonalityService.DISCLAIMER,
      });
    } catch (error) {
      next(error);
    }
  }
}
