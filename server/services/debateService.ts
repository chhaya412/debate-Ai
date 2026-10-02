import { DebateModel, IDebate } from '../models/Debate';
import { TopicService } from './topicService';
import { ScoreService } from './scoreService';
import { AiEvaluationService } from './aiEvaluationService';
import { UserService } from './userService';
import { PersonalityService } from './personalityService';
import { calculateEloChange } from '../utils/eloCalculator';
import { AppError } from '../utils/appError';
import { isMongoConnected } from '../config/db';
import { AI_OPPONENTS, INITIAL_TRANSCRIPT } from '../../src/data/mockData';

// Memory store for active matches when MongoDB is offline
const memoryDebates = new Map<string, any>();

export class DebateService {
  static async createDebate(data: {
    topicId?: string;
    topicTitle?: string;
    motion?: string;
    category?: string;
    difficulty?: 'Novice' | 'Competitive' | 'Grandmaster';
    mode?: '1v1 Human' | 'Human vs AI Master' | 'Speed Debate (Blitz)';
    totalRounds?: number;
    creatorUser: { id: string; username: string; avatarUrl?: string; elo?: number };
    opponentUser?: { id: string; username: string; avatarUrl?: string; elo?: number };
  }) {
    let topicTitle = data.topicTitle || 'Autonomous AI Weapons Ban';
    let motion = data.motion || 'This House would establish a binding international treaty banning fully autonomous lethal weapon systems.';
    let category = data.category || 'Artificial Intelligence';

    if (data.topicId) {
      try {
        const topic = await TopicService.getTopicById(data.topicId);
        if (topic) {
          topicTitle = topic.title;
          motion = topic.motion;
          category = topic.category;
        }
      } catch (e) {
        // use fallback topic info
      }
    }

    const defaultOpponent = data.opponentUser || {
      id: AI_OPPONENTS[0].id,
      username: AI_OPPONENTS[0].name,
      avatarUrl: AI_OPPONENTS[0].avatar,
      elo: AI_OPPONENTS[0].elo,
    };

    const debatePayload: any = {
      topicTitle,
      motion,
      category,
      difficulty: data.difficulty || 'Competitive',
      mode: data.mode || 'Human vs AI Master',
      totalRounds: data.totalRounds || 3,
      currentRound: 1,
      turnDuration: 120,
      activeSpeakerSide: 'affirmative',
      status: 'in_progress',
      participants: {
        affirmative: {
          userId: data.creatorUser.id,
          username: data.creatorUser.username,
          avatarUrl: data.creatorUser.avatarUrl || '',
          eloBefore: data.creatorUser.elo || 1200,
          totalScore: 0,
        },
        negative: {
          userId: defaultOpponent.id,
          username: defaultOpponent.username,
          avatarUrl: defaultOpponent.avatarUrl || '',
          eloBefore: defaultOpponent.elo || 1200,
          totalScore: 0,
        },
      },
      transcript: [],
    };

    if (isMongoConnected) {
      return await DebateModel.create(debatePayload);
    }

    const id = `match_${Date.now()}`;
    const memoryDebate = { _id: id, id, ...debatePayload, createdAt: new Date() };
    memoryDebates.set(id, memoryDebate);
    return memoryDebate;
  }

  static async getDebateById(id: string) {
    if (isMongoConnected) {
      const debate = await DebateModel.findById(id);
      if (!debate) throw new AppError('Debate match not found.', 404);
      return debate;
    }

    const debate = memoryDebates.get(id);
    if (!debate) {
      // return default mock session
      return {
        _id: id,
        id,
        topicTitle: 'Autonomous AI Weapons Ban',
        motion: 'This House would establish a binding international treaty banning fully autonomous lethal weapon systems.',
        totalRounds: 3,
        currentRound: 2,
        status: 'in_progress',
        transcript: INITIAL_TRANSCRIPT,
      };
    }
    return debate;
  }

  static async submitArgument(
    debateId: string,
    speakerId: string,
    speakerName: string,
    speakerAvatar: string,
    side: 'affirmative' | 'negative',
    argumentText: string
  ) {
    const debate = await this.getDebateById(debateId);

    if (debate.status !== 'in_progress') {
      throw new AppError('Debate is not in active state.', 400);
    }

    if (debate.activeSpeakerSide !== side) {
      throw new AppError(`Not your turn. Active speaker side is ${debate.activeSpeakerSide}.`, 403);
    }

    // 1. Run AI Evaluation
    const evalResult = await AiEvaluationService.evaluateArgument({
      debateId,
      roundNumber: debate.currentRound,
      topicMotion: debate.motion,
      side,
      argumentText,
    });

    // 2. Record Score document
    await ScoreService.recordScore({
      debateId,
      roundNumber: debate.currentRound,
      speakerId,
      side,
      ...evalResult,
    });

    // 3. Append Turn to Transcript
    const turnRecord = {
      roundNumber: debate.currentRound,
      speakerId,
      speakerName,
      speakerAvatar,
      side,
      argumentText,
      submittedAt: new Date(),
      scores: {
        logic: evalResult.logic,
        relevance: evalResult.relevance,
        evidence: evalResult.evidence,
        rebuttal: evalResult.rebuttal,
        persuasiveness: evalResult.persuasiveness,
        ruleAdherence: evalResult.ruleAdherence,
        fallacyDeductions: evalResult.fallacyDeductions,
        total: evalResult.total,
      },
      fallacies: evalResult.fallacies,
      aiFeedbackSummary: evalResult.aiFeedbackSummary,
      aiCrossQuestion: evalResult.aiCrossQuestion,
    };

    debate.transcript.push(turnRecord);

    // Update cumulative score
    if (side === 'affirmative') {
      debate.participants.affirmative.totalScore =
        (debate.participants.affirmative.totalScore || 0) + evalResult.total;
      debate.activeSpeakerSide = 'negative';
    } else {
      debate.participants.negative.totalScore =
        (debate.participants.negative.totalScore || 0) + evalResult.total;
      debate.activeSpeakerSide = 'affirmative';

      // If negative spoke, advance the round or complete match
      if (debate.currentRound >= debate.totalRounds) {
        const conclusion = await this.concludeDebate(debate);
        return {
          debate: conclusion.debate,
          turn: turnRecord,
          isCompleted: true,
          winnerId: conclusion.winnerId,
          eloChangeA: conclusion.eloChangeA,
          eloChangeB: conclusion.eloChangeB,
        };
      } else {
        debate.currentRound += 1;
      }
    }

    if (isMongoConnected && debate.save) {
      await debate.save();
    } else {
      memoryDebates.set(debateId, debate);
    }

    return { debate, turn: turnRecord, isCompleted: false };
  }

  static async concludeDebate(debate: any) {
    debate.status = 'completed';
    debate.completedAt = new Date();

    const scoreA = debate.participants.affirmative.totalScore || 0;
    const scoreB = debate.participants.negative.totalScore || 0;

    let winnerId = 'draw';
    if (scoreA > scoreB) winnerId = debate.participants.affirmative.userId;
    else if (scoreB > scoreA) winnerId = debate.participants.negative.userId;

    debate.winnerId = winnerId;

    // Calculate Elo Rating Adjustments
    const eloCalc = calculateEloChange(
      debate.participants.affirmative.eloBefore,
      debate.participants.negative.eloBefore,
      scoreA,
      scoreB
    );

    debate.participants.affirmative.eloAfter = eloCalc.newRatingA;
    debate.participants.negative.eloAfter = eloCalc.newRatingB;

    debate.verdictExplanation =
      winnerId === 'draw'
        ? 'The debate concluded in an exact statistical draw. Both debaters displayed balanced rhetoric and deductive reasoning.'
        : `${winnerId === debate.participants.affirmative.userId ? debate.participants.affirmative.username : debate.participants.negative.username} clinched the match with decisive points across rebuttal accuracy and fewer fallacy penalties.`;

    // Persist user stats update
    await UserService.updateStatsAfterDebate(
      debate.participants.affirmative.userId,
      winnerId === debate.participants.affirmative.userId,
      winnerId === 'draw',
      scoreA,
      eloCalc.deltaA
    );

    // Update personalized debate personality profile for debaters
    try {
      if (debate.participants.affirmative?.userId) {
        await PersonalityService.updatePersonalityAfterDebate(
          debate.participants.affirmative.userId,
          debate
        );
      }
      if (
        debate.participants.negative?.userId &&
        !debate.participants.negative.userId.startsWith('ai_opp_')
      ) {
        await PersonalityService.updatePersonalityAfterDebate(
          debate.participants.negative.userId,
          debate
        );
      }
    } catch (personalityErr) {
      console.warn('[DebateService] Personality update warning:', personalityErr);
    }

    if (isMongoConnected && debate.save) {
      await debate.save();
    } else {
      memoryDebates.set(debate.id || debate._id, debate);
    }

    return { debate, isCompleted: true, winnerId, eloChangeA: eloCalc.deltaA, eloChangeB: eloCalc.deltaB };
  }
}
