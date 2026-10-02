import React, { useState, useEffect } from 'react';
import { Award, Brain, Shield, BookOpen, Sparkles, Mic, Crown, Flame, CheckCircle, Lock } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { AchievementClientService, AchievementData, AchievementItem } from '../../services/achievementClientService';

interface AchievementsGridProps {
  userId?: string;
}

export const AchievementsGrid: React.FC<AchievementsGridProps> = ({ userId }) => {
  const [data, setData] = useState<AchievementData | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    AchievementClientService.getUserAchievements(userId)
      .then(res => {
        setData(res);
        setLoading(false);
      })
      .catch(err => {
        console.warn('Error fetching achievements:', err);
        setLoading(false);
      });
  }, [userId]);

  const getIcon = (iconName: string, unlocked: boolean) => {
    const color = unlocked ? 'var(--cyber-cyan)' : 'var(--text-muted)';
    const size = 18;
    switch (iconName) {
      case 'Brain':
        return <Brain size={size} style={{ color }} />;
      case 'Shield':
        return <Shield size={size} style={{ color }} />;
      case 'BookOpen':
        return <BookOpen size={size} style={{ color }} />;
      case 'Sparkles':
        return <Sparkles size={size} style={{ color }} />;
      case 'Mic':
        return <Mic size={size} style={{ color }} />;
      case 'Crown':
        return <Crown size={size} style={{ color }} />;
      case 'Flame':
        return <Flame size={size} style={{ color }} />;
      default:
        return <Award size={size} style={{ color }} />;
    }
  };

  const filtered = data?.achievements.filter(a => {
    if (activeCategory === 'all') return true;
    if (activeCategory === 'unlocked') return a.unlocked;
    return a.category === activeCategory;
  }) || [];

  return (
    <Card style={{ padding: '1.75rem', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={20} style={{ color: 'var(--electric-gold)' }} />
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>
              Debater Achievements & Milestones
            </h3>
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Unlocked {data?.unlockedCount || 0} of {data?.totalAchievements || 8} ({data?.completionPercentage || 0}% Mastery)
          </span>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['all', 'unlocked', 'scoring', 'mastery', 'voice'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                background: activeCategory === cat ? 'rgba(0, 240, 255, 0.15)' : 'var(--bg-surface-3)',
                color: activeCategory === cat ? 'var(--cyber-cyan)' : 'var(--text-muted)',
                border: activeCategory === cat ? '1px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
                borderRadius: '4px',
                padding: '0.25rem 0.6rem',
                fontSize: '0.75rem',
                cursor: 'pointer',
                fontFamily: 'var(--font-hud)',
                textTransform: 'uppercase',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Synchronizing debate achievement records...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No achievements matching current filter. Complete debates to unlock more!
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '0.85rem',
          }}
        >
          {filtered.map(ach => (
            <div
              key={ach.id}
              style={{
                background: ach.unlocked ? 'rgba(0, 240, 255, 0.04)' : 'var(--bg-surface-2)',
                border: ach.unlocked ? '1px solid rgba(0, 240, 255, 0.3)' : '1px solid var(--border-subtle)',
                borderRadius: '6px',
                padding: '0.9rem',
                display: 'flex',
                gap: '0.75rem',
                alignItems: 'flex-start',
                position: 'relative',
                opacity: ach.unlocked ? 1 : 0.7,
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  background: ach.unlocked ? 'rgba(0, 240, 255, 0.12)' : 'var(--bg-surface-3)',
                  border: ach.unlocked ? '1px solid var(--cyber-cyan)' : '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {getIcon(ach.icon, ach.unlocked)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.2rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: ach.unlocked ? '#fff' : 'var(--text-secondary)' }}>
                    {ach.title}
                  </span>
                  {ach.unlocked ? (
                    <CheckCircle size={14} style={{ color: 'var(--matrix-green)', flexShrink: 0 }} />
                  ) : (
                    <Lock size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  )}
                </div>

                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.4rem 0', lineHeight: 1.35 }}>
                  {ach.description}
                </p>

                {ach.unlocked && ach.unlockedAt && (
                  <span style={{ fontSize: '0.7rem', color: 'var(--cyber-cyan)', fontFamily: 'var(--font-hud)' }}>
                    Unlocked
                  </span>
                )}

                {!ach.unlocked && ach.maxProgress > 1 && (
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-hud)' }}>
                    Progress: {ach.progress} / {ach.maxProgress}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
