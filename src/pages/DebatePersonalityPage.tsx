import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Compass,
  ShieldAlert,
  FileSearch,
  Flame,
  Cpu,
  Swords,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Info,
  BookOpen,
  History,
  TrendingUp,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { ProgressBar } from '../components/common/ProgressBar';
import { PersonalityRadarChart } from '../components/personality/PersonalityRadarChart';
import { PersonalityClientService } from '../services/personalityClientService';
import {
  DebatePersonalityProfile,
  PersonalityTraits,
  ArchetypeDefinition,
} from '../types/personality';
import { CURRENT_USER } from '../data/mockData';

interface DebatePersonalityPageProps {
  onStartDebate: () => void;
  onNavigateToDashboard?: () => void;
}

export const DebatePersonalityPage: React.FC<DebatePersonalityPageProps> = ({
  onStartDebate,
  onNavigateToDashboard,
}) => {
  const [profile, setProfile] = useState<DebatePersonalityProfile | null>(null);
  const [archetypes, setArchetypes] = useState<ArchetypeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'encyclopedia' | 'history'>('profile');
  const [selectedTraitKey, setSelectedTraitKey] = useState<keyof PersonalityTraits | null>(null);
  const [recommendationFilter, setRecommendationFilter] = useState<'All' | 'High' | 'Medium' | 'Maintenance'>('All');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [userProfile, allArchetypes] = await Promise.all([
        PersonalityClientService.getPersonality(CURRENT_USER.id),
        PersonalityClientService.getArchetypes(),
      ]);
      setProfile(userProfile);
      setArchetypes(allArchetypes);
    } catch (err) {
      console.error('Failed to load personality data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    try {
      const updated = await PersonalityClientService.recalculate(CURRENT_USER.id);
      setProfile(updated);
      setNotificationMsg('Personality metrics successfully recalculated from historical debate records!');
      setTimeout(() => setNotificationMsg(null), 4000);
    } catch (err) {
      console.error('Recalculate failed', err);
    } finally {
      setIsRecalculating(false);
    }
  };

  const getArchetypeIcon = (name: string) => {
    switch (name) {
      case 'The Strategist':
        return <Compass size={32} color="var(--cyber-cyan)" />;
      case 'The Counter-Attacker':
        return <ShieldAlert size={32} color="var(--electric-gold)" />;
      case 'The Evidence Hunter':
        return <FileSearch size={32} color="var(--matrix-green)" />;
      case 'The Persuader':
        return <Flame size={32} color="#ff7b00" />;
      case 'The Logical Machine':
        return <Cpu size={32} color="#60a5fa" />;
      case 'The Aggressive Challenger':
        return <Swords size={32} color="var(--crimson-red)" />;
      default:
        return <Sparkles size={32} color="var(--cyber-cyan)" />;
    }
  };

  const getTraitGrade = (score: number) => {
    if (score >= 90) return { label: 'Grandmaster', color: 'var(--cyber-cyan)' };
    if (score >= 80) return { label: 'Advanced', color: 'var(--matrix-green)' };
    if (score >= 70) return { label: 'Proficient', color: 'var(--electric-gold)' };
    return { label: 'Developing', color: 'var(--crimson-red)' };
  };

  const traitMeta: {
    key: keyof PersonalityTraits;
    label: string;
    category: string;
    description: string;
  }[] = [
    {
      key: 'logic',
      label: 'Logic Score',
      category: 'Logos',
      description: 'Deductive validity, premise-conclusion causality, and fallacy avoidance.',
    },
    {
      key: 'rebuttal',
      label: 'Rebuttal Score',
      category: 'Dialectic',
      description: 'Counter-argument directness, speed of refutation, and vulnerability exploitation.',
    },
    {
      key: 'evidence',
      label: 'Evidence Usage',
      category: 'Empirical',
      description: 'Density of verifiable citations, statistics, studies, and empirical datasets.',
    },
    {
      key: 'persuasiveness',
      label: 'Persuasiveness',
      category: 'Rhetoric',
      description: 'Adjudicator resonance, rhetorical framing, clarity, and structural impact.',
    },
    {
      key: 'aggressiveness',
      label: 'Aggressiveness',
      category: 'Pacing',
      description: 'Tempo dominance, refutation pressure, active challenging, and cross-exam intensity.',
    },
    {
      key: 'consistency',
      label: 'Consistency',
      category: 'Discipline',
      description: 'Low variance across rounds; steady execution from opening framework to closing whip.',
    },
    {
      key: 'emotionalAppeal',
      label: 'Emotional Appeal',
      category: 'Pathos',
      description: 'Normative moral stakes, human impact framing, and evocative ethical urgency.',
    },
    {
      key: 'riskTaking',
      label: 'Risk Taking',
      category: 'Strategy',
      description: 'Audacious counter-theses, strategic concessions, and unconventional clash vectors.',
    },
  ];

  if (loading || !profile) {
    return (
      <div className="dashboard-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw className="animate-spin" size={36} color="var(--cyber-cyan)" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontFamily: 'var(--font-display)', color: '#fff' }}>Analyzing Debate Vectors...</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Synthesizing historical debate turns, scores, and dialectical patterns.</p>
        </div>
      </div>
    );
  }

  const filteredRecommendations = profile.recommendations.filter(
    (rec) => recommendationFilter === 'All' || rec.priority === recommendationFilter
  );

  return (
    <div className="dashboard-container" style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '4rem' }}>
      {/* Top Breadcrumb & Actions */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span
              style={{ fontSize: '0.85rem', color: 'var(--text-muted)', cursor: 'pointer' }}
              onClick={onNavigateToDashboard}
            >
              Arena Dashboard
            </span>
            <span style={{ color: 'var(--text-muted)' }}>/</span>
            <span style={{ fontSize: '0.85rem', color: 'var(--cyber-cyan)', fontWeight: 600 }}>
              Debate Personality
            </span>
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.85rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: 0,
            }}
          >
            Debate Personality Matrix
          </h1>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecalculate}
            disabled={isRecalculating}
            icon={<RefreshCw size={14} className={isRecalculating ? 'animate-spin' : ''} />}
          >
            {isRecalculating ? 'Recalculating...' : 'Recalculate Profile'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={onStartDebate}
            icon={<Swords size={16} />}
          >
            Test Style in 1v1
          </Button>
        </div>
      </div>

      {/* Notification Banner */}
      <AnimatePresence>
        {notificationMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{
              background: 'rgba(0, 240, 255, 0.12)',
              border: '1px solid var(--cyber-cyan)',
              borderRadius: '6px',
              padding: '0.85rem 1.25rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              color: '#fff',
              fontSize: '0.9rem',
            }}
          >
            <CheckCircle2 size={18} color="var(--cyber-cyan)" />
            <span>{notificationMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Subtabs */}
      <div
        style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '0.5rem',
          marginBottom: '1.75rem',
        }}
      >
        <button
          onClick={() => setActiveTab('profile')}
          style={{
            background: activeTab === 'profile' ? 'var(--bg-surface-3)' : 'transparent',
            color: activeTab === 'profile' ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
            border: activeTab === 'profile' ? '1px solid var(--border-focus)' : '1px solid transparent',
            padding: '0.5rem 1.15rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
          }}
        >
          <Sparkles size={16} />
          <span>My Personality</span>
        </button>

        <button
          onClick={() => setActiveTab('encyclopedia')}
          style={{
            background: activeTab === 'encyclopedia' ? 'var(--bg-surface-3)' : 'transparent',
            color: activeTab === 'encyclopedia' ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
            border: activeTab === 'encyclopedia' ? '1px solid var(--border-focus)' : '1px solid transparent',
            padding: '0.5rem 1.15rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
          }}
        >
          <BookOpen size={16} />
          <span>Archetype Roster</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          style={{
            background: activeTab === 'history' ? 'var(--bg-surface-3)' : 'transparent',
            color: activeTab === 'history' ? 'var(--cyber-cyan)' : 'var(--text-secondary)',
            border: activeTab === 'history' ? '1px solid var(--border-focus)' : '1px solid transparent',
            padding: '0.5rem 1.15rem',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            transition: 'all 0.2s ease',
          }}
        >
          <History size={16} />
          <span>Evolution History ({profile.history?.length || 0})</span>
        </button>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'profile' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          {/* Hero Archetype Card */}
          <Card
            variant="cyan"
            style={{
              padding: '2rem',
              position: 'relative',
              overflow: 'hidden',
              background: 'linear-gradient(135deg, rgba(10, 14, 23, 0.95) 0%, rgba(22, 33, 53, 0.9) 100%)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                flexWrap: 'wrap',
                gap: '1.5rem',
              }}
            >
              <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                <div
                  style={{
                    width: '76px',
                    height: '76px',
                    borderRadius: '12px',
                    background: 'var(--bg-surface-3)',
                    border: '1px solid var(--border-focus)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 25px rgba(0, 240, 255, 0.2)',
                  }}
                >
                  {getArchetypeIcon(profile.archetype)}
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                    <Badge variant="cyan">Primary Archetype</Badge>
                    {profile.secondaryArchetype && (
                      <Badge variant="gold">
                        Subtype: {profile.secondaryArchetype}
                      </Badge>
                    )}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Based on {profile.debatesAnalyzed} debates
                    </span>
                  </div>

                  <h2
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '2rem',
                      fontWeight: 800,
                      margin: '0.2rem 0',
                      letterSpacing: '0.04em',
                      color: '#fff',
                    }}
                  >
                    {profile.archetype}
                  </h2>

                  <p
                    style={{
                      fontFamily: 'var(--font-hud)',
                      fontSize: '1.05rem',
                      color: 'var(--electric-gold)',
                      fontWeight: 600,
                      margin: '0 0 0.5rem 0',
                    }}
                  >
                    "{profile.archetypeTagline}"
                  </p>

                  <p
                    style={{
                      fontSize: '0.95rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      maxWidth: '750px',
                      margin: 0,
                    }}
                  >
                    {profile.archetypeDescription}
                  </p>
                </div>
              </div>

              {/* Quick High Trait Summary Badge */}
              <div
                style={{
                  background: 'var(--bg-surface-2)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '8px',
                  padding: '1rem 1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem',
                  minWidth: '220px',
                }}
              >
                <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700 }}>
                  Signature Competencies
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#fff' }}>Rebuttal</span>
                  <span style={{ fontFamily: 'var(--font-hud)', fontWeight: 700, color: 'var(--cyber-cyan)' }}>
                    {profile.traits.rebuttal}/100
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#fff' }}>Logic</span>
                  <span style={{ fontFamily: 'var(--font-hud)', fontWeight: 700, color: 'var(--cyber-cyan)' }}>
                    {profile.traits.logic}/100
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.85rem', color: '#fff' }}>Consistency</span>
                  <span style={{ fontFamily: 'var(--font-hud)', fontWeight: 700, color: 'var(--cyber-cyan)' }}>
                    {profile.traits.consistency}/100
                  </span>
                </div>
              </div>
            </div>
          </Card>

          {/* Explicit Non-Scientific Validation Disclaimer Notice */}
          <div
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              borderRadius: '8px',
              padding: '0.9rem 1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.85rem',
            }}
          >
            <Info size={20} color="#94a3b8" style={{ marginTop: '2px', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#e2e8f0', marginBottom: '0.2rem' }}>
                Competitive Performance Heuristic Notice
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', lineHeight: 1.5 }}>
                {profile.disclaimer}
              </div>
            </div>
          </div>

          {/* Split Section: Radar Chart & 8 Traits Breakdown */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* Radar Chart Card */}
            <Card style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      margin: 0,
                    }}
                  >
                    8-Dimension Dialectical Radar
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Visualizing tactical balance across all competitive vectors
                  </span>
                </div>
                <Badge variant="cyan">Interactive</Badge>
              </div>

              <PersonalityRadarChart
                traits={profile.traits}
                userName={profile.username}
                archetypeName={profile.archetype}
              />
            </Card>

            {/* Trait Meters List */}
            <Card style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.15rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      margin: 0,
                    }}
                  >
                    Trait Breakdown & Percentiles
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Calculated from speech transcripts, adjudications, and counter-arguments
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                {traitMeta.map((item) => {
                  const val = profile.traits[item.key];
                  const grade = getTraitGrade(val);
                  const isSelected = selectedTraitKey === item.key;

                  return (
                    <div
                      key={item.key}
                      onClick={() => setSelectedTraitKey(isSelected ? null : item.key)}
                      style={{
                        padding: '0.75rem 0.9rem',
                        background: isSelected ? 'var(--bg-surface-3)' : 'var(--bg-surface-2)',
                        border: isSelected ? '1px solid var(--border-focus)' : '1px solid var(--border-subtle)',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                            {item.label}
                          </span>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.1rem 0.4rem',
                              borderRadius: '4px',
                              background: 'rgba(255, 255, 255, 0.06)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {item.category}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: grade.color }}>
                            {grade.label}
                          </span>
                          <span
                            style={{
                              fontFamily: 'var(--font-hud)',
                              fontSize: '1rem',
                              fontWeight: 700,
                              color: '#fff',
                            }}
                          >
                            {val}
                          </span>
                        </div>
                      </div>

                      <ProgressBar value={val} max={100} color={val >= 85 ? 'cyan' : val >= 70 ? 'gold' : 'purple'} />

                      {isSelected && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          style={{
                            marginTop: '0.65rem',
                            paddingTop: '0.5rem',
                            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
                            fontSize: '0.8rem',
                            color: 'var(--text-secondary)',
                            lineHeight: 1.45,
                          }}
                        >
                          {item.description}
                        </motion.div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Strengths & Weaknesses Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* Strengths Card */}
            <Card
              style={{
                padding: '1.75rem',
                borderLeft: '3px solid var(--matrix-green)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <CheckCircle2 size={22} color="var(--matrix-green)" />
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    margin: 0,
                  }}
                >
                  Core Strengths
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {profile.strengths.map((str, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-surface-2)',
                      padding: '0.9rem 1.1rem',
                      borderRadius: '6px',
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'flex-start',
                      fontSize: '0.9rem',
                      color: 'var(--text-primary)',
                      lineHeight: 1.5,
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'var(--matrix-green)',
                        marginTop: '0.55rem',
                        flexShrink: 0,
                      }}
                    />
                    <span>{str}</span>
                  </div>
                ))}
              </div>
            </Card>

            {/* Weaknesses Card */}
            <Card
              style={{
                padding: '1.75rem',
                borderLeft: '3px solid var(--crimson-red)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <AlertTriangle size={22} color="var(--crimson-red)" />
                <h3
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: '1.2rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    margin: 0,
                  }}
                >
                  Strategic Vulnerabilities
                </h3>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {profile.weaknesses.map((weak, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-surface-2)',
                      padding: '0.9rem 1.1rem',
                      borderRadius: '6px',
                      display: 'flex',
                      gap: '0.75rem',
                      alignItems: 'flex-start',
                      fontSize: '0.9rem',
                      color: 'var(--text-primary)',
                      lineHeight: 1.5,
                    }}
                  >
                    <span
                      style={{
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        background: 'var(--crimson-red)',
                        marginTop: '0.55rem',
                        flexShrink: 0,
                      }}
                    />
                    <span>{weak}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Recommendations for Improvement */}
          <Card style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Lightbulb size={22} color="var(--electric-gold)" />
                <div>
                  <h3
                    style={{
                      fontFamily: 'var(--font-display)',
                      fontSize: '1.2rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      margin: 0,
                    }}
                  >
                    Tactical Recommendations for Improvement
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Actionable training drills prioritized to expand your stylistic range
                  </span>
                </div>
              </div>

              {/* Priority Filters */}
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                {(['All', 'High', 'Medium', 'Maintenance'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setRecommendationFilter(filter)}
                    style={{
                      background:
                        recommendationFilter === filter ? 'var(--bg-surface-3)' : 'transparent',
                      color:
                        recommendationFilter === filter ? 'var(--cyber-cyan)' : 'var(--text-muted)',
                      border:
                        recommendationFilter === filter
                          ? '1px solid var(--border-focus)'
                          : '1px solid var(--border-subtle)',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '4px',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '1rem',
              }}
            >
              {filteredRecommendations.map((rec) => {
                const priorityColor =
                  rec.priority === 'High'
                    ? 'var(--crimson-red)'
                    : rec.priority === 'Medium'
                    ? 'var(--electric-gold)'
                    : 'var(--matrix-green)';

                return (
                  <div
                    key={rec.id}
                    style={{
                      background: 'var(--bg-surface-2)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '8px',
                      padding: '1.25rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.85rem',
                    }}
                  >
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '0.2rem 0.5rem',
                            borderRadius: '4px',
                            background: 'rgba(255, 255, 255, 0.06)',
                            color: priorityColor,
                            border: `1px solid ${priorityColor}`,
                          }}
                        >
                          {rec.priority} Priority
                        </span>

                        <span
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)',
                            textTransform: 'uppercase',
                            fontWeight: 600,
                          }}
                        >
                          Focus: {rec.focusTrait}
                        </span>
                      </div>

                      <h4 style={{ fontSize: '1.05rem', fontWeight: 700, margin: '0.25rem 0 0.5rem 0', color: '#fff' }}>
                        {rec.title}
                      </h4>

                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                        {rec.description}
                      </p>
                    </div>

                    <div
                      style={{
                        paddingTop: '0.75rem',
                        borderTop: '1px solid var(--border-subtle)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ fontSize: '0.8rem', color: 'var(--cyber-cyan)', fontWeight: 600 }}>
                        Drill: {rec.exerciseName}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onStartDebate}
                        icon={<ArrowRight size={13} />}
                      >
                        Practice
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}

      {/* Tab: Archetype Encyclopedia */}
      {activeTab === 'encyclopedia' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div style={{ marginBottom: '0.5rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
              The 6 Competitive Debate Archetypes
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0.25rem 0 0 0' }}>
              Every debater embodies a unique dialectical profile. Compare the six archetypes to prepare counter-strategies against opponents.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {archetypes.map((arch) => {
              const isCurrent = profile.archetype === arch.name;

              return (
                <Card
                  key={arch.name}
                  variant={isCurrent ? 'cyan' : 'default'}
                  style={{
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '1.25rem',
                    position: 'relative',
                  }}
                >
                  {isCurrent && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                      }}
                    >
                      <Badge variant="cyan">Your Style</Badge>
                    </div>
                  )}

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '8px',
                          background: 'var(--bg-surface-3)',
                          border: '1px solid var(--border-subtle)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {getArchetypeIcon(arch.name)}
                      </div>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>
                          {arch.name}
                        </h3>
                        <span style={{ fontSize: '0.75rem', color: 'var(--electric-gold)', fontWeight: 600 }}>
                          "{arch.tagline}"
                        </span>
                      </div>
                    </div>

                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1rem' }}>
                      {arch.description}
                    </p>

                    {/* Strengths & Flaws */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.8rem' }}>
                      <div style={{ color: 'var(--matrix-green)' }}>
                        <strong>Signature Edge:</strong> {arch.strengthsPool[0]}
                      </div>
                      <div style={{ color: 'var(--crimson-red)' }}>
                        <strong>Tactical Flaw:</strong> {arch.weaknessesPool[0]}
                      </div>
                    </div>
                  </div>

                  {/* Benchmark Trait Strip */}
                  <div
                    style={{
                      background: 'var(--bg-surface-2)',
                      padding: '0.75rem',
                      borderRadius: '6px',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(4, 1fr)',
                      gap: '0.5rem',
                      textAlign: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Logic</div>
                      <div style={{ fontFamily: 'var(--font-hud)', fontWeight: 700, color: '#fff' }}>
                        {arch.weights.logic}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rebuttal</div>
                      <div style={{ fontFamily: 'var(--font-hud)', fontWeight: 700, color: '#fff' }}>
                        {arch.weights.rebuttal}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Evidence</div>
                      <div style={{ fontFamily: 'var(--font-hud)', fontWeight: 700, color: '#fff' }}>
                        {arch.weights.evidence}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Pathos</div>
                      <div style={{ fontFamily: 'var(--font-hud)', fontWeight: 700, color: '#fff' }}>
                        {arch.weights.emotionalAppeal}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Evolution History */}
      {activeTab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <Card style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, textTransform: 'uppercase', margin: 0 }}>
                  Post-Match Trait Progression
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Your debate personality updates dynamically after every completed match
                </span>
              </div>
              <Badge variant="cyan">{profile.history?.length || 0} Snapshots Recorded</Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {(profile.history || []).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'var(--bg-surface-2)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '50%',
                        background: 'var(--bg-surface-3)',
                        border: '1px solid var(--border-focus)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <TrendingUp size={20} color="var(--cyber-cyan)" />
                    </div>

                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', marginBottom: '0.2rem' }}>
                        {item.note || `Debate #${item.debateId}`}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(item.completedAt).toLocaleDateString()} • Archetype:{' '}
                        <span style={{ color: 'var(--electric-gold)', fontWeight: 600 }}>{item.archetype}</span>
                      </div>
                    </div>
                  </div>

                  {/* Trait Snapshot Grid */}
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Logic</div>
                      <div style={{ fontFamily: 'var(--font-hud)', fontWeight: 700, color: 'var(--cyber-cyan)' }}>
                        {item.traits.logic}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Rebuttal</div>
                      <div style={{ fontFamily: 'var(--font-hud)', fontWeight: 700, color: 'var(--cyber-cyan)' }}>
                        {item.traits.rebuttal}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Evidence</div>
                      <div style={{ fontFamily: 'var(--font-hud)', fontWeight: 700, color: 'var(--cyber-cyan)' }}>
                        {item.traits.evidence}
                      </div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Consistency</div>
                      <div style={{ fontFamily: 'var(--font-hud)', fontWeight: 700, color: 'var(--cyber-cyan)' }}>
                        {item.traits.consistency}
                      </div>
                    </div>

                    {item.deltaScore !== undefined && (
                      <div
                        style={{
                          marginLeft: '0.5rem',
                          fontFamily: 'var(--font-hud)',
                          fontSize: '0.9rem',
                          fontWeight: 700,
                          color: (item.deltaScore || 0) >= 0 ? 'var(--matrix-green)' : 'var(--crimson-red)',
                          background: 'rgba(0, 0, 0, 0.4)',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '4px',
                        }}
                      >
                        {(item.deltaScore || 0) >= 0 ? `+${item.deltaScore}` : item.deltaScore} Vector Δ
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
