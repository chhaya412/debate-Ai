import React from 'react';
import { motion } from 'motion/react';
import {
  Trophy,
  RotateCcw,
  Swords,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  BrainCircuit,
  TrendingUp,
  Download,
  Sparkles,
} from 'lucide-react';
import { MatchResult } from '../types/debate';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ProgressBar } from '../components/common/ProgressBar';

interface ResultsPageProps {
  result: MatchResult;
  onReplayDebate: () => void;
  onNewDebate: () => void;
  onViewPersonality?: () => void;
}

export const ResultsPage: React.FC<ResultsPageProps> = ({
  result,
  onReplayDebate,
  onNewDebate,
  onViewPersonality,
}) => {
  const isWinnerA = result.winnerId === result.playerA.id;

  return (
    <div className="results-container">
      {/* 1. WINNER BANNER & CLASH SCORE HEADER */}
      <Card className="winner-banner-card" variant="cyan">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Trophy size={64} className="trophy-icon-hero" />
        </motion.div>

        <Badge variant={isWinnerA ? 'cyan' : 'crimson'} style={{ marginBottom: '0.75rem' }}>
          OFFICIAL VERDICT ADJUDICATED
        </Badge>

        <h1 className="winner-hero-title">
          {result.winnerName} WINS
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 650, margin: '0 auto 1.5rem' }}>
          Motion: "{result.topic.motion}"
        </p>

        {/* Score Clash Box */}
        <div className="score-tally-clash">
          <div className="clash-player">
            <span style={{ fontSize: '1rem', color: 'var(--cyber-cyan)', fontWeight: 700 }}>
              {result.playerA.name} (AFF)
            </span>
            <div className="clash-score-big clash-score-cyan">{result.scoreA}</div>
            <span style={{ fontSize: '0.85rem', color: 'var(--matrix-green)' }}>
              ELO {result.eloChangeA >= 0 ? `+${result.eloChangeA}` : result.eloChangeA}
            </span>
          </div>

          <div style={{ fontSize: '2rem', color: 'var(--text-muted)', fontWeight: 700 }}>VS</div>

          <div className="clash-player">
            <span style={{ fontSize: '1rem', color: 'var(--crimson-red)', fontWeight: 700 }}>
              {result.playerB.name} (NEG)
            </span>
            <div className="clash-score-big clash-score-crimson">{result.scoreB}</div>
            <span style={{ fontSize: '0.85rem', color: 'var(--crimson-red)' }}>
              ELO {result.eloChangeB >= 0 ? `+${result.eloChangeB}` : result.eloChangeB}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
          <Button variant="primary" icon={<RotateCcw size={18} />} onClick={onReplayDebate}>
            Replay Debate
          </Button>
          <Button variant="outline" icon={<Swords size={18} />} onClick={onNewDebate}>
            New Debate Clash
          </Button>
          {onViewPersonality && (
            <Button variant="secondary" icon={<Sparkles size={18} />} onClick={onViewPersonality}>
              View Personality Radar
            </Button>
          )}
        </div>
      </Card>

      {/* 2. AI SYNTHESIZED VERDICT & EXPLANATION */}
      <Card style={{ padding: '2rem', borderLeft: '4px solid var(--ai-purple)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
          <BrainCircuit size={22} style={{ color: 'var(--ai-purple)' }} />
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700, textTransform: 'uppercase' }}>
            AI Chief Adjudicator Evaluation
          </h2>
        </div>
        <p style={{ fontSize: '1.05rem', lineHeight: 1.7, color: 'var(--text-primary)' }}>
          {result.verdictExplanation}
        </p>
      </Card>

      {/* 3. CATEGORY-WISE SCORES BREAKDOWN */}
      <div className="results-analysis-grid">
        <Card className="analysis-section-card" variant="cyan">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--cyber-cyan)' }}>
              {result.playerA.name} Score Matrix
            </h3>
            <Badge variant="cyan">Total: {result.scoreA}</Badge>
          </div>

          <div className="score-bars-list">
            <ProgressBar label="Logic & Deduction" value={result.categoryScoresA.logic} max={60} color="cyan" />
            <ProgressBar label="Relevance to Motion" value={result.categoryScoresA.relevance} max={45} color="cyan" />
            <ProgressBar label="Empirical Evidence" value={result.categoryScoresA.evidence} max={45} color="cyan" />
            <ProgressBar label="Direct Rebuttal" value={result.categoryScoresA.rebuttal} max={60} color="cyan" />
            <ProgressBar label="Persuasiveness" value={result.categoryScoresA.persuasiveness} max={45} color="cyan" />
            <ProgressBar label="Format & Decorum" value={result.categoryScoresA.ruleAdherence} max={45} color="cyan" />
          </div>

          {result.categoryScoresA.fallacyDeductions < 0 && (
            <div style={{ background: 'var(--bg-surface-2)', padding: '0.75rem', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--crimson-red)', fontWeight: 600 }}>
              ⚠️ Penalty Deductions: {result.categoryScoresA.fallacyDeductions} points
            </div>
          )}
        </Card>

        <Card className="analysis-section-card" variant="crimson">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--crimson-red)' }}>
              {result.playerB.name} Score Matrix
            </h3>
            <Badge variant="crimson">Total: {result.scoreB}</Badge>
          </div>

          <div className="score-bars-list">
            <ProgressBar label="Logic & Deduction" value={result.categoryScoresB.logic} max={60} color="crimson" />
            <ProgressBar label="Relevance to Motion" value={result.categoryScoresB.relevance} max={45} color="crimson" />
            <ProgressBar label="Empirical Evidence" value={result.categoryScoresB.evidence} max={45} color="crimson" />
            <ProgressBar label="Direct Rebuttal" value={result.categoryScoresB.rebuttal} max={60} color="crimson" />
            <ProgressBar label="Persuasiveness" value={result.categoryScoresB.persuasiveness} max={45} color="crimson" />
            <ProgressBar label="Format & Decorum" value={result.categoryScoresB.ruleAdherence} max={45} color="crimson" />
          </div>

          {result.categoryScoresB.fallacyDeductions < 0 && (
            <div style={{ background: 'var(--bg-surface-2)', padding: '0.75rem', borderRadius: '4px', fontSize: '0.85rem', color: 'var(--crimson-red)', fontWeight: 600 }}>
              ⚠️ Penalty Deductions: {result.categoryScoresB.fallacyDeductions} points
            </div>
          )}
        </Card>
      </div>

      {/* 4. STRENGTHS & WEAKNESSES */}
      <div className="results-analysis-grid">
        <Card className="analysis-section-card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, textTransform: 'uppercase' }}>
            Strengths Identified
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {result.strengthsA.map((str, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.6rem', fontSize: '0.9rem' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--matrix-green)', flexShrink: 0, marginTop: '3px' }} />
                <span><strong>{result.playerA.name}:</strong> {str}</span>
              </div>
            ))}
            {result.strengthsB.map((str, idx) => (
              <div key={`b_${idx}`} style={{ display: 'flex', gap: '0.6rem', fontSize: '0.9rem' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--matrix-green)', flexShrink: 0, marginTop: '3px' }} />
                <span><strong>{result.playerB.name}:</strong> {str}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="analysis-section-card">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, textTransform: 'uppercase' }}>
            Critical Weaknesses & Vulnerabilities
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {result.weaknessesA.map((weak, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.6rem', fontSize: '0.9rem' }}>
                <XCircle size={16} style={{ color: 'var(--crimson-red)', flexShrink: 0, marginTop: '3px' }} />
                <span><strong>{result.playerA.name}:</strong> {weak}</span>
              </div>
            ))}
            {result.weaknessesB.map((weak, idx) => (
              <div key={`bw_${idx}`} style={{ display: 'flex', gap: '0.6rem', fontSize: '0.9rem' }}>
                <XCircle size={16} style={{ color: 'var(--crimson-red)', flexShrink: 0, marginTop: '3px' }} />
                <span><strong>{result.playerB.name}:</strong> {weak}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* 5. LOGICAL FALLACIES AUDIT */}
      <Card style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
          <AlertTriangle size={20} style={{ color: 'var(--crimson-red)' }} />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, textTransform: 'uppercase' }}>
            Logical Fallacies Dissected
          </h3>
        </div>

        <div className="fallacies-detected-box">
          {result.allFallaciesA.map(f => (
            <div key={f.id} className="fallacy-item-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: 'var(--cyber-cyan)' }}>
                  {result.playerA.name} • {f.name}
                </strong>
                <Badge variant="crimson">-{f.deduction} pts</Badge>
              </div>
              <div className="fallacy-quote">"{f.quote}"</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{f.explanation}</div>
            </div>
          ))}

          {result.allFallaciesB.map(f => (
            <div key={f.id} className="fallacy-item-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong style={{ color: 'var(--crimson-red)' }}>
                  {result.playerB.name} • {f.name}
                </strong>
                <Badge variant="crimson">-{f.deduction} pts</Badge>
              </div>
              <div className="fallacy-quote">"{f.quote}"</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{f.explanation}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
