import React from 'react';
import { COLORS, scoreVariance, GATES } from '../lib/constants';
import type { Team } from '../types';

interface Props {
  teams: Team[];
  view: string;
  onNav: (v: string) => void;
}

const NAV = [
  { id: 'dashboard',  label: 'Dashboard',   icon: '◈', tier: null },
  { id: 'add',        label: 'Add Team',     icon: '+', tier: null },
  { id: 'prefilter',  label: 'Pre-Filter',   icon: '⚡', tier: '1' },
  { id: 'quickscore', label: 'Quick Score',  icon: '✦', tier: '2' },
  { id: 'score',      label: 'Deep Score',   icon: '⚖', tier: '3' },
  { id: 'arbitration',label: 'Arbitration',  icon: '↔', tier: null },
  { id: 'rankings',   label: 'Rankings',     icon: '★', tier: null },
];

export const Sidebar: React.FC<Props> = ({ teams, view, onNav }) => {
  const unfiltered = teams.filter(t => t.tier === null && t.status !== 'rejected').length;
  const tier2Unscored = teams.filter(t => t.tier === 2 && (!t.quickScores || Object.keys(t.quickScores).length === 0)).length;
  const tier3Unscored = teams.filter(t => t.tier === 3 && (!t.scores || Object.keys(t.scores).length === 0)).length;
  const varCount = teams.filter(t =>
    Object.keys(t.evalA || {}).length > 0 && Object.keys(t.evalB || {}).length > 0 &&
    scoreVariance(t.evalA, t.evalB) > GATES.variance
  ).length;

  const badges: Record<string, number> = {
    prefilter: unfiltered,
    quickscore: tier2Unscored,
    score: tier3Unscored,
    arbitration: varCount,
  };

  return (
    <aside style={{
      background: COLORS.surface, borderRight: `1px solid ${COLORS.border}`,
      position: 'sticky', top: 0, height: '100vh',
      display: 'flex', flexDirection: 'column', width: 220, flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: '24px 20px 18px', borderBottom: `1px solid ${COLORS.border}` }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.14em', color: COLORS.accent, marginBottom: 4 }}>HACKATHON</div>
        <div style={{ fontSize: 16, fontWeight: 900, color: COLORS.white, lineHeight: 1.3 }}>Screening<br />Platform</div>
        <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 20, padding: '3px 10px' }}>
          <div style={{ width: 6, height: 6, background: COLORS.green, borderRadius: '50%' }} />
          <span style={{ fontSize: 11, color: COLORS.muted }}>{teams.length} teams</span>
        </div>
      </div>

      {/* Tier legend */}
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${COLORS.border}` }}>
        {[
          { label: 'Tier 1 — Pre-Filter', color: COLORS.yellow, desc: '~90 sec' },
          { label: 'Tier 2 — Quick Score', color: COLORS.accent, desc: '~5 min' },
          { label: 'Tier 3 — Deep Score', color: COLORS.purple, desc: 'borderline' },
        ].map(({ label, color, desc }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <div style={{ width: 6, height: 6, background: color, borderRadius: '50%', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 10, color: COLORS.muted }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {NAV.map(({ id, label, icon, tier }) => {
          const isActive = view === id;
          const badge = badges[id];
          return (
            <button key={id} onClick={() => onNav(id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 12px', borderRadius: 8, marginBottom: 2,
              background: isActive ? COLORS.accent + '22' : 'transparent',
              border: `1px solid ${isActive ? COLORS.accent + '55' : 'transparent'}`,
              color: isActive ? COLORS.accent : COLORS.muted,
              cursor: 'pointer', fontSize: 13, fontWeight: isActive ? 700 : 500,
              textAlign: 'left', transition: 'all 0.15s',
            }}>
              <span>
                <span style={{ marginRight: 9, fontSize: 14, opacity: 0.85 }}>{icon}</span>
                {label}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {tier && (
                  <span style={{ fontSize: 9, color: COLORS.muted, background: COLORS.border, borderRadius: 4, padding: '1px 5px' }}>
                    T{tier}
                  </span>
                )}
                {badge != null && badge > 0 && (
                  <span style={{ background: id === 'arbitration' ? COLORS.red : COLORS.yellow, color: COLORS.bg, borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 800 }}>
                    {badge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Gate thresholds */}
      <div style={{ padding: '12px 16px', borderTop: `1px solid ${COLORS.border}`, fontSize: 10, color: COLORS.muted, lineHeight: 1.8 }}>
        <div style={{ fontWeight: 700, marginBottom: 2, letterSpacing: '0.06em' }}>QUICK GATES</div>
        <div>Overall ≥50 · GH ≥12</div>
        <div>LI ≥8 · Team ≥8</div>
        <div style={{ fontWeight: 700, marginTop: 6, marginBottom: 2, letterSpacing: '0.06em' }}>DEEP GATES</div>
        <div>Overall ≥50 · GH ≥15</div>
        <div>LI ≥8 · Team ≥10</div>
      </div>
    </aside>
  );
};
