import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Trophy,
  Swords,
  Flame,
  Target,
  BarChart,
  Shield,
  Clock,
  ArrowUpRight,
  Sparkles,
  Compass,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { CURRENT_USER, RECENT_MATCHES } from '../data/mockData';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ProgressBar } from '../components/common/ProgressBar';
import { PersonalityClientService } from '../services/personalityClientService';
import { DebatePersonalityProfile } from '../types/personality';
import { AchievementsGrid } from '../components/dashboard/AchievementsGrid';

interface DashboardPageProps {
  onStartDebate: () => void;
  onViewMatchDetails: (matchId: string) => void;
  onViewPersonality?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onStartDebate,
  onViewMatchDetails,
  onViewPersonality,
}) => {
  const [personality, setPersonality] = useState<DebatePersonalityProfile | null>(null);

  useEffect(() => {
    PersonalityClientService.getPersonality(CURRENT_USER.id)
      .then(setPersonality)
      .catch((err) => console.warn('Could not load personality in dashboard:', err));
  }, []);
  return (
    <div className="dashboard-container">
      {/* Profile Banner */}
      <Card className="dashboard-hero-card" variant="cyan">
        <div className="debater-profile-meta">
          <img
            src={CURRENT_USER.avatar}
            alt={CURRENT_USER.name}
            className="profile-avatar-lg"
          />
          <div className="profile-titles">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <Badge variant="cyan">{CURRENT_USER.rankTier}</Badge>
              <Badge variant="gold" icon={<Flame size={12} />}>
                {CURRENT_USER.streak} Match Streak
              </Badge>
            </div>
            <h2>{CURRENT_USER.name}</h2>
            <p>
              <span>{CURRENT_USER.title}</span> • 
              <span style={{ color: 'var(--electric-gold)', fontWeight: 600 }}>ELO {CURRENT_USER.elo}</span>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {onViewPersonality && (
            <Button
              variant="outline"
              icon={<Sparkles size={16} />}
              onClick={onViewPersonality}
            >
              Debate Personality
            </Button>
          )}
          <Button variant="primary" icon={<Swords size={18} />} onClick={onStartDebate}>
            Start New Debate
          </Button>
        </div>
      </Card>

      {/* User Statistics Counters */}
      <div className="stat-counters-row">
        <Card className="stat-counter-box">
          <span className="stat-label">Total Debates</span>
          <div className="stat-value-large">{CURRENT_USER.totalDebates}</div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Career engagements
          </span>
        </Card>

        <Card className="stat-counter-box">
          <span className="stat-label">Victories & Win Rate</span>
          <div className="stat-value-large" style={{ color: 'var(--matrix-green)' }}>
            {CURRENT_USER.wins} <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>({CURRENT_USER.winRate}%)</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {CURRENT_USER.losses} Losses • {CURRENT_USER.draws} Draws
          </span>
        </Card>

        <Card className="stat-counter-box">
          <span className="stat-label">Average AI Score</span>
          <div className="stat-value-large" style={{ color: 'var(--cyber-cyan)' }}>
            {CURRENT_USER.avgScore} <span style={{ fontSize: '1.1rem', color: 'var(--text-muted)' }}>/ 100</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Across all rounds
          </span>
        </Card>

        <Card
          className="stat-counter-box"
          style={{ cursor: onViewPersonality ? 'pointer' : 'default' }}
          onClick={onViewPersonality}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">Debate Personality</span>
            <Sparkles size={14} color="var(--cyber-cyan)" />
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--electric-gold)', marginTop: '0.25rem' }}>
            {personality?.archetype || 'The Counter-Attacker'}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--cyber-cyan)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            View 8-Vector Radar <ArrowRight size={12} />
          </span>
        </Card>
      </div>

      {/* Debate Personality Spotlight Banner */}
      {personality && (
        <Card
          style={{
            padding: '1.5rem 1.75rem',
            background: 'linear-gradient(90deg, rgba(22, 28, 40, 0.95) 0%, rgba(13, 27, 42, 0.9) 100%)',
            border: '1px solid var(--border-focus)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
            boxShadow: '0 4px 20px rgba(0, 240, 255, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '10px',
                background: 'var(--bg-surface-3)',
                border: '1px solid var(--border-focus)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldAlert size={26} color="var(--cyber-cyan)" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.15rem', color: '#fff' }}>
                  Debate Personality: {personality.archetype}
                </span>
                <Badge variant="gold">Analyzed</Badge>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '640px' }}>
                "{personality.archetypeTagline}" — Logic {personality.traits.logic} • Rebuttal {personality.traits.rebuttal} • Consistency {personality.traits.consistency}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '180px', textAlign: 'right' }}>
              Non-scientific performance heuristic
            </span>
            {onViewPersonality && (
              <Button
                variant="primary"
                size="sm"
                onClick={onViewPersonality}
                icon={<ArrowRight size={14} />}
              >
                Open Matrix
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Split Grid: Recent Matches and Radar Breakdown */}
      <div className="dashboard-split-grid">
        {/* Recent Matches */}
        <Card style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, textTransform: 'uppercase' }}>
              Recent Matches
            </h3>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Last 3 Competitions
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {RECENT_MATCHES.map(match => (
              <div
                key={match.id}
                style={{
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '6px',
                  padding: '1.15rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>
                    {match.topic}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.75rem' }}>
                    <span>vs {match.opponent}</span>
                    <span>• {match.date}</span>
                    <span>• {match.fallaciesCommitted === 0 ? '0 Fallacies (Clean)' : `${match.fallaciesCommitted} Fallacies`}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-hud)', fontWeight: 700, fontSize: '1.05rem', color: '#fff' }}>
                      {match.score}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: match.result === 'VICTORY' ? 'var(--matrix-green)' : 'var(--crimson-red)', fontWeight: 700 }}>
                      {match.result} ({match.eloDelta})
                    </div>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewMatchDetails(match.id)}
                  >
                    Details
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Skill Vector Breakdown */}
        <Card style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, textTransform: 'uppercase' }}>
              Skill Vectors
            </h3>
            <Badge variant="cyan">AI Assessed</Badge>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <ProgressBar
              label="Logic & Structural Validity"
              value={CURRENT_USER.radarStats.logic}
              max={100}
              color="cyan"
            />
            <ProgressBar
              label="Rebuttal Quality & Directness"
              value={CURRENT_USER.radarStats.rebuttal}
              max={100}
              color="cyan"
            />
            <ProgressBar
              label="Relevance to Motion"
              value={CURRENT_USER.radarStats.relevance}
              max={100}
              color="cyan"
            />
            <ProgressBar
              label="Evidence & Empirical Grounding"
              value={CURRENT_USER.radarStats.evidence}
              max={100}
              color="cyan"
            />
            <ProgressBar
              label="Persuasiveness & Tone"
              value={CURRENT_USER.radarStats.persuasiveness}
              max={100}
              color="cyan"
            />
          </div>

          <div style={{ background: 'var(--bg-surface-2)', padding: '1rem', borderRadius: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--cyber-cyan)' }}>
            <strong>AI Coach Feedback:</strong> Your logic and rebuttal scores rank in the 98th percentile. Raising empirical citation density by citing specific statistical datasets will unlock the <em>Philosopher</em> rank tier.
          </div>

          {onViewPersonality && (
            <Button
              variant="outline"
              size="sm"
              icon={<Sparkles size={14} />}
              onClick={onViewPersonality}
              style={{ width: '100%' }}
            >
              Explore Full 8-Vector Personality Radar
            </Button>
          )}
        </Card>
      </div>

      {/* Debater Achievements & Milestones */}
      <AchievementsGrid userId={CURRENT_USER.id} />
    </div>
  );
};
