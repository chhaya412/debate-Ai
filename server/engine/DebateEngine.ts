import { Server, Socket } from 'socket.io';
import { AiEvaluationService, AiEvaluationResponse } from '../services/aiEvaluationService';
import { AiCrossQuestionService, VulnerabilityCategory } from '../services/aiCrossQuestionService';
import { PersonalityService } from '../services/personalityService';
import { MOCK_TOPICS } from '../../src/data/mockData';

export interface PlayerParticipant {
  userId: string;
  socketId: string;
  username: string;
  avatar: string;
  side: 'affirmative' | 'negative';
  isReady: boolean;
  connected: boolean;
  score: number;
  disconnectedAt?: number;
}

export interface TurnArgument {
  submissionId: string;
  userId: string;
  username: string;
  side: 'affirmative' | 'negative';
  roundNumber: number;
  argumentText: string;
  timestamp: string;
  scores?: AiEvaluationResponse;
  isEvaluating?: boolean;
}

export interface LiveCrossQuestion {
  questionId: string;
  roundNumber: number;
  question: string;
  targetPlayer: 'A' | 'B';
  targetSide: 'affirmative' | 'negative';
  targetUserId: string;
  reason: string;
  difficulty: 'moderate' | 'hard' | 'extreme';
  vulnerabilityType: string;
  answer?: {
    submissionId: string;
    userId: string;
    answerText: string;
    timestamp: string;
    evaluation?: any;
    bonusPoints?: number;
  };
}

export interface SynchronizedDebateRoom {
  debateId: string;
  topic: {
    id: string;
    motion: string;
    category: string;
    difficulty: string;
    backgroundContext: string;
  };
  status: 'waiting' | 'ready' | 'in_progress' | 'cross_exam' | 'round_transition' | 'completed';
  players: {
    affirmative: PlayerParticipant | null;
    negative: PlayerParticipant | null;
  };
  currentRound: number;
  totalRounds: number;
  turnDuration: number;
  secondsRemaining: number;
  activeSpeaker: 'affirmative' | 'negative';
  timerInterval?: NodeJS.Timeout;
  transitionTimeout?: NodeJS.Timeout;
  reconnectGraceTimeout?: NodeJS.Timeout;
  transcript: TurnArgument[];
  roundSubmissions: Record<number, { affirmative?: TurnArgument; negative?: TurnArgument }>;
  processedSubmissionIds: Set<string>;
  currentCrossQuestion?: LiveCrossQuestion;
  cumulativeScores: { affirmative: number; negative: number };
  startedAt?: string;
  completedAt?: string;
  winner?: 'affirmative' | 'negative' | 'draw';
  verdictSummary?: string;
}

export class DebateEngine {
  private static rooms = new Map<string, SynchronizedDebateRoom>();
  private static userToRoom = new Map<string, { debateId: string; side: 'affirmative' | 'negative' }>();
  private static socketToUser = new Map<string, string>();

  /**
   * Helper to format public synchronized room state
   */
  public static getPublicRoomState(room: SynchronizedDebateRoom) {
    return {
      debateId: room.debateId,
      topic: room.topic,
      status: room.status,
      players: {
        affirmative: room.players.affirmative
          ? {
              userId: room.players.affirmative.userId,
              username: room.players.affirmative.username,
              avatar: room.players.affirmative.avatar,
              side: room.players.affirmative.side,
              isReady: room.players.affirmative.isReady,
              connected: room.players.affirmative.connected,
              score: room.players.affirmative.score,
            }
          : null,
        negative: room.players.negative
          ? {
              userId: room.players.negative.userId,
              username: room.players.negative.username,
              avatar: room.players.negative.avatar,
              side: room.players.negative.side,
              isReady: room.players.negative.isReady,
              connected: room.players.negative.connected,
              score: room.players.negative.score,
            }
          : null,
      },
      currentRound: room.currentRound,
      totalRounds: room.totalRounds,
      turnDuration: room.turnDuration,
      secondsRemaining: room.secondsRemaining,
      activeSpeaker: room.activeSpeaker,
      transcript: room.transcript,
      currentCrossQuestion: room.currentCrossQuestion,
      cumulativeScores: room.cumulativeScores,
      startedAt: room.startedAt,
      winner: room.winner,
      verdictSummary: room.verdictSummary,
    };
  }

  /**
   * Get or create a debate room
   */
  public static getOrCreateRoom(debateId: string, customTopic?: any): SynchronizedDebateRoom {
    let room = this.rooms.get(debateId);
    if (!room) {
      const topic = customTopic || MOCK_TOPICS[Math.floor(Math.random() * MOCK_TOPICS.length)] || {
        id: 'top_1',
        motion: 'This House would establish a binding international treaty banning fully autonomous lethal weapon systems.',
        category: 'Artificial Intelligence',
        difficulty: 'Competitive',
        backgroundContext: 'With rapid advances in drone swarms, edge compute, and autonomous targeting, international humanitarian law faces algorithmic accountability voids.',
      };

      room = {
        debateId,
        topic: {
          id: topic.id || `topic_${Date.now()}`,
          motion: topic.motion,
          category: topic.category || 'General',
          difficulty: topic.difficulty || 'Competitive',
          backgroundContext: topic.backgroundContext || '',
        },
        status: 'waiting',
        players: {
          affirmative: null,
          negative: null,
        },
        currentRound: 1,
        totalRounds: 3,
        turnDuration: 60,
        secondsRemaining: 60,
        activeSpeaker: 'affirmative',
        transcript: [],
        roundSubmissions: {},
        processedSubmissionIds: new Set<string>(),
        cumulativeScores: { affirmative: 0, negative: 0 },
      };

      this.rooms.set(debateId, room);
    }
    return room;
  }

  /**
   * Player joins debate room (with reconnect handling)
   */
  public static joinDebate(
    io: Server,
    socket: Socket,
    data: {
      debateId: string;
      userId: string;
      username: string;
      avatar?: string;
      preferredSide?: 'affirmative' | 'negative';
      topic?: any;
    }
  ) {
    const { debateId, userId, username, avatar = '', preferredSide } = data;
    const room = this.getOrCreateRoom(debateId, data.topic);
    const roomKey = `debate_${debateId}`;

    socket.join(roomKey);
    this.socketToUser.set(socket.id, userId);

    // Check if this user was already in this room (RECONNECTION CASE)
    let assignedSide: 'affirmative' | 'negative' | null = null;

    if (room.players.affirmative?.userId === userId) {
      assignedSide = 'affirmative';
      room.players.affirmative.socketId = socket.id;
      room.players.affirmative.connected = true;
      room.players.affirmative.disconnectedAt = undefined;
    } else if (room.players.negative?.userId === userId) {
      assignedSide = 'negative';
      room.players.negative.socketId = socket.id;
      room.players.negative.connected = true;
      room.players.negative.disconnectedAt = undefined;
    } else {
      // NEW PLAYER JOINING
      if (!room.players.affirmative && (!preferredSide || preferredSide === 'affirmative')) {
        assignedSide = 'affirmative';
      } else if (!room.players.negative) {
        assignedSide = 'negative';
      } else if (!room.players.affirmative) {
        assignedSide = 'affirmative';
      } else {
        // Room is full for debaters (spectator or overflow)
        assignedSide = null;
      }

      if (assignedSide) {
        const participant: PlayerParticipant = {
          userId,
          socketId: socket.id,
          username: username || `Debater_${userId.slice(0, 5)}`,
          avatar: avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${userId}`,
          side: assignedSide,
          isReady: false,
          connected: true,
          score: 0,
        };
        room.players[assignedSide] = participant;
        this.userToRoom.set(userId, { debateId, side: assignedSide });
      }
    }

    console.log(`[DebateEngine] User ${username} (${userId}) joined room ${debateId} as ${assignedSide || 'spectator'}`);

    // Send full synchronized state to reconnected or newly joined player
    socket.emit('debate_synced', {
      success: true,
      assignedSide,
      roomState: this.getPublicRoomState(room),
    });

    // Broadcast updated players & presence
    io.to(roomKey).emit('player_joined', {
      userId,
      username,
      side: assignedSide,
      players: {
        affirmative: room.players.affirmative ? { ...room.players.affirmative, socketId: undefined } : null,
        negative: room.players.negative ? { ...room.players.negative, socketId: undefined } : null,
      },
    });

    // Both players receive synchronized topic
    if (room.players.affirmative && room.players.negative) {
      io.to(roomKey).emit('topic_synchronized', {
        debateId: room.debateId,
        topic: room.topic,
        totalRounds: room.totalRounds,
        turnDuration: room.turnDuration,
        players: {
          affirmative: { userId: room.players.affirmative.userId, username: room.players.affirmative.username },
          negative: { userId: room.players.negative.userId, username: room.players.negative.username },
        },
      });
    }
  }

  /**
   * Player marks ready
   */
  public static playerReady(io: Server, socket: Socket, data: { debateId: string; userId: string }) {
    const room = this.rooms.get(data.debateId);
    if (!room) return;

    if (room.players.affirmative?.userId === data.userId) {
      room.players.affirmative.isReady = true;
    } else if (room.players.negative?.userId === data.userId) {
      room.players.negative.isReady = true;
    }

    const roomKey = `debate_${data.debateId}`;
    io.to(roomKey).emit('player_ready', {
      userId: data.userId,
      players: {
        affirmativeReady: room.players.affirmative?.isReady || false,
        negativeReady: room.players.negative?.isReady || false,
      },
    });

    // If both players are ready and debate hasn't started yet -> start debate simultaneously
    if (
      room.status === 'waiting' &&
      room.players.affirmative?.isReady &&
      room.players.negative?.isReady
    ) {
      this.startDebate(io, room);
    }
  }

  /**
   * Start debate simultaneously for both players
   */
  public static startDebate(io: Server, room: SynchronizedDebateRoom) {
    if (room.status !== 'waiting' && room.status !== 'ready') return;

    room.status = 'in_progress';
    room.currentRound = 1;
    room.activeSpeaker = 'affirmative';
    room.startedAt = new Date().toISOString();

    const roomKey = `debate_${room.debateId}`;

    io.to(roomKey).emit('start_debate', {
      debateId: room.debateId,
      topic: room.topic,
      currentRound: room.currentRound,
      totalRounds: room.totalRounds,
      players: {
        affirmative: { userId: room.players.affirmative?.userId, username: room.players.affirmative?.username },
        negative: { userId: room.players.negative?.userId, username: room.players.negative?.username },
      },
      startedAt: room.startedAt,
    });

    // Start Round 1
    this.startRound(io, room, 1);
  }

  /**
   * Start a specific round with synchronized timer
   */
  public static startRound(io: Server, room: SynchronizedDebateRoom, roundNumber: number) {
    room.status = 'in_progress';
    room.currentRound = roundNumber;
    room.activeSpeaker = 'affirmative';
    room.secondsRemaining = room.turnDuration;
    room.currentCrossQuestion = undefined;

    if (!room.roundSubmissions[roundNumber]) {
      room.roundSubmissions[roundNumber] = {};
    }

    // Clear any previous timer
    if (room.timerInterval) {
      clearInterval(room.timerInterval);
    }

    const roomKey = `debate_${room.debateId}`;
    const startedAt = new Date().toISOString();

    io.to(roomKey).emit('round_started', {
      debateId: room.debateId,
      roundNumber,
      totalRounds: room.totalRounds,
      activeSpeaker: room.activeSpeaker,
      timeLimit: room.turnDuration,
      startedAt,
    });

    // Synchronized Server Authoritative Timer (1-second tick)
    room.timerInterval = setInterval(() => {
      room.secondsRemaining -= 1;

      // Broadcast synchronized timer tick
      io.to(roomKey).emit('timer_tick', {
        debateId: room.debateId,
        roundNumber: room.currentRound,
        secondsRemaining: room.secondsRemaining,
        activeSpeaker: room.activeSpeaker,
      });

      // Time expired for this turn
      if (room.secondsRemaining <= 0) {
        clearInterval(room.timerInterval);
        this.handleTurnTimeout(io, room);
      }
    }, 1000);
  }

  /**
   * Handle turn time expiration
   */
  private static handleTurnTimeout(io: Server, room: SynchronizedDebateRoom) {
    console.log(`[DebateEngine] Turn time expired for ${room.activeSpeaker} in round ${room.currentRound}`);

    const activeSide = room.activeSpeaker;
    const currentRound = room.currentRound;
    const currentSub = room.roundSubmissions[currentRound]?.[activeSide];

    if (!currentSub) {
      // Auto-submit default timed-out statement so the debate doesn't stall
      const timedOutText = `[Time Expired] Speaker conceded turn without presenting closing rebuttal points.`;
      const submissionId = `timeout_${room.debateId}_r${currentRound}_${activeSide}`;
      const speaker = room.players[activeSide];

      this.submitArgument(io, null, {
        debateId: room.debateId,
        userId: speaker?.userId || 'system',
        side: activeSide,
        roundNumber: currentRound,
        argumentText: timedOutText,
        submissionId,
      });
    }
  }

  /**
   * Submit an argument (with duplicate submission prevention & idempotency)
   */
  public static async submitArgument(
    io: Server,
    socket: Socket | null,
    data: {
      debateId: string;
      userId: string;
      side: 'affirmative' | 'negative';
      roundNumber: number;
      argumentText: string;
      submissionId: string;
    }
  ) {
    const { debateId, userId, side, roundNumber, argumentText, submissionId } = data;
    const room = this.rooms.get(debateId);
    const roomKey = `debate_${debateId}`;

    if (!room) {
      socket?.emit('error_response', { code: 'ROOM_NOT_FOUND', message: 'Debate room not found.' });
      return;
    }

    // 1. DUPLICATE SUBMISSION PREVENTION (IDEMPOTENCY)
    if (room.processedSubmissionIds.has(submissionId)) {
      console.warn(`[DebateEngine] Duplicate submissionId blocked: ${submissionId}`);
      socket?.emit('error_response', {
        code: 'DUPLICATE_SUBMISSION',
        message: 'This argument has already been submitted and processed.',
      });
      return;
    }

    // Check if this side already submitted for this round
    if (room.roundSubmissions[roundNumber]?.[side]) {
      console.warn(`[DebateEngine] Duplicate round submission blocked for ${side} in round ${roundNumber}`);
      socket?.emit('error_response', {
        code: 'ALREADY_SUBMITTED',
        message: `Your side has already submitted an argument for Round ${roundNumber}.`,
      });
      return;
    }

    // Mark submissionId as processed
    room.processedSubmissionIds.add(submissionId);

    const player = room.players[side];
    const username = player?.username || (side === 'affirmative' ? 'Affirmative Speaker' : 'Negative Speaker');

    const turn: TurnArgument = {
      submissionId,
      userId,
      username,
      side,
      roundNumber,
      argumentText,
      timestamp: new Date().toISOString(),
      isEvaluating: true,
    };

    if (!room.roundSubmissions[roundNumber]) {
      room.roundSubmissions[roundNumber] = {};
    }
    room.roundSubmissions[roundNumber][side] = turn;
    room.transcript.push(turn);

    // Event: argument_submitted (acknowledgment to sender)
    socket?.emit('argument_submitted', {
      success: true,
      submissionId,
      roundNumber,
      side,
    });

    // Event: argument_received (broadcast to opponent and entire room)
    io.to(roomKey).emit('argument_received', {
      debateId,
      userId,
      username,
      side,
      roundNumber,
      argumentText,
      timestamp: turn.timestamp,
      submissionId,
    });

    // Event: ai_evaluation_started
    io.to(roomKey).emit('ai_evaluation_started', {
      debateId,
      roundNumber,
      side,
      message: `AI Chief Adjudicator is evaluating ${username}'s arguments for warrants, logic, and fallacies...`,
    });

    // Asynchronous AI Evaluation (Non-blocking)
    this.evaluateArgumentAsync(io, room, turn);

    // Switch active speaker or pause for cross-examination
    if (side === 'affirmative') {
      // Affirmative finished -> switch to Negative
      room.activeSpeaker = 'negative';
      room.secondsRemaining = room.turnDuration;
      io.to(roomKey).emit('active_speaker_changed', {
        activeSpeaker: 'negative',
        secondsRemaining: room.turnDuration,
        roundNumber,
      });
    } else {
      // Negative finished -> both sides have submitted for this round!
      if (room.timerInterval) {
        clearInterval(room.timerInterval);
      }
    }
  }

  /**
   * Asynchronous AI Evaluation
   */
  private static async evaluateArgumentAsync(
    io: Server,
    room: SynchronizedDebateRoom,
    turn: TurnArgument
  ) {
    const roomKey = `debate_${room.debateId}`;

    try {
      const evalResult = await AiEvaluationService.evaluateArgument({
        debateId: room.debateId,
        roundNumber: turn.roundNumber,
        topicMotion: room.topic.motion,
        side: turn.side,
        argumentText: turn.argumentText,
      });

      turn.scores = evalResult;
      turn.isEvaluating = false;

      // Update room cumulative scores
      room.cumulativeScores[turn.side] += evalResult.total;
      if (room.players[turn.side]) {
        room.players[turn.side]!.score = room.cumulativeScores[turn.side];
      }

      // Event: ai_evaluation_completed
      io.to(roomKey).emit('ai_evaluation_completed', {
        debateId: room.debateId,
        roundNumber: turn.roundNumber,
        side: turn.side,
        scores: evalResult,
        fallacies: evalResult.fallacies,
        feedback: evalResult.aiFeedbackSummary,
        cumulativeScores: room.cumulativeScores,
      });

      // Check if both sides have submitted for this round -> trigger cross-question
      const roundSubs = room.roundSubmissions[turn.roundNumber];
      if (roundSubs?.affirmative && roundSubs?.negative) {
        this.triggerCrossQuestionGeneration(io, room, turn.roundNumber);
      }
    } catch (err: any) {
      console.error('[DebateEngine] AI Evaluation error:', err);
      // Fallback response
      const fallbackScores: AiEvaluationResponse = {
        logic: 16,
        relevance: 14,
        evidence: 14,
        rebuttal: 15,
        persuasiveness: 14,
        ruleAdherence: 15,
        fallacyDeductions: 0,
        total: 88,
        fallacies: [],
        aiFeedbackSummary: 'Substantive argumentation presented with structured delivery.',
        aiCrossQuestion: 'On what empirical metrics do you prove systemic compliance?',
      };
      turn.scores = fallbackScores;
      turn.isEvaluating = false;
      room.cumulativeScores[turn.side] += fallbackScores.total;

      io.to(roomKey).emit('ai_evaluation_completed', {
        debateId: room.debateId,
        roundNumber: turn.roundNumber,
        side: turn.side,
        scores: fallbackScores,
        fallacies: [],
        feedback: fallbackScores.aiFeedbackSummary,
        cumulativeScores: room.cumulativeScores,
      });

      const roundSubs = room.roundSubmissions[turn.roundNumber];
      if (roundSubs?.affirmative && roundSubs?.negative) {
        this.triggerCrossQuestionGeneration(io, room, turn.roundNumber);
      }
    }
  }

  /**
   * Generates AI Cross-Question when both arguments are received
   */
  private static async triggerCrossQuestionGeneration(
    io: Server,
    room: SynchronizedDebateRoom,
    roundNumber: number
  ) {
    room.status = 'cross_exam';
    const roomKey = `debate_${room.debateId}`;

    const roundSubs = room.roundSubmissions[roundNumber];
    const affArg = roundSubs?.affirmative?.argumentText || '';
    const negArg = roundSubs?.negative?.argumentText || '';

    const previousArgs = room.transcript.map(t => ({
      speaker: t.side === 'affirmative' ? 'A' : 'B',
      side: t.side,
      round: t.roundNumber,
      text: t.argumentText,
    }));

    try {
      const qData = await AiCrossQuestionService.generateQuestion({
        topic: room.topic.motion,
        playerArgument: affArg,
        opponentArgument: negArg,
        previousArguments: previousArgs,
        round: roundNumber,
      });

      const targetSide: 'affirmative' | 'negative' = qData.targetPlayer === 'A' ? 'affirmative' : 'negative';
      const targetUser = room.players[targetSide]?.userId || (targetSide === 'affirmative' ? 'aff_user' : 'neg_user');
      const questionId = `cq_${room.debateId}_r${roundNumber}_${Date.now()}`;

      const liveQuestion: LiveCrossQuestion = {
        questionId,
        roundNumber,
        question: qData.question,
        targetPlayer: qData.targetPlayer,
        targetSide,
        targetUserId: targetUser,
        reason: qData.reason,
        difficulty: qData.difficulty as any,
        vulnerabilityType: qData.vulnerabilityType,
      };

      room.currentCrossQuestion = liveQuestion;

      // Event: cross_question_generated
      io.to(roomKey).emit('cross_question_generated', {
        debateId: room.debateId,
        roundNumber,
        questionId,
        question: qData.question,
        targetPlayer: qData.targetPlayer,
        targetSide,
        targetUserId: targetUser,
        targetUsername: room.players[targetSide]?.username || (targetSide === 'affirmative' ? 'Affirmative' : 'Negative'),
        reason: qData.reason,
        difficulty: qData.difficulty,
        vulnerabilityType: qData.vulnerabilityType,
      });
    } catch (err) {
      console.error('[DebateEngine] Cross-question generation error:', err);
    }
  }

  /**
   * Submit cross-question defense answer (with duplicate prevention)
   */
  public static async submitAnswer(
    io: Server,
    socket: Socket | null,
    data: {
      debateId: string;
      userId: string;
      questionId: string;
      answerText: string;
      submissionId: string;
    }
  ) {
    const { debateId, userId, questionId, answerText, submissionId } = data;
    const room = this.rooms.get(debateId);
    const roomKey = `debate_${debateId}`;

    if (!room || !room.currentCrossQuestion) {
      socket?.emit('error_response', { code: 'INVALID_STATE', message: 'No active cross-examination question.' });
      return;
    }

    if (room.currentCrossQuestion.questionId !== questionId) {
      socket?.emit('error_response', { code: 'QUESTION_MISMATCH', message: 'Question ID mismatch.' });
      return;
    }

    // DUPLICATE ANSWER PREVENTION
    if (room.processedSubmissionIds.has(submissionId) || room.currentCrossQuestion.answer) {
      socket?.emit('error_response', { code: 'ALREADY_ANSWERED', message: 'Defense answer has already been submitted.' });
      return;
    }

    room.processedSubmissionIds.add(submissionId);

    const targetSide = room.currentCrossQuestion.targetSide;
    room.currentCrossQuestion.answer = {
      submissionId,
      userId,
      answerText,
      timestamp: new Date().toISOString(),
    };

    // Event: answer_submitted (acknowledged)
    io.to(roomKey).emit('answer_submitted', {
      debateId,
      userId,
      questionId,
      answerText,
      targetSide,
      timestamp: room.currentCrossQuestion.answer.timestamp,
    });

    // Event: ai_evaluation_started (for defense response)
    io.to(roomKey).emit('ai_evaluation_started', {
      debateId,
      roundNumber: room.currentRound,
      side: targetSide,
      message: 'AI Adjudicator is evaluating cross-examination defense for directness and empirical rigor...',
    });

    // Evaluate defense answer asynchronously
    try {
      const evalResult = await AiCrossQuestionService.evaluateAnswer({
        topic: room.topic.motion,
        question: room.currentCrossQuestion.question,
        questionReason: room.currentCrossQuestion.reason,
        answer: answerText,
        targetPlayer: room.currentCrossQuestion.targetPlayer,
        round: room.currentRound,
      });

      const bonusPoints = Math.round(evalResult.score * 0.25); // e.g. up to 25 bonus defense pts
      room.cumulativeScores[targetSide] += bonusPoints;
      if (room.players[targetSide]) {
        room.players[targetSide]!.score = room.cumulativeScores[targetSide];
      }

      room.currentCrossQuestion.answer.evaluation = evalResult;
      room.currentCrossQuestion.answer.bonusPoints = bonusPoints;

      // Event: ai_evaluation_completed (defense evaluation)
      io.to(roomKey).emit('ai_evaluation_completed', {
        debateId,
        roundNumber: room.currentRound,
        side: targetSide,
        isCrossDefense: true,
        evaluation: evalResult,
        scores: {
          total: evalResult.score,
          logic: evalResult.breakdown.logicalConsistency,
          evidence: evalResult.breakdown.counterEvidence,
          rebuttal: evalResult.breakdown.rebuttalClarity,
          persuasiveness: evalResult.breakdown.directness,
          ruleAdherence: evalResult.breakdown.defenseDepth,
          fallacyDeductions: 0,
          aiFeedbackSummary: evalResult.feedback,
        },
        bonusPoints,
        cumulativeScores: room.cumulativeScores,
      });

      // Complete round and schedule next round or completion
      setTimeout(() => {
        this.completeRound(io, room);
      }, 1500);
    } catch (err) {
      console.error('[DebateEngine] Defense answer evaluation error:', err);
      setTimeout(() => {
        this.completeRound(io, room);
      }, 1000);
    }
  }

  /**
   * Complete current round and advance
   */
  public static completeRound(io: Server, room: SynchronizedDebateRoom) {
    const roundNumber = room.currentRound;
    const roomKey = `debate_${room.debateId}`;
    room.status = 'round_transition';

    const affSub = room.roundSubmissions[roundNumber]?.affirmative;
    const negSub = room.roundSubmissions[roundNumber]?.negative;
    const affRoundScore = affSub?.scores?.total || 0;
    const negRoundScore = negSub?.scores?.total || 0;

    let roundWinner: 'affirmative' | 'negative' | 'draw' = 'draw';
    if (affRoundScore > negRoundScore) roundWinner = 'affirmative';
    else if (negRoundScore > affRoundScore) roundWinner = 'negative';

    // Event: round_completed
    io.to(roomKey).emit('round_completed', {
      debateId: room.debateId,
      roundNumber,
      roundWinner,
      roundScores: {
        affirmative: affRoundScore,
        negative: negRoundScore,
      },
      cumulativeScores: room.cumulativeScores,
      hasMoreRounds: roundNumber < room.totalRounds,
    });

    // Check if more rounds remain
    if (roundNumber < room.totalRounds) {
      const nextRoundNumber = roundNumber + 1;

      // Automatically transition to next round after 3 seconds
      room.transitionTimeout = setTimeout(() => {
        // Event: next_round
        io.to(roomKey).emit('next_round', {
          debateId: room.debateId,
          nextRoundNumber,
          totalRounds: room.totalRounds,
          activeSpeaker: 'affirmative',
        });

        // Start next round
        this.startRound(io, room, nextRoundNumber);
      }, 3500);
    } else {
      // All rounds completed! Conclude debate
      this.completeDebate(io, room);
    }
  }

  /**
   * Complete entire debate
   */
  public static completeDebate(io: Server, room: SynchronizedDebateRoom) {
    room.status = 'completed';
    room.completedAt = new Date().toISOString();

    const affTotal = room.cumulativeScores.affirmative;
    const negTotal = room.cumulativeScores.negative;

    let winner: 'affirmative' | 'negative' | 'draw' = 'draw';
    let winnerName = 'Debate Concluded in a Draw';

    if (affTotal > negTotal) {
      winner = 'affirmative';
      winnerName = room.players.affirmative?.username || 'Affirmative';
    } else if (negTotal > affTotal) {
      winner = 'negative';
      winnerName = room.players.negative?.username || 'Negative';
    }

    const margin = Math.abs(affTotal - negTotal);
    const verdictSummary =
      winner === 'draw'
        ? `Both debaters demonstrated exceptional analytical parity across all ${room.totalRounds} rounds.`
        : `${winnerName} (${winner.toUpperCase()}) prevailed with a margin of ${margin} points, demonstrating superior empirical grounding and resilient defense against cross-examination inquiries.`;

    room.winner = winner;
    room.verdictSummary = verdictSummary;

    // Asynchronously update personality profiles for participants
    const affUserId = room.players.affirmative?.userId;
    const negUserId = room.players.negative?.userId;
    const winningUserId = winner === 'affirmative' ? affUserId : winner === 'negative' ? negUserId : 'draw';

    const debateSummary = {
      id: room.debateId,
      debateId: room.debateId,
      topicTitle: (room.topic as any).title || room.topic.motion || 'Debate Match',
      winnerId: winningUserId,
      transcript: room.transcript,
    };

    if (affUserId) {
      PersonalityService.updatePersonalityAfterDebate(affUserId, debateSummary).catch(err =>
        console.warn('[DebateEngine] Error updating aff personality:', err)
      );
    }
    if (negUserId) {
      PersonalityService.updatePersonalityAfterDebate(negUserId, debateSummary).catch(err =>
        console.warn('[DebateEngine] Error updating neg personality:', err)
      );
    }

    const roomKey = `debate_${room.debateId}`;

    // Event: debate_completed
    io.to(roomKey).emit('debate_completed', {
      debateId: room.debateId,
      winner,
      winnerName,
      margin,
      finalScores: room.cumulativeScores,
      verdict: {
        title: winner === 'draw' ? 'Draw - Dialectical Parity' : `Victory for ${winnerName}`,
        summary: verdictSummary,
        margin,
      },
      transcript: room.transcript,
      completedAt: room.completedAt,
    });
  }

  /**
   * Handle socket disconnection (with grace period for reconnect)
   */
  public static handleDisconnect(io: Server, socket: Socket) {
    const userId = this.socketToUser.get(socket.id);
    if (!userId) return;

    this.socketToUser.delete(socket.id);
    const session = this.userToRoom.get(userId);
    if (!session) return;

    const room = this.rooms.get(session.debateId);
    if (!room) return;

    const side = session.side;
    const player = room.players[side];
    if (player && player.socketId === socket.id) {
      player.connected = false;
      player.disconnectedAt = Date.now();

      const roomKey = `debate_${room.debateId}`;
      io.to(roomKey).emit('player_disconnected', {
        userId,
        side,
        username: player.username,
        reconnectGracePeriodSeconds: 60,
      });

      console.log(`[DebateEngine] Player ${player.username} (${userId}) disconnected from ${room.debateId}. Waiting for reconnect...`);
    }
  }
}
