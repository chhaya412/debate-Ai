import React from 'react';
import { Gauge, Clock, MessageSquare, Mic, AlertCircle, Info, Sparkles } from 'lucide-react';
import { SpeechMetrics } from '../../types/voice';
import { Badge } from '../common/Badge';

interface SpeechMetricsCardProps {
  metrics: SpeechMetrics;
  compact?: boolean;
}

export const SpeechMetricsCard: React.FC<SpeechMetricsCardProps> = ({ metrics, compact = false }) => {
  const getSpeedVariant = (rating: SpeechMetrics['speedRating']): 'cyan' | 'gold' | 'default' | 'danger' => {
    switch (rating) {
      case 'Optimal Cadence':
        return 'cyan';
      case 'Deliberate & Measured':
      case 'Brisk':
        return 'gold';
      default:
        return 'default';
    }
  };

  const getClarityVariant = (score: number): 'cyan' | 'gold' | 'default' | 'danger' => {
    if (score >= 85) return 'cyan';
    if (score >= 70) return 'gold';
    return 'default';
  };

  return (
    <div
      style={{
        background: 'var(--bg-surface-2)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '8px',
        padding: compact ? '0.85rem 1rem' : '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.9rem',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Mic size={16} color="var(--cyber-cyan)" />
          <span
            style={{
              fontFamily: 'var(--font-hud)',
              fontSize: '0.85rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: '#fff',
            }}
          >
            Acoustic Delivery Analysis
          </span>
        </div>
        <Badge variant={getClarityVariant(metrics.clarityScore)}>
          Clarity: {metrics.clarityScore}/100
        </Badge>
      </div>

      {/* 4 Core Speech Characteristic Pillars */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: compact ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '0.65rem',
        }}
      >
        {/* 1. Speaking Speed */}
        <div
          style={{
            background: 'var(--bg-surface-3)',
            padding: '0.65rem 0.75rem',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
            <Gauge size={13} />
            <span>Speaking Speed</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--cyber-cyan)' }}>
            {metrics.speakingSpeedWpm} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>WPM</span>
          </div>
          <div style={{ marginTop: '0.25rem' }}>
            <Badge variant={getSpeedVariant(metrics.speedRating)}>
              {metrics.speedRating}
            </Badge>
          </div>
        </div>

        {/* 2. Pacing & Pauses */}
        <div
          style={{
            background: 'var(--bg-surface-3)',
            padding: '0.65rem 0.75rem',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
            <Clock size={13} />
            <span>Pauses & Pacing</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
            {metrics.pauseCount} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>pauses</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            Avg {metrics.averagePauseDurationSeconds}s • {metrics.pauseRating}
          </div>
        </div>

        {/* 3. Filler Words */}
        <div
          style={{
            background: 'var(--bg-surface-3)',
            padding: '0.65rem 0.75rem',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
            <MessageSquare size={13} />
            <span>Filler Words</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: metrics.fillerWordsCount === 0 ? 'var(--cyber-cyan)' : 'var(--electric-gold)' }}>
            {metrics.fillerWordsCount} <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>({metrics.fillerWordsRatio}%)</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
            {metrics.fillerWordsCount === 0 ? 'Zero Hesitation Words' : `${metrics.fillerWordsDetected.slice(0, 2).map(f => `"${f.word}" (${f.count})`).join(', ')}`}
          </div>
        </div>

        {/* 4. Articulation & Clarity */}
        <div
          style={{
            background: 'var(--bg-surface-3)',
            padding: '0.65rem 0.75rem',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.25rem' }}>
            <Sparkles size={13} />
            <span>Speech Clarity</span>
          </div>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: '#fff' }}>
            {metrics.clarityScore}<span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>/100</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--cyber-cyan)', marginTop: '0.25rem' }}>
            {metrics.clarityRating}
          </div>
        </div>
      </div>

      {/* Rhetorical Pacing Feedback */}
      {metrics.pacingFeedback && !compact && (
        <div
          style={{
            background: 'rgba(0, 240, 255, 0.05)',
            borderLeft: '3px solid var(--cyber-cyan)',
            padding: '0.6rem 0.85rem',
            borderRadius: '0 4px 4px 0',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
          }}
        >
          <strong style={{ color: '#fff' }}>Delivery Observation: </strong>
          {metrics.pacingFeedback}
        </div>
      )}

      {/* Crucial Ethical / Scientific Disclaimer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '0.5rem',
          padding: '0.5rem 0.75rem',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: '4px',
          border: '1px dashed rgba(255, 255, 255, 0.12)',
        }}
      >
        <Info size={13} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <span
          style={{
            fontSize: '0.72rem',
            color: 'var(--text-muted)',
            lineHeight: 1.45,
          }}
        >
          {metrics.disclaimer}
        </span>
      </div>
    </div>
  );
};
