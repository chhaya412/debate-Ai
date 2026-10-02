import React, { useState, useEffect } from 'react';
import { Swords, LayoutDashboard, Trophy, Zap, Compass, Radio, Sparkles, User, LogIn, LogOut } from 'lucide-react';
import { CURRENT_USER } from '../../data/mockData';
import { AuthModal } from '../auth/AuthModal';

export type ScreenType = 'landing' | 'dashboard' | 'personality' | 'setup' | 'arena' | 'realtime' | 'results' | 'leaderboard';

interface NavbarProps {
  currentScreen: ScreenType;
  onNavigate: (screen: ScreenType) => void;
  activeMatchActive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ currentScreen, onNavigate, activeMatchActive = true }) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('debate_user');
      if (stored) {
        try { return JSON.parse(stored); } catch {}
      }
    }
    return CURRENT_USER;
  });

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('debate_user');
    setCurrentUser(null);
  };
  return (
    <header className="arena-navbar">
      {/* Brand Identity */}
      <div className="arena-nav-brand" onClick={() => onNavigate('landing')}>
        <div className="brand-icon-box">
          <Swords size={22} />
        </div>
        <div className="brand-title">
          AI DEBATE <span>ARENA</span>
        </div>
        <div className="brand-tag">SOCKET.IO v2.5</div>
      </div>

      {/* Navigation Links */}
      <nav>
        <ul className="arena-nav-links">
          <li>
            <button
              className={`arena-nav-btn ${currentScreen === 'landing' ? 'active' : ''}`}
              onClick={() => onNavigate('landing')}
            >
              <Compass size={16} />
              Home
            </button>
          </li>
          <li>
            <button
              className={`arena-nav-btn ${currentScreen === 'dashboard' ? 'active' : ''}`}
              onClick={() => onNavigate('dashboard')}
            >
              <LayoutDashboard size={16} />
              Dashboard
            </button>
          </li>
          <li>
            <button
              className={`arena-nav-btn ${currentScreen === 'personality' ? 'active' : ''}`}
              onClick={() => onNavigate('personality')}
            >
              <Sparkles size={16} />
              Personality
            </button>
          </li>
          <li>
            <button
              className={`arena-nav-btn ${currentScreen === 'setup' ? 'active' : ''}`}
              onClick={() => onNavigate('setup')}
            >
              <Zap size={16} />
              Setup
            </button>
          </li>
          <li>
            <button
              className={`arena-nav-btn ${currentScreen === 'realtime' ? 'active' : ''}`}
              onClick={() => onNavigate('realtime')}
              style={{ position: 'relative' }}
            >
              <Radio size={16} className="text-emerald-400" />
              Live Arena
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  boxShadow: '0 0 6px #10b981',
                }}
              />
            </button>
          </li>
          <li>
            <button
              className={`arena-nav-btn ${currentScreen === 'arena' ? 'active' : ''}`}
              onClick={() => onNavigate('arena')}
              style={{ position: 'relative' }}
            >
              <Swords size={16} />
              Arena
              {activeMatchActive && (
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    backgroundColor: 'var(--matrix-green)',
                    boxShadow: '0 0 6px var(--matrix-green)',
                  }}
                />
              )}
            </button>
          </li>
          <li>
            <button
              className={`arena-nav-btn ${currentScreen === 'results' ? 'active' : ''}`}
              onClick={() => onNavigate('results')}
            >
              Verdict
            </button>
          </li>
          <li>
            <button
              className={`arena-nav-btn ${currentScreen === 'leaderboard' ? 'active' : ''}`}
              onClick={() => onNavigate('leaderboard')}
            >
              <Trophy size={16} />
              Rankings
            </button>
          </li>
        </ul>
      </nav>

      {/* User Quick Info */}
      <div className="arena-nav-user" style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {currentUser ? (
          <>
            <div className="nav-elo-pill">
              <span style={{ color: 'var(--text-secondary)' }}>ELO</span>
              <span className="nav-elo-val">{currentUser.elo || 1200}</span>
            </div>
            <img
              src={currentUser.avatar || currentUser.avatarUrl || CURRENT_USER.avatar}
              alt={currentUser.name || currentUser.username || 'Debater'}
              className="nav-avatar-img"
              onClick={() => onNavigate('dashboard')}
              title={`${currentUser.name || currentUser.username} (View Profile)`}
            />
            <button
              onClick={handleLogout}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '0.3rem',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          </>
        ) : (
          <button
            onClick={() => setShowAuthModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'rgba(0, 240, 255, 0.1)',
              border: '1px solid var(--cyber-cyan)',
              color: 'var(--cyber-cyan)',
              borderRadius: '4px',
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              fontFamily: 'var(--font-hud)',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            <LogIn size={13} />
            Sign In
          </button>
        )}
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthSuccess={user => {
          setCurrentUser(user);
        }}
      />
    </header>
  );
};

