import { TopicModel, ITopic } from '../models/Topic';
import { isMongoConnected } from '../config/db';
import { MOCK_TOPICS } from '../../src/data/mockData';
import { AppError } from '../utils/appError';

export class TopicService {
  static async createTopic(data: {
    title: string;
    motion: string;
    category?: any;
    description?: string;
    difficulty?: any;
    recommendedRounds?: number;
    createdBy?: string;
  }) {
    if (isMongoConnected) {
      return await TopicModel.create(data);
    }

    const newTopic = {
      _id: `top_${Date.now()}`,
      id: `top_${Date.now()}`,
      ...data,
      category: data.category || 'General',
      difficulty: data.difficulty || 'Competitive',
      recommendedRounds: data.recommendedRounds || 3,
      status: 'active',
      timesUsed: 0,
      createdAt: new Date(),
    };

    return newTopic;
  }

  static async getTopics(filter?: { category?: string; difficulty?: string; status?: string }) {
    if (isMongoConnected) {
      const query: any = {};
      if (filter?.category) query.category = filter.category;
      if (filter?.difficulty) query.difficulty = filter.difficulty;
      if (filter?.status) query.status = filter.status;
      else query.status = 'active';

      let topics = await TopicModel.find(query).sort({ timesUsed: -1, createdAt: -1 });
      if (topics.length === 0) {
        await this.seedInitialTopics();
        topics = await TopicModel.find(query);
      }
      return topics;
    }

    // Memory fallback topics from MOCK_TOPICS
    return MOCK_TOPICS;
  }

  static async getTopicById(id: string) {
    if (isMongoConnected) {
      const topic = await TopicModel.findById(id);
      if (!topic) throw new AppError('Topic not found.', 404);
      return topic;
    }

    const found = MOCK_TOPICS.find(t => t.id === id);
    if (!found) throw new AppError('Topic not found.', 404);
    return found;
  }

  static async seedInitialTopics() {
    if (!isMongoConnected) return;

    for (const t of MOCK_TOPICS) {
      await TopicModel.findOneAndUpdate(
        { title: t.title },
        {
          title: t.title,
          motion: t.motion,
          category: t.category,
          description: t.description,
          difficulty: t.difficulty,
          recommendedRounds: t.recommendedRounds,
          status: 'active',
        },
        { upsert: true }
      );
    }
  }
}
