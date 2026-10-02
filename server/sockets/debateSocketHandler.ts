import { Server, Socket } from 'socket.io';
import { DebateEngine } from '../engine/DebateEngine';

export function setupDebateSocketHandlers(io: Server) {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    /**
     * 1. Event: join_debate
     * Player joins debate room, handles reconnection, synchronizes topic and room state
     */
    socket.on(
      'join_debate',
      (data: {
        debateId: string;
        userId: string;
        username: string;
        avatar?: string;
        preferredSide?: 'affirmative' | 'negative';
        topic?: any;
      }) => {
        try {
          DebateEngine.joinDebate(io, socket, data);
        } catch (err: any) {
          console.error('[Socket.IO] join_debate error:', err);
          socket.emit('error_response', { code: 'JOIN_ERROR', message: err.message });
        }
      }
    );

    // Backward-compatibility alias
    socket.on('debate:join', (data: any) => {
      DebateEngine.joinDebate(io, socket, {
        debateId: data.debateId,
        userId: data.user?.id || data.userId || socket.id,
        username: data.user?.username || data.username || 'Debater',
        avatar: data.user?.avatar || data.avatar,
        preferredSide: data.side,
      });
    });

    /**
     * 2. Event: player_ready
     * Signals readiness to start the debate
     */
    socket.on('player_ready', (data: { debateId: string; userId: string }) => {
      try {
        DebateEngine.playerReady(io, socket, data);
      } catch (err: any) {
        console.error('[Socket.IO] player_ready error:', err);
      }
    });

    /**
     * 3. Event: start_debate
     * Force or manual trigger to start debate simultaneously
     */
    socket.on('start_debate', (data: { debateId: string }) => {
      try {
        const room = DebateEngine.getOrCreateRoom(data.debateId);
        DebateEngine.startDebate(io, room);
      } catch (err: any) {
        console.error('[Socket.IO] start_debate error:', err);
      }
    });

    socket.on('debate:start', (data: { debateId: string }) => {
      const room = DebateEngine.getOrCreateRoom(data.debateId);
      DebateEngine.startDebate(io, room);
    });

    /**
     * 4. Event: argument_submitted
     * Debater submits their turn argument.
     * Prevents duplicate submissions and triggers argument_received & asynchronous AI evaluation.
     */
    socket.on(
      'argument_submitted',
      async (data: {
        debateId: string;
        userId: string;
        side: 'affirmative' | 'negative';
        roundNumber: number;
        argumentText: string;
        submissionId: string;
      }) => {
        try {
          await DebateEngine.submitArgument(io, socket, data);
        } catch (err: any) {
          console.error('[Socket.IO] argument_submitted error:', err);
          socket.emit('error_response', { code: 'ARGUMENT_SUBMIT_ERROR', message: err.message });
        }
      }
    );

    // Backward-compatibility alias
    socket.on(
      'debate:submit_argument',
      async (data: {
        debateId: string;
        speakerId: string;
        speakerName: string;
        speakerAvatar?: string;
        side: 'affirmative' | 'negative';
        argumentText: string;
        roundNumber?: number;
      }) => {
        const submissionId = `sub_${data.debateId}_${Date.now()}`;
        await DebateEngine.submitArgument(io, socket, {
          debateId: data.debateId,
          userId: data.speakerId,
          side: data.side,
          roundNumber: data.roundNumber || 1,
          argumentText: data.argumentText,
          submissionId,
        });
      }
    );

    /**
     * 5. Event: answer_submitted
     * Debater submits their defense response to the AI Cross-Question.
     * Prevents duplicates and triggers AI evaluation.
     */
    socket.on(
      'answer_submitted',
      async (data: {
        debateId: string;
        userId: string;
        questionId: string;
        answerText: string;
        submissionId: string;
      }) => {
        try {
          await DebateEngine.submitAnswer(io, socket, data);
        } catch (err: any) {
          console.error('[Socket.IO] answer_submitted error:', err);
          socket.emit('error_response', { code: 'ANSWER_SUBMIT_ERROR', message: err.message });
        }
      }
    );

    /**
     * Request manual state sync (used on reconnect or tab restore)
     */
    socket.on('request_state_sync', (data: { debateId: string }) => {
      const room = DebateEngine.getOrCreateRoom(data.debateId);
      socket.emit('debate_synced', {
        success: true,
        roomState: DebateEngine.getPublicRoomState(room),
      });
    });

    /**
     * Matchmaking Socket Events
     */
    socket.on('matchmaking:find_match', (data: { userId: string; username: string; category?: string; difficulty?: string }) => {
      socket.emit('matchmaking:searching', {
        status: 'searching',
        message: 'Entered live competitive matchmaking queue...',
      });

      setTimeout(() => {
        const matchId = `match_live_${Date.now()}`;
        socket.emit('matchmaking:match_found', {
          matchId,
          topicMotion: 'Resolved: Universal Basic Income is essential to offset rapid AI workforce disruption.',
          category: data.category || 'Technology & Society',
          difficulty: data.difficulty || 'Competitive',
          role: 'affirmative',
        });
      }, 3000);
    });

    socket.on('matchmaking:cancel', () => {
      socket.emit('matchmaking:cancelled', { status: 'cancelled' });
    });

    /**
     * Disconnect handler (with grace period for reconnect)
     */
    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
      DebateEngine.handleDisconnect(io, socket);
    });
  });
}

