import React from 'react';
import { ShieldCheck, Cpu, Radio } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="arena-footer">
      <div className="footer-content">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
            AI DEBATE ARENA
          </span>
          <span>© 2026 Competitive Dialectics League</span>
        </div>

        <div className="footer-telemetry">
          <span>
            <div className="telemetry-dot" />
            Socket.IO Engine: Active
          </span>
          <span>
            <Cpu size={14} style={{ color: 'var(--ai-purple)' }} />
            AI Judge: Online (Latency 18ms)
          </span>
          <span>
            <ShieldCheck size={14} style={{ color: 'var(--cyber-cyan)' }} />
            Anti-Cheat: Enforced
          </span>
        </div>
      </div>
    </footer>
  );
};
