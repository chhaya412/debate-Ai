import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Swords, Flame, Cpu, Users, Layers, ShieldCheck, Sparkles, AlertCircle, Radio, X, Loader2 } from 'lucide-react';
import { MOCK_TOPICS, AI_OPPONENTS } from '../data/mockData';
import { DebateDifficulty, DebateMode, DebateTopic, DebaterProfile } from '../types/debate';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

interface DebateSetupPageProps {
  onLaunchDebate: (
    topic: DebateTopic,
    opponent: DebaterProfile,
    difficulty: DebateDifficulty,
    mode: DebateMode,
    rounds: number
  ) => void;
}

export const DebateSetupPage: React.FC<DebateSetupPageProps> = ({ onLaunchDebate }) => {
  const [selectedTopic, setSelectedTopic] = useState<DebateTopic>(MOCK_TOPICS[0]);
  const [selectedOpponent, setSelectedOpponent] = useState<DebaterProfile>(AI_OPPONENTS[0]);
  const [difficulty, setDifficulty] = useState<DebateDifficulty>('Competitive');
  const [mode, setMode] = useState<DebateMode>('Human vs AI Master');
  const [rounds, setRounds] = useState<number>(3);
  const [isMatchmaking, setIsMatchmaking] = useState<boolean>(false);
  const [matchmakingSeconds, setMatchmakingSeconds] = useState<number>(0);

  const handleStart = () => {
    if (mode === '1v1 Human') {
      setIsMatchmaking(true);
      setMatchmakingSeconds(0);

      // Trigger matchmaking API
      fetch('/api/matchmaking/queue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedTopic.category,
          difficulty,
          mode,
        }),
      }).catch(err => console.warn('Matchmaking API notice:', err));

      const timer = setInterval(() => {
        setMatchmakingSeconds(s => s + 1);
      }, 1000);

      // Match found after 3.5s
      setTimeout(() => {
        clearInterval(timer);
        setIsMatchmaking(false);
        const humanOpponent: DebaterProfile = {
          id: 'usr_contender_human',
          name: 'Sarah_Vance (Ranked Contender)',
          avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
          title: 'Oxford Union Semi-Finalist',
          elo: 1310,
          rankTier: 'Contender',
          totalDebates: 38,
          wins: 25,
          losses: 12,
          draws: 1,
          winRate: 66,
          avgScore: 82,
          streak: 3,
          debateStyle: 'Empirical Evidence-Driven',
          radarStats: {
            logic: 84,
            rebuttal: 88,
            relevance: 90,
            evidence: 76,
            persuasiveness: 82,
          },
        };
        onLaunchDebate(selectedTopic, humanOpponent, difficulty, mode, rounds);
      }, 3500);
      return;
    }

    onLaunchDebate(selectedTopic, selectedOpponent, difficulty, mode, rounds);
  };

  return (
    <div className="setup-container">
      <Card className="setup-form-card" variant="cyan">
        <div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            DEBATE PROTOCOL CONFIGURATION
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Configure match parameters, select your motion, and pair against tactical debaters.
          </p>
        </div>

        {/* 1. SELECT TOPIC */}
        <div>
          <div className="form-group-title">
            <Layers size={18} /> 1. Select Debate Motion
          </div>
          <div className="topics-selector-grid">
            {MOCK_TOPICS.map(topic => {
              const isSelected = selectedTopic.id === topic.id;
              return (
                <div
                  key={topic.id}
                  className={`topic-select-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedTopic(topic)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Badge variant={isSelected ? 'cyan' : 'default'}>{topic.category}</Badge>
                    <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-hud)', color: 'var(--text-muted)' }}>
                      {topic.difficulty}
                    </span>
                  </div>
                  <h4 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.05rem', color: isSelected ? 'var(--cyber-cyan)' : '#fff' }}>
                    {topic.title}
                  </h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                    {topic.motion}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. CHOOSE OPPONENT */}
        <div>
          <div className="form-group-title">
            <Cpu size={18} /> 2. Choose Opponent
          </div>
          <div className="opponents-row-grid">
            {AI_OPPONENTS.map(opp => {
              const isSelected = selectedOpponent.id === opp.id;
              return (
                <div
                  key={opp.id}
                  className={`opponent-select-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => setSelectedOpponent(opp)}
                >
                  <img
                    src={opp.avatar}
                    alt={opp.name}
                    style={{ width: 48, height: 48, borderRadius: '4px', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ fontWeight: 700, color: isSelected ? 'var(--crimson-red)' : '#fff' }}>
                      {opp.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {opp.title}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--electric-gold)', fontFamily: 'var(--font-hud)', fontWeight: 700, marginTop: '2px' }}>
                      ELO {opp.elo} • {opp.winRate}% Win
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. FORMAT OPTIONS: DIFFICULTY, MODE, ROUNDS */}
        <div>
          <div className="form-group-title">
            <ShieldCheck size={18} /> 3. Arena Rules & Difficulty
          </div>
          <div className="setup-options-row">
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontFamily: 'var(--font-hud)', textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Difficulty Level
              </label>
              <select
                className="input-tactical-select"
                value={difficulty}
                onChange={e => setDifficulty(e.target.value as DebateDifficulty)}
              >
                <option value="Novice">Novice (Lenient Fallacy Penalty)</option>
                <option value="Competitive">Competitive (Standard Ranked)</option>
                <option value="Grandmaster">Grandmaster (Strict Fallacy Penalty)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontFamily: 'var(--font-hud)', textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Debate Mode
              </label>
              <select
                className="input-tactical-select"
                value={mode}
                onChange={e => setMode(e.target.value as DebateMode)}
              >
                <option value="Human vs AI Master">Human vs AI Master</option>
                <option value="1v1 Human">1v1 Ranked Matchmaking</option>
                <option value="Speed Debate (Blitz)">Speed Debate (60s Blitz)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontFamily: 'var(--font-hud)', textTransform: 'uppercase', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                Number of Rounds
              </label>
              <select
                className="input-tactical-select"
                value={rounds}
                onChange={e => setRounds(Number(e.target.value))}
              >
                <option value={2}>2 Rounds (Rapid Clash)</option>
                <option value={3}>3 Rounds (Standard Policy)</option>
                <option value={4}>4 Rounds (Comprehensive Tourney)</option>
              </select>
            </div>
          </div>
        </div>

        {/* SUMMARY & SUBMIT */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block' }}>
              Side Assignment:
            </span>
            <strong style={{ color: 'var(--cyber-cyan)', fontFamily: 'var(--font-hud)', fontSize: '1rem', textTransform: 'uppercase' }}>
              Affirmative (Opening Speaker)
            </strong>
          </div>

          <Button
            size="lg"
            variant="primary"
            icon={<Swords size={20} />}
            onClick={handleStart}
          >
            {mode === '1v1 Human' ? 'ENTER 1v1 MATCHMAKING' : 'START DEBATE CLASH'}
          </Button>
        </div>
      </Card>

      {/* Live Matchmaking Overlay */}
      {isMatchmaking && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(5, 7, 15, 0.92)',
            backdropFilter: 'blur(10px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
          }}
        >
          <Card
            variant="cyan"
            style={{
              maxWidth: '460px',
              width: '100%',
              padding: '2.5rem',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.25rem',
            }}
          >
            <div
              style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                border: '2px solid var(--cyber-cyan)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                animation: 'pulse 1.5s infinite ease-in-out',
                boxShadow: '0 0 25px rgba(0, 240, 255, 0.3)',
              }}
            >
              <Radio size={32} style={{ color: 'var(--cyber-cyan)' }} />
            </div>

            <div>
              <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>
                MATCHMAKING RADAR
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '0.35rem' }}>
                Scanning active pool for a verified debater with comparable ELO rating...
              </p>
            </div>

            <div
              style={{
                background: 'var(--bg-surface-3)',
                padding: '0.75rem 1.5rem',
                borderRadius: '6px',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                gap: '1.5rem',
                fontSize: '0.85rem',
              }}
            >
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>MOTION CATEGORY</span>
                <strong>{selectedTopic.category}</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>ELAPSED</span>
                <strong style={{ color: 'var(--cyber-cyan)' }}>{matchmakingSeconds}s</strong>
              </div>
              <div>
                <span style={{ color: 'var(--text-muted)', display: 'block', fontSize: '0.75rem' }}>TIER</span>
                <strong style={{ color: 'var(--electric-gold)' }}>{difficulty}</strong>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              icon={<X size={14} />}
              onClick={() => setIsMatchmaking(false)}
            >
              Cancel Matchmaking
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
};
