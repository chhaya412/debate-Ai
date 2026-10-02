'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface SynchronizedPlayer {
  userId: string;
  username: string;
  avatar: string;
  side: 'affirmative' | 'negative';
  isReady: boolean;
  connected: boolean;
  score: number;
}

export interface SynchronizedTopic {
  id: string;
  motion: string;
  category: string;
  difficulty: string;
  backgroundContext: string;
}

export interface SynchronizedArgument {
  submissionId: string;
  userId: string;
  username: string;
  side: 'affirmative' | 'negative';
  roundNumber: number;
  argumentText: string;
  timestamp: string;
  scores?: any;
  isEvaluating?: boolean;
}

export interface SynchronizedCrossQuestion {
  questionId: string;
  roundNumber: number;
  question: string;
  targetPlayer: 'A' | 'B';
  targetSide: 'affirmative' | 'negative';
  targetUserId: string;
  targetUsername?: string;
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

export interface DebateRoomState {
  debateId: string;
  topic: SynchronizedTopic;
  status: 'waiting' | 'ready' | 'in_progress' | 'cross_exam' | 'round_transition' | 'completed';
  players: {
    affirmative: SynchronizedPlayer | null;
    negative: SynchronizedPlayer | null;
  };
  currentRound: number;
  totalRounds: number;
  turnDuration: number;
  secondsRemaining: number;
  activeSpeaker: 'affirmative' | 'negative';
  transcript: SynchronizedArgument[];
  currentCrossQuestion?: SynchronizedCrossQuestion;
  cumulativeScores: { affirmative: number; negative: number };
  startedAt?: string;
  completedAt?: string;
  winner?: 'affirmative' | 'negative' | 'draw';
  verdictSummary?: string;
}

export interface UseDebateSocketOptions {
  debateId: string;
  userId: string;
  username: string;
  avatar?: string;
  preferredSide?: 'affirmative' | 'negative';
  serverUrl?: string;
  autoConnect?: boolean;
}

export function useDebateSocket(options: UseDebateSocketOptions) {
  const {
    debateId,
    userId,
    username,
    avatar,
    preferredSide,
    serverUrl,
    autoConnect = true,
  } = options;

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [assignedSide, setAssignedSide] = useState<'affirmative' | 'negative' | null>(null);
  const [roomState, setRoomState] = useState<DebateRoomState | null>(null);
  const [aiEvaluationStatus, setAiEvaluationStatus] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSubmissionId, setLastSubmissionId] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [roundWinnerNotice, setRoundWinnerNotice] = useState<{ round: number; winner: string; hasMore: boolean } | null>(null);

  // Prevent duplicate submissions via client-side idempotency set
  const submittedIdsRef = useRef<Set<string>>(new Set());

  // Establish or reconnect socket
  useEffect(() => {
    if (typeof window === 'undefined' || !autoConnect) return;

    // Use current origin in browser or specified serverUrl
    const targetUrl = serverUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');

    const socket = io(targetUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('[Socket] Connected to debate server with ID:', socket.id);
      setIsConnected(true);
      setIsReconnecting(false);
      setErrorNotice(null);

      // 1. Event: join_debate (with automatic reconnect handling)
      socket.emit('join_debate', {
        debateId,
        userId,
        username,
        avatar,
        preferredSide,
      });
    });

    socket.on('disconnect', (reason) => {
      console.warn('[Socket] Disconnected from server:', reason);
      setIsConnected(false);
      setIsReconnecting(true);
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      setIsConnected(false);
      setIsReconnecting(true);
    });

    // Reconnection state recovery
    socket.on('debate_synced', (data: { success: boolean; assignedSide: any; roomState: DebateRoomState }) => {
      console.log('[Socket] Debate state synchronized:', data);
      if (data.assignedSide) {
        setAssignedSide(data.assignedSide);
      }
      setRoomState(data.roomState);
      setIsReconnecting(false);
    });

    // Player presence events
    socket.on('player_joined', (data: any) => {
      console.log('[Socket] Player joined:', data);
      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: {
            ...prev.players,
            ...data.players,
          },
        };
      });
    });

    socket.on('player_ready', (data: any) => {
      console.log('[Socket] Player ready updated:', data);
      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          players: {
            affirmative: prev.players.affirmative
              ? { ...prev.players.affirmative, isReady: data.players.affirmativeReady }
              : null,
            negative: prev.players.negative
              ? { ...prev.players.negative, isReady: data.players.negativeReady }
              : null,
          },
        };
      });
    });

    socket.on('topic_synchronized', (data: any) => {
      console.log('[Socket] Topic synchronized for both players:', data);
      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          topic: data.topic,
          totalRounds: data.totalRounds,
          turnDuration: data.turnDuration,
        };
      });
    });

    // 2. Event: start_debate
    socket.on('start_debate', (data: any) => {
      console.log('[Socket] Debate started simultaneously:', data);
      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'in_progress',
          topic: data.topic,
          currentRound: data.currentRound,
          totalRounds: data.totalRounds,
          startedAt: data.startedAt,
        };
      });
    });

    // 3. Event: round_started
    socket.on('round_started', (data: any) => {
      console.log('[Socket] Round started:', data);
      setRoundWinnerNotice(null);
      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'in_progress',
          currentRound: data.roundNumber,
          totalRounds: data.totalRounds,
          activeSpeaker: data.activeSpeaker,
          secondsRemaining: data.timeLimit,
          currentCrossQuestion: undefined,
        };
      });
    });

    // Authoritative synchronized timer tick
    socket.on('timer_tick', (data: { secondsRemaining: number; activeSpeaker: any }) => {
      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          secondsRemaining: data.secondsRemaining,
          activeSpeaker: data.activeSpeaker,
        };
      });
    });

    // Active speaker transition
    socket.on('active_speaker_changed', (data: any) => {
      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          activeSpeaker: data.activeSpeaker,
          secondsRemaining: data.secondsRemaining,
        };
      });
    });

    // 4. Event: argument_submitted (acknowledgment)
    socket.on('argument_submitted', (data: any) => {
      setIsSubmitting(false);
      setLastSubmissionId(data.submissionId);
    });

    // 5. Event: argument_received (received from opponent or self)
    socket.on('argument_received', (data: SynchronizedArgument) => {
      console.log('[Socket] Argument received:', data);
      setRoomState((prev) => {
        if (!prev) return prev;
        // Avoid duplicate in transcript if already present
        const exists = prev.transcript.some((t) => t.submissionId === data.submissionId);
        if (exists) return prev;
        return {
          ...prev,
          transcript: [...prev.transcript, data],
        };
      });
    });

    // 6. Event: ai_evaluation_started
    socket.on('ai_evaluation_started', (data: { message: string; side: string }) => {
      setAiEvaluationStatus(data.message);
    });

    // 7. Event: ai_evaluation_completed
    socket.on('ai_evaluation_completed', (data: any) => {
      console.log('[Socket] AI Evaluation completed:', data);
      setAiEvaluationStatus(null);
      setRoomState((prev) => {
        if (!prev) return prev;
        const updatedTranscript = prev.transcript.map((t) => {
          if (t.roundNumber === data.roundNumber && t.side === data.side) {
            return { ...t, scores: data.scores, isEvaluating: false };
          }
          return t;
        });

        return {
          ...prev,
          transcript: updatedTranscript,
          cumulativeScores: data.cumulativeScores || prev.cumulativeScores,
        };
      });
    });

    // 8. Event: cross_question_generated
    socket.on('cross_question_generated', (data: SynchronizedCrossQuestion) => {
      console.log('[Socket] AI Cross-Question generated:', data);
      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'cross_exam',
          currentCrossQuestion: data,
        };
      });
    });

    // 9. Event: answer_submitted
    socket.on('answer_submitted', (data: any) => {
      console.log('[Socket] Cross-question defense answer submitted:', data);
      setRoomState((prev) => {
        if (!prev || !prev.currentCrossQuestion) return prev;
        return {
          ...prev,
          currentCrossQuestion: {
            ...prev.currentCrossQuestion,
            answer: {
              submissionId: `ans_${Date.now()}`,
              userId: data.userId,
              answerText: data.answerText,
              timestamp: data.timestamp,
            },
          },
        };
      });
    });

    // 10. Event: round_completed
    socket.on('round_completed', (data: any) => {
      console.log('[Socket] Round completed:', data);
      setRoundWinnerNotice({
        round: data.roundNumber,
        winner: data.roundWinner,
        hasMore: data.hasMoreRounds,
      });
      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'round_transition',
          cumulativeScores: data.cumulativeScores || prev.cumulativeScores,
        };
      });
    });

    // 11. Event: next_round
    socket.on('next_round', (data: any) => {
      console.log('[Socket] Advancing to next round:', data);
    });

    // 12. Event: debate_completed
    socket.on('debate_completed', (data: any) => {
      console.log('[Socket] Debate completed:', data);
      setRoomState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          status: 'completed',
          winner: data.winner,
          verdictSummary: data.verdict?.summary || data.verdictSummary,
          cumulativeScores: data.finalScores || prev.cumulativeScores,
        };
      });
    });

    // Error handling
    socket.on('error_response', (data: { code: string; message: string }) => {
      console.warn('[Socket] Server Error:', data);
      setErrorNotice(data.message);
      setIsSubmitting(false);
    });

    socket.on('player_disconnected', (data: any) => {
      console.warn('[Socket] Player disconnected:', data);
      setErrorNotice(`${data.username || 'Opponent'} disconnected. 60s reconnection grace period active...`);
    });

    return () => {
      socket.disconnect();
    };
  }, [debateId, userId, username, avatar, preferredSide, serverUrl, autoConnect]);

  /**
   * Action: Mark player ready
   */
  const markReady = useCallback(() => {
    if (!socketRef.current || !isConnected) return;
    socketRef.current.emit('player_ready', { debateId, userId });
  }, [debateId, userId, isConnected]);

  /**
   * Action: Start debate
   */
  const startDebate = useCallback(() => {
    if (!socketRef.current || !isConnected) return;
    socketRef.current.emit('start_debate', { debateId });
  }, [debateId, isConnected]);

  /**
   * Action: Submit Argument (with client-side idempotency & duplicate prevention)
   */
  const submitArgument = useCallback(
    (argumentText: string) => {
      if (!socketRef.current || !isConnected || isSubmitting) return;
      if (!roomState || !assignedSide) return;

      const roundNumber = roomState.currentRound;
      // Idempotency token
      const submissionId = `sub_${debateId}_r${roundNumber}_${assignedSide}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      if (submittedIdsRef.current.has(submissionId)) {
        console.warn('Duplicate submission prevented locally.');
        return;
      }

      submittedIdsRef.current.add(submissionId);
      setIsSubmitting(true);
      setErrorNotice(null);

      socketRef.current.emit('argument_submitted', {
        debateId,
        userId,
        side: assignedSide,
        roundNumber,
        argumentText,
        submissionId,
      });
    },
    [debateId, userId, assignedSide, roomState, isConnected, isSubmitting]
  );

  /**
   * Action: Submit Cross-Question Defense Answer (with duplicate prevention)
   */
  const submitCrossAnswer = useCallback(
    (questionId: string, answerText: string) => {
      if (!socketRef.current || !isConnected) return;
      if (!roomState?.currentCrossQuestion) return;

      const submissionId = `ans_${questionId}_${userId}_${Date.now()}`;
      if (submittedIdsRef.current.has(submissionId)) return;
      submittedIdsRef.current.add(submissionId);

      socketRef.current.emit('answer_submitted', {
        debateId,
        userId,
        questionId,
        answerText,
        submissionId,
      });
    },
    [debateId, userId, roomState, isConnected]
  );

  /**
   * Action: Request manual state sync (recovery)
   */
  const requestSync = useCallback(() => {
    if (!socketRef.current || !isConnected) return;
    socketRef.current.emit('request_state_sync', { debateId });
  }, [debateId, isConnected]);

  return {
    socket: socketRef.current,
    isConnected,
    isReconnecting,
    assignedSide,
    roomState,
    aiEvaluationStatus,
    isSubmitting,
    lastSubmissionId,
    errorNotice,
    roundWinnerNotice,
    markReady,
    startDebate,
    submitArgument,
    submitCrossAnswer,
    requestSync,
    clearErrorNotice: () => setErrorNotice(null),
  };
}
