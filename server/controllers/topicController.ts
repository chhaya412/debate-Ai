import { Request, Response, NextFunction } from 'express';
import { TopicService } from '../services/topicService';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

export class TopicController {
  static async createTopic(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const topic = await TopicService.createTopic({
        ...req.body,
        createdBy: req.user?.id,
      });
      res.status(201).json({
        success: true,
        message: 'Topic created successfully.',
        data: topic,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTopics(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category, difficulty, status } = req.query;
      const topics = await TopicService.getTopics({
        category: category as string,
        difficulty: difficulty as string,
        status: status as string,
      });
      res.status(200).json({
        success: true,
        count: topics.length,
        data: topics,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTopicById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const topic = await TopicService.getTopicById(req.params.id);
      res.status(200).json({
        success: true,
        data: topic,
      });
    } catch (error) {
      next(error);
    }
  }
}
