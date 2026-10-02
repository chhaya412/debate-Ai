import React, { useState } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip,
  Legend,
} from 'recharts';
import { PersonalityTraits } from '../../types/personality';
import { Button } from '../common/Button';
import { Shield, Sparkles, Trophy } from 'lucide-react';

interface PersonalityRadarChartProps {
  traits: PersonalityTraits;
  userName?: string;
  archetypeName?: string;
}

export const PersonalityRadarChart: React.FC<PersonalityRadarChartProps> = ({
  traits,
  userName = 'You',
  archetypeName,
}) => {
  const [benchmark, setBenchmark] = useState<'grandmaster' | 'arenaAverage' | 'none'>('grandmaster');

  // Benchmark datasets
  const benchmarks = {
    grandmaster: {
      logic: 94,
      rebuttal: 91,
      evidence: 89,
      persuasiveness: 92,
      aggressiveness: 82,
      consistency: 95,
      emotionalAppeal: 74,
      riskTaking: 86,
    },
    arenaAverage: {
      logic: 70,
      rebuttal: 68,
      evidence: 64,
      persuasiveness: 72,
      aggressiveness: 66,
      consistency: 68,
      emotionalAppeal: 58,
      riskTaking: 62,
    },
  };

  const chartData = [
    {
      trait: 'Logic',
      fullName: 'Logic & Syllogism',
      user: traits.logic,
      benchmark: benchmark !== 'none' ? benchmarks[benchmark].logic : undefined,
      description: 'Deductive validity, premise structuring, and avoidance of logical fallacies.',
    },
    {
      trait: 'Rebuttal',
      fullName: 'Rebuttal & Refutation',
      user: traits.rebuttal,
      benchmark: benchmark !== 'none' ? benchmarks[benchmark].rebuttal : undefined,
      description: 'Counter-argument directness, speed of refutation, and vulnerability targeting.',
    },
    {
      trait: 'Evidence',
      fullName: 'Evidence & Empirical Data',
      user: traits.evidence,
      benchmark: benchmark !== 'none' ? benchmarks[benchmark].evidence : undefined,
      description: 'Empirical citations, statistical density, and verifiable case examples.',
    },
    {
      trait: 'Persuasiveness',
      fullName: 'Persuasiveness & Tone',
      user: traits.persuasiveness,
      benchmark: benchmark !== 'none' ? benchmarks[benchmark].persuasiveness : undefined,
      description: 'Rhetorical impact, framing strength, and resonance with adjudicators.',
    },
    {
      trait: 'Aggressiveness',
      fullName: 'Aggressiveness & Pace',
      user: traits.aggressiveness,
      benchmark: benchmark !== 'none' ? benchmarks[benchmark].aggressiveness : undefined,
      description: 'Tempo dominance, proactive challenge frequency, and cross-exam intensity.',
    },
    {
      trait: 'Consistency',
      fullName: 'Consistency & Variance',
      user: traits.consistency,
      benchmark: benchmark !== 'none' ? benchmarks[benchmark].consistency : undefined,
      description: 'Steady round-to-round scoring stability without sudden momentum drops.',
    },
    {
      trait: 'Emotional Appeal',
      fullName: 'Emotional Appeal (Pathos)',
      user: traits.emotionalAppeal,
      benchmark: benchmark !== 'none' ? benchmarks[benchmark].emotionalAppeal : undefined,
      description: 'Moral urgency, human stake framing, and evocative storytelling.',
    },
    {
      trait: 'Risk Taking',
      fullName: 'Risk Taking & Gambits',
      user: traits.riskTaking,
      benchmark: benchmark !== 'none' ? benchmarks[benchmark].riskTaking : undefined,
      description: 'Audacious counter-theses, calculated tactical concessions, and unorthodox arguments.',
    },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div
          style={{
            background: 'var(--bg-surface-3, #161c28)',
            border: '1px solid var(--border-focus, #00f0ff)',
            borderRadius: '6px',
            padding: '0.75rem 1rem',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.6)',
            maxWidth: '260px',
            zIndex: 100,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', marginBottom: '0.25rem' }}>
            {data.fullName}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary, #94a3b8)', marginBottom: '0.5rem', lineHeight: 1.4 }}>
            {data.description}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.2rem' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--cyber-cyan, #00f0ff)', fontWeight: 600 }}>
              {userName}:
            </span>
            <span style={{ fontFamily: 'var(--font-hud, monospace)', fontWeight: 700, color: '#fff' }}>
              {data.user} / 100
            </span>
          </div>
          {benchmark !== 'none' && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--electric-gold, #ffb700)', fontWeight: 600 }}>
                {benchmark === 'grandmaster' ? 'Grandmaster' : 'Arena Avg'}:
              </span>
              <span style={{ fontFamily: 'var(--font-hud, monospace)', fontWeight: 700, color: 'var(--electric-gold, #ffb700)' }}>
                {data.benchmark} / 100
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
      {/* Benchmark Filter Controls */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '0.75rem',
        }}
      >
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted, #64748b)' }}>
          Compare vector with competitive benchmarks:
        </div>

        <div style={{ display: 'flex', gap: '0.35rem' }}>
          <Button
            size="sm"
            variant={benchmark === 'grandmaster' ? 'primary' : 'outline'}
            onClick={() => setBenchmark('grandmaster')}
            icon={<Trophy size={13} />}
          >
            Grandmaster
          </Button>
          <Button
            size="sm"
            variant={benchmark === 'arenaAverage' ? 'primary' : 'outline'}
            onClick={() => setBenchmark('arenaAverage')}
            icon={<Shield size={13} />}
          >
            Arena Avg
          </Button>
          <Button
            size="sm"
            variant={benchmark === 'none' ? 'primary' : 'outline'}
            onClick={() => setBenchmark('none')}
          >
            Solo
          </Button>
        </div>
      </div>

      {/* Radar Chart Container */}
      <div style={{ width: '100%', height: 380, position: 'relative' }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="72%" data={chartData}>
            <PolarGrid stroke="rgba(255, 255, 255, 0.12)" strokeDasharray="3 3" />
            <PolarAngleAxis
              dataKey="trait"
              tick={{
                fill: '#94a3b8',
                fontSize: 12,
                fontFamily: 'var(--font-display, sans-serif)',
                fontWeight: 600,
              }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: '#64748b', fontSize: 10 }}
              stroke="rgba(255, 255, 255, 0.08)"
            />

            {/* Benchmark Radar */}
            {benchmark !== 'none' && (
              <Radar
                name={benchmark === 'grandmaster' ? 'Grandmaster Benchmark' : 'Arena Average'}
                dataKey="benchmark"
                stroke="#ffb700"
                fill="#ffb700"
                fillOpacity={0.15}
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
            )}

            {/* User Trait Radar */}
            <Radar
              name={archetypeName ? `${userName} (${archetypeName})` : `${userName}`}
              dataKey="user"
              stroke="#00f0ff"
              fill="#00f0ff"
              fillOpacity={0.35}
              strokeWidth={2.5}
            />

            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{
                fontSize: '0.8rem',
                paddingTop: '10px',
                fontFamily: 'var(--font-display, sans-serif)',
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
