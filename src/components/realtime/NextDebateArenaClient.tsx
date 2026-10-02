'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Clock,
  Send,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Wifi,
  WifiOff,
  RefreshCw,
  Award,
  Swords,
  Copy,
  ChevronRight,
  Bot,
  User,
  HelpCircle,
} from 'lucide-react';
import { useDebateSocket } from '../../hooks/useDebateSocket';

export interface NextDebateArenaClientProps {
  debateId?: string;
  initialUserId?: string;
  initialUsername?: string;
  serverUrl?: string;
  onExit?: () => void;
}

export function NextDebateArenaClient({
  debateId: propDebateId,
  initialUserId,
  initialUsername,
  serverUrl,
  onExit,
}: NextDebateArenaClientProps) {
  // Safe local state initialization for Next.js / browser
  const [roomId, setRoomId] = useState<string>(() => {
    if (propDebateId) return propDebateId;
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlId = params.get('room');
      if (urlId) return urlId;
    }
    return `arena-${Math.random().toString(36).substring(2, 7)}`;
  });

  const [userId] = useState<string>(
    () => initialUserId || `usr_${Math.random().toString(36).substring(2, 8)}`
  );
  const [username, setUsername] = useState<string>(
    () => initialUsername || (typeof window !== 'undefined' ? localStorage.getItem('debate_username') || 'Alex Chen' : 'Alex Chen')
  );

  const [argumentInput, setArgumentInput] = useState('');
  const [defenseInput, setDefenseInput] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [autoSimulateOpponent, setAutoSimulateOpponent] = useState(false);

  const {
    isConnected,
    isReconnecting,
    assignedSide,
    roomState,
    aiEvaluationStatus,
    isSubmitting,
    errorNotice,
    roundWinnerNotice,
    markReady,
    startDebate,
    submitArgument,
    submitCrossAnswer,
    requestSync,
    clearErrorNotice,
  } = useDebateSocket({
    debateId: roomId,
    userId,
    username,
    preferredSide: 'affirmative',
    serverUrl,
    autoConnect: true,
  });

  // Simulated Opponent (for effortless single-tab testing)
  useEffect(() => {
    if (!autoSimulateOpponent || !roomState || roomState.status === 'completed') return;

    // 1. Join as opponent if negative is empty
    if (!roomState.players.negative) {
      const oppSocket = import('socket.io-client').then(({ io }) => {
        const targetUrl = serverUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
        const s = io(targetUrl, { transports: ['websocket', 'polling'] });
        s.emit('join_debate', {
          debateId: roomId,
          userId: 'usr_ai_opponent',
          username: 'Logos_Prime (AI Debater)',
          preferredSide: 'negative',
        });
        s.emit('player_ready', { debateId: roomId, userId: 'usr_ai_opponent' });
        return s;
      });

      return () => {
        oppSocket.then((s) => s.disconnect());
      };
    }

    // 2. Auto-submit negative argument if it's negative's turn
    if (
      roomState.status === 'in_progress' &&
      roomState.activeSpeaker === 'negative' &&
      roomState.players.negative?.userId === 'usr_ai_opponent'
    ) {
      const timer = setTimeout(() => {
        import('socket.io-client').then(({ io }) => {
          const targetUrl = serverUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
          const s = io(targetUrl);
          s.emit('argument_submitted', {
            debateId: roomId,
            userId: 'usr_ai_opponent',
            side: 'negative',
            roundNumber: roomState.currentRound,
            argumentText: `While the affirmative posits noble intentions, systemic second-order effects will destabilize structural incentives. Without strict market friction mechanisms, capital flight and allocation distortions inevitably offset claimed benefits.`,
            submissionId: `sub_sim_r${roomState.currentRound}_${Date.now()}`,
          });
          setTimeout(() => s.disconnect(), 1000);
        });
      }, 3000);
      return () => clearTimeout(timer);
    }

    // 3. Auto-answer cross question if target is AI opponent
    if (
      roomState.status === 'cross_exam' &&
      roomState.currentCrossQuestion &&
      roomState.currentCrossQuestion.targetSide === 'negative' &&
      roomState.players.negative?.userId === 'usr_ai_opponent' &&
      !roomState.currentCrossQuestion.answer
    ) {
      const timer = setTimeout(() => {
        import('socket.io-client').then(({ io }) => {
          const targetUrl = serverUrl || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
          const s = io(targetUrl);
          s.emit('answer_submitted', {
            debateId: roomId,
            userId: 'usr_ai_opponent',
            questionId: roomState.currentCrossQuestion!.questionId,
            answerText: `We address the inquiry directly: our model incorporates dynamic feedback loops based on empirical Swiss and Scandinavian governance frameworks, ensuring equilibrium without systemic failure.`,
            submissionId: `ans_sim_${Date.now()}`,
          });
          setTimeout(() => s.disconnect(), 1000);
        });
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [autoSimulateOpponent, roomState, roomId, serverUrl]);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      const url = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleSendArgument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!argumentInput.trim() || isSubmitting) return;
    submitArgument(argumentInput.trim());
    setArgumentInput('');
  };

  const handleSendDefense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!defenseInput.trim() || !roomState?.currentCrossQuestion) return;
    submitCrossAnswer(roomState.currentCrossQuestion.questionId, defenseInput.trim());
    setDefenseInput('');
  };

  const isMyTurn =
    roomState?.status === 'in_progress' &&
    assignedSide &&
    roomState.activeSpeaker === assignedSide;

  const isMyCrossExam =
    roomState?.status === 'cross_exam' &&
    roomState.currentCrossQuestion &&
    roomState.currentCrossQuestion.targetSide === assignedSide &&
    !roomState.currentCrossQuestion.answer;

  const affirmativePlayer = roomState?.players.affirmative;
  const negativePlayer = roomState?.players.negative;
  const bothPlayersReady = affirmativePlayer?.isReady && negativePlayer?.isReady;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Top Navigation & Status Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Swords className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg font-bold text-white tracking-wide">Real-Time Debate Arena</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                Socket.IO Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Room: <span className="font-mono text-slate-200">{roomId}</span>
              {assignedSide && (
                <span className="ml-2 capitalize text-amber-400 font-medium">
                  • Side: {assignedSide}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Connectivity and Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={handleCopyLink}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 transition border border-slate-700"
            title="Copy debate room link"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>{copiedLink ? 'Copied Link!' : 'Invite Opponent'}</span>
          </button>

          <button
            onClick={() => setAutoSimulateOpponent(!autoSimulateOpponent)}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
              autoSimulateOpponent
                ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Bot Opponent: {autoSimulateOpponent ? 'ON' : 'OFF'}</span>
          </button>

          {/* Connection Pill */}
          <div
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium border ${
              isReconnecting
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-400'
                : isConnected
                ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400'
                : 'bg-rose-950/40 border-rose-500/40 text-rose-400'
            }`}
          >
            {isReconnecting ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Reconnecting...</span>
              </>
            ) : isConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5" />
                <span>Live Synced</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5" />
                <span>Disconnected</span>
              </>
            )}
          </div>

          {onExit && (
            <button
              onClick={onExit}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 transition"
            >
              Exit
            </button>
          )}
        </div>
      </div>

      {/* Error Alert */}
      {errorNotice && (
        <div className="bg-amber-950/60 border border-amber-500/40 rounded-xl p-3 flex items-center justify-between text-amber-300 text-sm">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>{errorNotice}</span>
          </div>
          <button
            onClick={clearErrorNotice}
            className="text-xs text-amber-400 hover:underline ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Synchronized Motion Banner */}
      {roomState?.topic && (
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/30 rounded-xl p-5 shadow-lg relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {roomState.topic.category}
              </span>
              <span className="text-xs text-slate-400">
                Difficulty: <span className="text-slate-200">{roomState.topic.difficulty}</span>
              </span>
            </div>

            {/* Synchronized Live Scores */}
            <div className="flex items-center space-x-4 bg-slate-900/80 px-4 py-1.5 rounded-lg border border-slate-800">
              <div className="text-xs">
                <span className="text-blue-400 font-bold">AFF: </span>
                <span className="text-white font-mono font-bold text-sm">
                  {roomState.cumulativeScores.affirmative}
                </span>
              </div>
              <div className="text-slate-600">vs</div>
              <div className="text-xs">
                <span className="text-rose-400 font-bold">NEG: </span>
                <span className="text-white font-mono font-bold text-sm">
                  {roomState.cumulativeScores.negative}
                </span>
              </div>
            </div>
          </div>

          <h1 className="text-lg md:text-xl font-bold text-white mb-2 leading-snug">
            "{roomState.topic.motion}"
          </h1>

          {roomState.topic.backgroundContext && (
            <p className="text-xs text-slate-400 line-clamp-2 max-w-4xl">
              {roomState.topic.backgroundContext}
            </p>
          )}
        </div>
      )}

      {/* LOBBY / WAITING STATE */}
      {(!roomState || roomState.status === 'waiting' || roomState.status === 'ready') && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-6">
          <div className="max-w-md mx-auto space-y-3">
            <h3 className="text-xl font-bold text-white">Pre-Debate Assembly Chamber</h3>
            <p className="text-sm text-slate-400">
              Both speakers must connect and signal readiness. The synchronized countdown will start simultaneously.
            </p>
          </div>

          {/* Speakers Presence Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto text-left">
            {/* Affirmative */}
            <div className={`p-4 rounded-xl border ${affirmativePlayer ? 'bg-blue-950/20 border-blue-500/40' : 'bg-slate-800/30 border-dashed border-slate-700'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Affirmative Speaker
                </span>
                {affirmativePlayer?.isReady ? (
                  <span className="flex items-center text-xs text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Ready
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">Not Ready</span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-300">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {affirmativePlayer?.username || 'Awaiting Affirmative Debater...'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {affirmativePlayer ? 'Connected' : 'Share room link to invite'}
                  </p>
                </div>
              </div>
            </div>

            {/* Negative */}
            <div className={`p-4 rounded-xl border ${negativePlayer ? 'bg-rose-950/20 border-rose-500/40' : 'bg-slate-800/30 border-dashed border-slate-700'}`}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-rose-400 uppercase tracking-wider">
                  Negative Speaker
                </span>
                {negativePlayer?.isReady ? (
                  <span className="flex items-center text-xs text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Ready
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">Not Ready</span>
                )}
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-rose-600/30 border border-rose-500/40 flex items-center justify-center text-rose-300">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">
                    {negativePlayer?.username || 'Awaiting Opponent...'}
                  </h4>
                  <p className="text-xs text-slate-400">
                    {negativePlayer ? 'Connected' : 'Toggle "AI Bot Opponent" above or invite friend'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Ready Action */}
          <div className="flex justify-center items-center space-x-4 pt-4">
            <button
              onClick={markReady}
              className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition flex items-center space-x-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Signal "I Am Ready"</span>
            </button>

            {bothPlayersReady && (
              <button
                onClick={startDebate}
                className="px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-lg shadow-emerald-600/30 transition flex items-center space-x-2 animate-pulse"
              >
                <Swords className="w-4 h-4" />
                <span>Start Debate Now</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* SYNCHRONIZED DEBATE ARENA IN PROGRESS */}
      {roomState && (roomState.status === 'in_progress' || roomState.status === 'cross_exam' || roomState.status === 'round_transition') && (
        <div className="space-y-6">
          {/* Synchronized Round HUD */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="px-3 py-1 bg-indigo-950 border border-indigo-500/40 text-indigo-300 rounded-lg text-sm font-bold">
                Round {roomState.currentRound} of {roomState.totalRounds}
              </div>
              <div className="text-xs text-slate-300">
                Active Turn:{' '}
                <span className={`font-bold uppercase ${roomState.activeSpeaker === 'affirmative' ? 'text-blue-400' : 'text-rose-400'}`}>
                  {roomState.activeSpeaker}
                </span>
                {isMyTurn && (
                  <span className="ml-2 px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-medium">
                    Your Turn
                  </span>
                )}
              </div>
            </div>

            {/* Synchronized Authoritative Timer */}
            <div className="flex items-center space-x-2">
              <Clock className={`w-5 h-5 ${roomState.secondsRemaining < 15 ? 'text-rose-400 animate-pulse' : 'text-indigo-400'}`} />
              <span className={`text-2xl font-mono font-bold ${roomState.secondsRemaining < 15 ? 'text-rose-400' : 'text-white'}`}>
                {Math.floor(roomState.secondsRemaining / 60)}:
                {(roomState.secondsRemaining % 60).toString().padStart(2, '0')}
              </span>
              <span className="text-xs text-slate-500">synced</span>
            </div>
          </div>

          {/* Round Transition Notice */}
          {roundWinnerNotice && (
            <div className="bg-indigo-950/60 border border-indigo-500/50 rounded-xl p-4 text-center text-indigo-200 animate-fade-in">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <Award className="w-5 h-5 text-amber-400" />
                <span className="font-bold text-white">Round {roundWinnerNotice.round} Concluded</span>
              </div>
              <p className="text-xs text-indigo-300">
                Adjudged Round Winner:{' '}
                <span className="font-bold text-amber-300 uppercase">{roundWinnerNotice.winner}</span>.
                {roundWinnerNotice.hasMore ? ' Advancing to next round in 3 seconds...' : ' Concluding final tournament match...'}
              </p>
            </div>
          )}

          {/* AI Evaluation Status Banner */}
          {aiEvaluationStatus && (
            <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 flex items-center space-x-3 text-indigo-300 text-xs animate-pulse">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 animate-spin" />
              <span>{aiEvaluationStatus}</span>
            </div>
          )}

          {/* Debate Transcript & Argument Stream */}
          <div className="space-y-4">
            <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Synchronized Debate Transcript
            </h3>

            <div className="space-y-3">
              {roomState.transcript.map((turn, idx) => {
                const isAff = turn.side === 'affirmative';
                return (
                  <div
                    key={turn.submissionId || idx}
                    className={`p-4 rounded-xl border ${
                      isAff
                        ? 'bg-blue-950/15 border-blue-500/30 ml-0 mr-4 md:mr-16'
                        : 'bg-rose-950/15 border-rose-500/30 mr-0 ml-4 md:ml-16'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-bold uppercase ${isAff ? 'text-blue-400' : 'text-rose-400'}`}>
                          {turn.side} • {turn.username}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          Round {turn.roundNumber}
                        </span>
                      </div>

                      {turn.scores && (
                        <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-xs">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span className="text-white font-bold">{turn.scores.total} pts</span>
                        </div>
                      )}
                    </div>

                    <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {turn.argumentText}
                    </p>

                    {/* AI Feedback & Scoring Breakdown (if evaluated) */}
                    {turn.scores && (
                      <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <div className="text-slate-400">
                          Logic: <span className="text-slate-200 font-semibold">{turn.scores.logic}/20</span>
                        </div>
                        <div className="text-slate-400">
                          Evidence: <span className="text-slate-200 font-semibold">{turn.scores.evidence}/15</span>
                        </div>
                        <div className="text-slate-400">
                          Rebuttal: <span className="text-slate-200 font-semibold">{turn.scores.rebuttal}/20</span>
                        </div>
                        <div className="text-slate-400">
                          Persuasion: <span className="text-slate-200 font-semibold">{turn.scores.persuasiveness}/15</span>
                        </div>

                        {turn.scores.aiFeedbackSummary && (
                          <div className="col-span-2 md:col-span-4 mt-1 text-slate-400 text-xs italic">
                            "{turn.scores.aiFeedbackSummary}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {roomState.transcript.length === 0 && (
                <div className="text-center py-10 text-slate-500 text-sm border border-dashed border-slate-800 rounded-xl">
                  Round 1 commenced. Waiting for Affirmative speaker to submit opening argument...
                </div>
              )}
            </div>
          </div>

          {/* AI CROSS-EXAMINATION CHAMBER */}
          {roomState.currentCrossQuestion && (
            <div className="bg-gradient-to-br from-indigo-950/60 via-slate-900 to-indigo-950/60 border-2 border-indigo-500/50 rounded-xl p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                    <HelpCircle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      AI Chief Adjudicator Cross-Examination
                    </h4>
                    <p className="text-xs text-indigo-300">
                      Targeted Vulnerability: <span className="font-semibold">{roomState.currentCrossQuestion.vulnerabilityType}</span>
                    </p>
                  </div>
                </div>

                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                  roomState.currentCrossQuestion.difficulty === 'extreme'
                    ? 'bg-rose-950 border-rose-500 text-rose-300'
                    : 'bg-amber-950 border-amber-500 text-amber-300'
                }`}>
                  {roomState.currentCrossQuestion.difficulty}
                </span>
              </div>

              <div className="bg-slate-900/90 border border-indigo-500/30 rounded-lg p-3.5 text-sm text-indigo-100 font-medium leading-relaxed">
                "{roomState.currentCrossQuestion.question}"
              </div>

              <div className="text-xs text-slate-400">
                Target Debater:{' '}
                <span className={`font-bold uppercase ${roomState.currentCrossQuestion.targetSide === 'affirmative' ? 'text-blue-400' : 'text-rose-400'}`}>
                  {roomState.currentCrossQuestion.targetSide} ({roomState.currentCrossQuestion.targetUsername || 'Debater'})
                </span>
              </div>

              {/* Existing Answer Display */}
              {roomState.currentCrossQuestion.answer ? (
                <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3.5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold text-slate-200">Defense Transcript:</span>
                    {roomState.currentCrossQuestion.answer.bonusPoints !== undefined && (
                      <span className="text-emerald-400 font-bold">
                        +{roomState.currentCrossQuestion.answer.bonusPoints} pts defense bonus
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-300">
                    {roomState.currentCrossQuestion.answer.answerText}
                  </p>
                </div>
              ) : isMyCrossExam ? (
                /* Cross-Examination Defense Form */
                <form onSubmit={handleSendDefense} className="space-y-3">
                  <textarea
                    rows={3}
                    value={defenseInput}
                    onChange={(e) => setDefenseInput(e.target.value)}
                    placeholder="Formulate your empirical defense to directly dismantle the AI's inquiry..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={!defenseInput.trim()}
                      className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition flex items-center space-x-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Defense Under Cross-Examination</span>
                    </button>
                  </div>
                </form>
              ) : (
                <div className="text-xs text-slate-400 italic">
                  Awaiting defense response from {roomState.currentCrossQuestion.targetSide}...
                </div>
              )}
            </div>
          )}

          {/* ARGUMENT SUBMISSION FORM */}
          {roomState.status === 'in_progress' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-300 uppercase">
                  {isMyTurn ? 'Your Turn to Speak' : `Awaiting ${roomState.activeSpeaker}'s Argument...`}
                </span>
                <span className="text-xs text-slate-500">
                  {argumentInput.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>

              <form onSubmit={handleSendArgument} className="space-y-3">
                <textarea
                  rows={4}
                  disabled={!isMyTurn || isSubmitting}
                  value={argumentInput}
                  onChange={(e) => setArgumentInput(e.target.value)}
                  placeholder={
                    isMyTurn
                      ? 'Construct your substantive claims, empirical warrants, and rebuttal...'
                      : `Please wait for ${roomState.activeSpeaker} to submit their argument...`
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition disabled:opacity-50"
                />

                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    {isSubmitting ? (
                      <span className="text-amber-400 flex items-center space-x-1">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Broadcasting to arena...</span>
                      </span>
                    ) : (
                      <span>Idempotency token active • No duplicate submissions</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!isMyTurn || !argumentInput.trim() || isSubmitting}
                    className="px-6 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition flex items-center space-x-2"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Argument</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* TOURNAMENT / DEBATE COMPLETED VIEW */}
      {roomState?.status === 'completed' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto">
            <Award className="w-8 h-8" />
          </div>

          <div className="max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold text-white">Debate Completed</h2>
            <p className="text-sm text-slate-400">
              All {roomState.totalRounds} rounds evaluated with full Socratic cross-examination scrutiny.
            </p>
          </div>

          {/* Winner Banner */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 max-w-lg mx-auto space-y-4">
            <div className="text-xs uppercase font-bold text-amber-400 tracking-wider">
              Official Adjudication Verdict
            </div>
            <div className="text-xl font-bold text-white">
              {roomState.winner === 'draw' ? 'Debate Concluded in a Draw' : `Victory for ${roomState.winner?.toUpperCase()}`}
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {roomState.verdictSummary}
            </p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-center">
              <div>
                <div className="text-xs text-blue-400 font-bold">Affirmative</div>
                <div className="text-2xl font-bold text-white font-mono">
                  {roomState.cumulativeScores.affirmative}
                </div>
              </div>
              <div>
                <div className="text-xs text-rose-400 font-bold">Negative</div>
                <div className="text-2xl font-bold text-white font-mono">
                  {roomState.cumulativeScores.negative}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-center space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition"
            >
              Start Rematch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
