import React from 'react';
import { motion } from 'motion/react';
import {
  Swords,
  BrainCircuit,
  Scale,
  Zap,
  ShieldAlert,
  BarChart3,
  Flame,
  ArrowRight,
  Sparkles,
  Trophy,
  CheckCircle,
  Radio,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { MOCK_LEADERBOARD } from '../data/mockData';

interface LandingPageProps {
  onEnterArena: () => void;
  onViewLeaderboard: () => void;
  onEnterRealtime?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onEnterArena,
  onViewLeaderboard,
  onEnterRealtime,
}) => {
  return (
    <div>
      {/* 1. HERO SECTION */}
      <section className="landing-hero">
        <motion.div
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="hero-tag"
        >
          <Sparkles size={14} />
          The Next Evolution of Competitive Discourse
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="hero-title"
        >
          CLASH OF MINDS. <br />
          <span className="hero-title-highlight">JUDGED BY MACHINE PRECISION.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="hero-subtitle"
        >
          Enter the high-stakes arena where human debaters test their logic, evidence, and rhetoric.
          Evaluated in real-time by an uncompromised AI judge dissecting fallacies, causal chains, and rebuttal depth.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="hero-actions"
        >
          <Button
            size="lg"
            variant="primary"
            icon={<Swords size={20} />}
            onClick={onEnterArena}
          >
            ENTER THE ARENA
          </Button>
          {onEnterRealtime && (
            <Button
              size="lg"
              variant="secondary"
              icon={<Radio size={18} className="text-emerald-400" />}
              onClick={onEnterRealtime}
            >
              1V1 LIVE MULTIPLAYER
            </Button>
          )}
          <Button
            size="lg"
            variant="outline"
            icon={<Trophy size={20} />}
            onClick={onViewLeaderboard}
          >
            GLOBAL RANKINGS
          </Button>
        </motion.div>

        {/* 2. AI JUDGING EXPLANATION SHOWCASE */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="ai-judge-showcase"
        >
          <div className="ai-judge-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '4px',
                  background: 'var(--ai-purple)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <BrainCircuit size={20} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, textTransform: 'uppercase' }}>
                  Synthetic Adjudicator Engine
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Multi-vector NLP Pipeline • 7 Dimensional Grading • Millisecond Latency
                </span>
              </div>
            </div>
            <Badge variant="purple">Neural Arbitrator Active</Badge>
          </div>

          <p style={{ textAlign: 'left', color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
            Unlike human debate juries affected by fatigue, rhetorical charm, or political bias, the AI Debate Arena engine measures the objective weight of arguments across formal syllogistic soundness:
          </p>

          <div className="ai-judge-metrics-grid">
            <div className="metric-pill-card">
              <span className="metric-pill-title">
                <Scale size={15} style={{ color: 'var(--cyber-cyan)' }} /> Logic & Structure
              </span>
              <span className="metric-pill-desc">Checks validity of premises, warrants, and deductive flow.</span>
            </div>
            <div className="metric-pill-card">
              <span className="metric-pill-title">
                <Zap size={15} style={{ color: 'var(--electric-gold)' }} /> Rebuttal Precision
              </span>
              <span className="metric-pill-desc">Tracks whether counter-claims neutralize opponent core premises.</span>
            </div>
            <div className="metric-pill-card">
              <span className="metric-pill-title">
                <CheckCircle size={15} style={{ color: 'var(--matrix-green)' }} /> Evidence Grounding
              </span>
              <span className="metric-pill-desc">Evaluates empirical plausibility, citations, and causal data points.</span>
            </div>
            <div className="metric-pill-card">
              <span className="metric-pill-title">
                <ShieldAlert size={15} style={{ color: 'var(--crimson-red)' }} /> Fallacy Detection
              </span>
              <span className="metric-pill-desc">Automatic deductions for Ad Hominem, Straw Man, and False Dilemmas.</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-surface-3)', padding: '0.85rem 1.25rem', borderRadius: '6px', fontSize: '0.85rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>
              ⚡ Average analysis time per round: <strong>2.1 seconds</strong>
            </span>
            <span style={{ color: 'var(--matrix-green)', fontWeight: 600 }}>
              0% Subjective Human Drift
            </span>
          </div>
        </motion.div>
      </section>

      {/* 3. FEATURE CARDS */}
      <section className="features-section">
        <div className="section-heading-box">
          <div className="section-subhead">Engineered for Dialectical Supremacy</div>
          <h2 className="section-title">BUILT FOR COMPETITIVE DEBATERS</h2>
        </div>

        <div className="feature-cards-grid">
          <Card className="feature-card" variant="cyan">
            <div className="feature-icon-wrapper">
              <Swords size={24} />
            </div>
            <h3 className="feature-card-title">Synchronized Turn Timers</h3>
            <p className="feature-card-text">
              Strict round rules enforce opening statements, direct rebuttals, cross-examinations, and summaries. Server-authoritative clocks eliminate turn stalling.
            </p>
          </Card>

          <Card className="feature-card">
            <div className="feature-icon-wrapper" style={{ color: 'var(--crimson-red)' }}>
              <ShieldAlert size={24} />
            </div>
            <h3 className="feature-card-title">Real-Time Fallacy Traps</h3>
            <p className="feature-card-text">
              Inline syntax markers highlight rhetorical errors on the fly. Fallacies reduce your round score and hand initiative directly to your opponent.
            </p>
          </Card>

          <Card className="feature-card" variant="cyan">
            <div className="feature-icon-wrapper" style={{ color: 'var(--electric-gold)' }}>
              <BrainCircuit size={24} />
            </div>
            <h3 className="feature-card-title">Dynamic AI Cross-Examination</h3>
            <p className="feature-card-text">
              Between rounds, the AI Judge formulates bespoke follow-up questions challenging your weakest assertions, testing your adaptability under fire.
            </p>
          </Card>

          <Card className="feature-card">
            <div className="feature-icon-wrapper" style={{ color: 'var(--matrix-green)' }}>
              <BarChart3 size={24} />
            </div>
            <h3 className="feature-card-title">Post-Match Dossier & Radars</h3>
            <p className="feature-card-text">
              Download comprehensive transcripts, multi-axis skill radars, line-by-line strengths and weaknesses, and personalized drills to sharpen your reasoning.
            </p>
          </Card>

          <Card className="feature-card">
            <div className="feature-icon-wrapper" style={{ color: 'var(--ai-purple)' }}>
              <Flame size={24} />
            </div>
            <h3 className="feature-card-title">Skill-Weighted Elo Ranking</h3>
            <p className="feature-card-text">
              Climb from Novice to Philosopher. Elo calculations combine match victory margins with raw argument quality metrics to reward substance over rhetoric.
            </p>
          </Card>

          <Card className="feature-card">
            <div className="feature-icon-wrapper" style={{ color: 'var(--cyber-cyan)' }}>
              <Trophy size={24} />
            </div>
            <h3 className="feature-card-title">Diverse Topic Pool</h3>
            <p className="feature-card-text">
              Clash on cutting-edge topics in Artificial Intelligence ethics, international geopolitics, bioengineering, macroeconomic policy, and space exploration.
            </p>
          </Card>
        </div>
      </section>

      {/* 4. HOW IT WORKS SECTION */}
      <section className="features-section" style={{ background: 'var(--bg-surface-1)', padding: '5rem 1.5rem', borderRadius: '12px', border: '1px solid var(--border-subtle)' }}>
        <div className="section-heading-box">
          <div className="section-subhead">Match Progression Flow</div>
          <h2 className="section-title">HOW A DEBATE UNFOLDS</h2>
        </div>

        <div className="how-it-works-grid">
          <Card className="step-card">
            <div className="step-number">01</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              Select Motion & Stance
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Choose from curated competitive topics or custom motions. Draw either Affirmative or Negative side and configure rounds.
            </p>
          </Card>

          <Card className="step-card">
            <div className="step-number">02</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              Clash in Timed Rounds
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Deliver statements within the 120s countdown. Direct your points at opponent assertions while citing evidence and warrants.
            </p>
          </Card>

          <Card className="step-card">
            <div className="step-number">03</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              AI Instant Adjudication
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              The AI Judge computes logic, evidence, and rebuttal scores, flags logical fallacies, and injects cross-examination queries.
            </p>
          </Card>

          <Card className="step-card">
            <div className="step-number">04</div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, marginBottom: '0.75rem', textTransform: 'uppercase' }}>
              Verdict & Elo Update
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              The overall champion is crowned with points tallied. Elo rankings recalculate instantly and detailed feedback is archived.
            </p>
          </Card>
        </div>
      </section>

      {/* 5. LEADERBOARD PREVIEW */}
      <section className="features-section" style={{ marginTop: '5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div className="section-subhead">Top Dialecticians</div>
            <h2 className="section-title" style={{ fontSize: '1.8rem' }}>APEX LEADERBOARD</h2>
          </div>
          <Button variant="outline" icon={<ArrowRight size={16} />} onClick={onViewLeaderboard}>
            View Full Leaderboard
          </Button>
        </div>

        <Card className="leaderboard-table-card">
          <table className="match-history-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Debater</th>
                <th>Tier</th>
                <th>ELO Rating</th>
                <th>Win Rate</th>
                <th>Style</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_LEADERBOARD.slice(0, 4).map(entry => (
                <tr key={entry.user.id}>
                  <td className="rank-number-cell" style={{ color: entry.rank === 1 ? 'var(--electric-gold)' : entry.rank === 2 ? 'var(--cyber-cyan)' : '#fff' }}>
                    #{entry.rank}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img
                        src={entry.user.avatar}
                        alt={entry.user.name}
                        style={{ width: 34, height: 34, borderRadius: '4px', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{entry.user.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{entry.user.title}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge variant={entry.user.rankTier === 'Philosopher' ? 'gold' : 'cyan'}>
                      {entry.user.rankTier}
                    </Badge>
                  </td>
                  <td>
                    <strong style={{ color: 'var(--electric-gold)', fontFamily: 'var(--font-hud)', fontSize: '1.1rem' }}>
                      {entry.user.elo}
                    </strong>
                  </td>
                  <td>
                    <span style={{ color: 'var(--matrix-green)', fontWeight: 600 }}>{entry.user.winRate}%</span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {entry.user.debateStyle}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>
    </div>
  );
};
