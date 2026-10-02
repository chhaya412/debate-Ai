import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScreenType, Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { DashboardPage } from './pages/DashboardPage';
import { DebateSetupPage } from './pages/DebateSetupPage';
import { DebateArenaPage } from './pages/DebateArenaPage';
import { ResultsPage } from './pages/ResultsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { DebatePersonalityPage } from './pages/DebatePersonalityPage';
import { NextDebateArenaClient } from './components/realtime/NextDebateArenaClient';
import { ActiveDebateState, DebateDifficulty, DebateMode, DebateTopic, DebaterProfile, MatchResult } from './types/debate';
import { CURRENT_USER, MOCK_TOPICS, AI_OPPONENTS, INITIAL_TRANSCRIPT, MOCK_RESULT } from './data/mockData';
import { DebateService } from './services/debateService';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('landing');

  // Active debate session state
  const [debateState, setDebateState] = useState<ActiveDebateState>({
    id: 'match_88492',
    topic: MOCK_TOPICS[0],
    mode: 'Human vs AI Master',
    difficulty: 'Grandmaster',
    totalRounds: 3,
    currentRound: 2,
    activeSpeakerSide: 'affirmative',
    secondsRemaining: 88,
    turnDuration: 120,
    status: 'in_progress',
    playerA: CURRENT_USER,
    playerB: AI_OPPONENTS[0],
    transcript: [...INITIAL_TRANSCRIPT],
    isAiAnalyzing: false,
  });

  // Compiled match result for the Results page
  const [matchResult, setMatchResult] = useState<MatchResult>(MOCK_RESULT);

  // Handlers
  const handleLaunchDebate = async (
    topic: DebateTopic,
    opponent: DebaterProfile,
    difficulty: DebateDifficulty,
    mode: DebateMode,
    rounds: number
  ) => {
    const session = await DebateService.createDebateSession(
      topic,
      opponent.id,
      difficulty,
      mode,
      rounds
    );
    setDebateState(session);
    setCurrentScreen('arena');
  };

  const handleFinishDebate = async () => {
    const verdict = await DebateService.compileVerdict(debateState);
    setMatchResult(verdict);
    setCurrentScreen('results');
  };

  const handleReplayDebate = () => {
    setDebateState(prev => ({
      ...prev,
      currentRound: 1,
      secondsRemaining: prev.turnDuration,
      activeSpeakerSide: 'affirmative',
      transcript: [...INITIAL_TRANSCRIPT.slice(0, 1)],
    }));
    setCurrentScreen('arena');
  };

  return (
    <div className="arena-app-container">
      {/* Navigation Header */}
      <Navbar
        currentScreen={currentScreen}
        onNavigate={screen => setCurrentScreen(screen)}
        activeMatchActive={debateState.status === 'in_progress'}
      />

      {/* Main Screen Router with Framer Motion Screen Transitions */}
      <main style={{ flex: 1 }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentScreen}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
          >
            {currentScreen === 'landing' && (
              <LandingPage
                onEnterArena={() => setCurrentScreen('setup')}
                onViewLeaderboard={() => setCurrentScreen('leaderboard')}
                onEnterRealtime={() => setCurrentScreen('realtime')}
              />
            )}

            {currentScreen === 'dashboard' && (
              <DashboardPage
                onStartDebate={() => setCurrentScreen('setup')}
                onViewMatchDetails={_matchId => setCurrentScreen('results')}
                onViewPersonality={() => setCurrentScreen('personality')}
              />
            )}

            {currentScreen === 'personality' && (
              <DebatePersonalityPage
                onStartDebate={() => setCurrentScreen('setup')}
                onNavigateToDashboard={() => setCurrentScreen('dashboard')}
              />
            )}

            {currentScreen === 'setup' && (
              <DebateSetupPage
                onLaunchDebate={handleLaunchDebate}
              />
            )}

            {currentScreen === 'realtime' && (
              <NextDebateArenaClient
                onExit={() => setCurrentScreen('dashboard')}
              />
            )}

            {currentScreen === 'arena' && (
              <DebateArenaPage
                debateState={debateState}
                onUpdateDebateState={setDebateState}
                onFinishDebate={handleFinishDebate}
              />
            )}

            {currentScreen === 'results' && (
              <ResultsPage
                result={matchResult}
                onReplayDebate={handleReplayDebate}
                onNewDebate={() => setCurrentScreen('setup')}
                onViewPersonality={() => setCurrentScreen('personality')}
              />
            )}

            {currentScreen === 'leaderboard' && (
              <LeaderboardPage
                onChallengeDebater={_id => setCurrentScreen('setup')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* HUD Telemetry Footer */}
      <Footer />
    </div>
  );
}
