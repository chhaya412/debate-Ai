import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Trophy, Flame, Search, Medal, Crown, Sparkles, Filter } from 'lucide-react';
import { MOCK_LEADERBOARD } from '../data/mockData';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';

interface LeaderboardPageProps {
  onChallengeDebater?: (userId: string) => void;
}

export const LeaderboardPage: React.FC<LeaderboardPageProps> = ({ onChallengeDebater }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('All');

  const filteredLeaderboard = MOCK_LEADERBOARD.filter(entry => {
    const matchesSearch =
      entry.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.user.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTier =
      tierFilter === 'All' || entry.user.rankTier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const topThree = MOCK_LEADERBOARD.slice(0, 3);

  return (
    <div className="leaderboard-container">
      {/* Header Banner */}
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <div className="hero-tag" style={{ margin: '0 auto 1rem' }}>
          <Trophy size={14} /> Global Dialectical Rankings
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, textTransform: 'uppercase' }}>
          APEX DEBATER LEADERBOARD
        </h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: 650, margin: '0.5rem auto 0' }}>
          Rankings computed via skill-weighted Elo algorithms factoring in win consistency, fallacy resistance, and empirical citation density.
        </p>
      </div>

      {/* Podium for Top 3 */}
      <div className="leaderboard-podium">
        {/* Rank 2 */}
        {topThree[1] && (
          <Card className="podium-card" variant="cyan">
            <Badge variant="cyan">Rank #2</Badge>
            <img
              src={topThree[1].user.avatar}
              alt={topThree[1].user.name}
              className="podium-avatar"
              style={{ borderColor: 'var(--cyber-cyan)' }}
            />
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem' }}>
              {topThree[1].user.name}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {topThree[1].user.title}
            </span>
            <div style={{ fontFamily: 'var(--font-hud)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--cyber-cyan)' }}>
              {topThree[1].user.elo} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>ELO</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--matrix-green)', fontWeight: 600 }}>
              {topThree[1].user.winRate}% Win Rate • {topThree[1].user.streak} Streak
            </div>
          </Card>
        )}

        {/* Rank 1 - Center Gold Apex */}
        {topThree[0] && (
          <Card className="podium-card podium-gold" variant="cyan">
            <Crown size={32} style={{ color: 'var(--electric-gold)', filter: 'drop-shadow(0 0 10px var(--electric-gold-glow))' }} />
            <Badge variant="gold">Grand Apex Champion #1</Badge>
            <img
              src={topThree[0].user.avatar}
              alt={topThree[0].user.name}
              className="podium-avatar"
              style={{ borderColor: 'var(--electric-gold)', width: 88, height: 88 }}
            />
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.4rem' }}>
              {topThree[0].user.name}
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {topThree[0].user.title}
            </span>
            <div style={{ fontFamily: 'var(--font-hud)', fontSize: '2.4rem', fontWeight: 700, color: 'var(--electric-gold)' }}>
              {topThree[0].user.elo} <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>ELO</span>
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--matrix-green)', fontWeight: 700 }}>
              {topThree[0].user.winRate}% Win Rate • {topThree[0].user.streak} Win Streak
            </div>
          </Card>
        )}

        {/* Rank 3 */}
        {topThree[2] && (
          <Card className="podium-card">
            <Badge variant="default">Rank #3</Badge>
            <img
              src={topThree[2].user.avatar}
              alt={topThree[2].user.name}
              className="podium-avatar"
              style={{ borderColor: 'var(--border-bright)' }}
            />
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1.2rem' }}>
              {topThree[2].user.name}
            </h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {topThree[2].user.title}
            </span>
            <div style={{ fontFamily: 'var(--font-hud)', fontSize: '1.8rem', fontWeight: 700, color: '#fff' }}>
              {topThree[2].user.elo} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>ELO</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--matrix-green)', fontWeight: 600 }}>
              {topThree[2].user.winRate}% Win Rate • {topThree[2].user.streak} Streak
            </div>
          </Card>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ position: 'relative', minWidth: '280px' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 12, color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search debaters by name or title..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.65rem 1rem 0.65rem 2.4rem',
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border-bright)',
              borderRadius: '4px',
              color: '#fff',
              outline: 'none',
              fontSize: '0.9rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} style={{ color: 'var(--text-muted)' }} />
          {['All', 'Philosopher', 'Grandmaster', 'Contender'].map(tier => (
            <button
              key={tier}
              onClick={() => setTierFilter(tier)}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: '4px',
                background: tierFilter === tier ? 'var(--cyber-cyan-dim)' : 'var(--bg-surface-2)',
                border: tierFilter === tier ? '1px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
                color: tierFilter === tier ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
                fontFamily: 'var(--font-hud)',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              {tier}
            </button>
          ))}
        </div>
      </div>

      {/* Rankings Table */}
      <Card className="leaderboard-table-card">
        <table className="match-history-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Debater</th>
              <th>Rank Tier</th>
              <th>ELO Rating</th>
              <th>Win Rate</th>
              <th>Streak</th>
              <th>Avg Score</th>
              <th>Specialty Badges</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeaderboard.map(entry => (
              <tr key={entry.user.id}>
                <td className="rank-number-cell" style={{ color: entry.rank === 1 ? 'var(--electric-gold)' : entry.rank === 2 ? 'var(--cyber-cyan)' : '#fff' }}>
                  #{entry.rank}
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={entry.user.avatar}
                      alt={entry.user.name}
                      style={{ width: 40, height: 40, borderRadius: '4px', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontWeight: 700, color: '#fff', fontSize: '1rem' }}>
                        {entry.user.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {entry.user.title}
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <Badge variant={entry.user.rankTier === 'Philosopher' ? 'gold' : 'cyan'}>
                    {entry.user.rankTier}
                  </Badge>
                </td>
                <td>
                  <strong style={{ color: 'var(--electric-gold)', fontFamily: 'var(--font-hud)', fontSize: '1.2rem' }}>
                    {entry.user.elo}
                  </strong>
                </td>
                <td>
                  <span style={{ color: 'var(--matrix-green)', fontWeight: 600 }}>{entry.user.winRate}%</span>
                </td>
                <td>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', color: 'var(--electric-gold)', fontWeight: 700 }}>
                    <Flame size={14} /> {entry.user.streak}
                  </span>
                </td>
                <td>
                  <span style={{ fontFamily: 'var(--font-hud)', fontWeight: 700 }}>{entry.user.avgScore}</span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    {entry.badges.map((b, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.7rem',
                          padding: '2px 6px',
                          borderRadius: '3px',
                          background: 'var(--bg-surface-3)',
                          border: '1px solid var(--border-subtle)',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
