import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { DebateEngine } from '../engine/DebateEngine';
import { MOCK_TOPICS, AI_OPPONENTS } from '../../src/data/mockData';

interface MatchTicket {
  ticketId: string;
  userId: string;
  username: string;
  avatarUrl: string;
  elo: number;
  category?: string;
  difficulty?: string;
  mode?: string;
  status: 'searching' | 'matched' | 'cancelled';
  matchId?: string;
  createdAt: number;
}

// In-memory active matchmaking queue
const matchmakingQueue: Map<string, MatchTicket> = new Map();

export class MatchmakingController {
  /**
   * POST /api/matchmaking/queue
   * Joins the queue for live matchmaking
   */
  static async joinQueue(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { category = 'All Categories', difficulty = 'Competitive', mode = '1v1 Human' } = req.body;
      const userId = req.user?.id || req.body.userId || `usr_${Date.now()}`;
      const username = req.user?.username || req.body.username || 'Grandmaster Debater';
      const avatarUrl = req.body.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
      const elo = Number(req.body.elo) || 1200;

      const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      // Check if there is an existing waiting ticket in the queue
      let matchedTicket: MatchTicket | null = null;
      for (const [id, ticket] of matchmakingQueue.entries()) {
        if (ticket.status === 'searching' && ticket.userId !== userId) {
          matchedTicket = ticket;
          break;
        }
      }

      if (matchedTicket) {
        // Form a match!
        const matchId = `match_${Date.now()}`;
        matchedTicket.status = 'matched';
        matchedTicket.matchId = matchId;

        const filteredTopics = category && category !== 'All Categories'
          ? MOCK_TOPICS.filter(t => t.category === category)
          : MOCK_TOPICS;
        const selectedTopic = filteredTopics.length > 0
          ? filteredTopics[Math.floor(Math.random() * filteredTopics.length)]
          : MOCK_TOPICS[0];

        const ticket: MatchTicket = {
          ticketId,
          userId,
          username,
          avatarUrl,
          elo,
          category,
          difficulty,
          mode,
          status: 'matched',
          matchId,
          createdAt: Date.now(),
        };
        matchmakingQueue.set(ticketId, ticket);

        res.status(200).json({
          success: true,
          status: 'matched',
          matchId,
          ticketId,
          opponent: {
            id: matchedTicket.userId,
            name: matchedTicket.username,
            avatar: matchedTicket.avatarUrl,
            elo: matchedTicket.elo,
          },
          topic: selectedTopic,
        });
        return;
      }

      // If mode is "Human vs AI Master", instant-match with an elite AI persona
      if (mode === 'Human vs AI Master') {
        const matchId = `match_ai_${Date.now()}`;
        const aiOpponent = AI_OPPONENTS[Math.floor(Math.random() * AI_OPPONENTS.length)];
        const selectedTopic = MOCK_TOPICS[Math.floor(Math.random() * MOCK_TOPICS.length)];

        res.status(200).json({
          success: true,
          status: 'matched',
          matchId,
          ticketId,
          opponent: aiOpponent,
          topic: selectedTopic,
        });
        return;
      }

      // Add to waiting queue
      const newTicket: MatchTicket = {
        ticketId,
        userId,
        username,
        avatarUrl,
        elo,
        category,
        difficulty,
        mode,
        status: 'searching',
        createdAt: Date.now(),
      };
      matchmakingQueue.set(ticketId, newTicket);

      res.status(200).json({
        success: true,
        status: 'searching',
        ticketId,
        estimatedWaitSeconds: 8,
        message: 'Entered matchmaking queue. Searching for an opponent with comparable ELO ranking...',
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/matchmaking/status/:ticketId
   * Polling endpoint to check ticket status
   */
  static async checkStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ticketId } = req.params;
      const ticket = matchmakingQueue.get(ticketId);

      if (!ticket) {
        res.status(404).json({ success: false, error: 'Matchmaking ticket not found or expired.' });
        return;
      }

      // Auto-simulate finding an opponent if searching for > 6 seconds
      if (ticket.status === 'searching' && Date.now() - ticket.createdAt > 6000) {
        ticket.status = 'matched';
        ticket.matchId = `match_${Date.now()}`;
      }

      res.status(200).json({
        success: true,
        status: ticket.status,
        matchId: ticket.matchId,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/matchmaking/cancel
   * Leaves the matchmaking pool
   */
  static async cancelQueue(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { ticketId } = req.body;
      if (ticketId && matchmakingQueue.has(ticketId)) {
        const ticket = matchmakingQueue.get(ticketId)!;
        ticket.status = 'cancelled';
        matchmakingQueue.delete(ticketId);
      }

      res.status(200).json({
        success: true,
        message: 'Removed from matchmaking queue.',
      });
    } catch (error) {
      next(error);
    }
  }
}
