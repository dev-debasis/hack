import React from 'react';
import type { Team } from '../types';
import { COLORS, calcQuickScores, calcSectionScores, calcEffectiveScore, exportCSV } from '../lib/constants';
import { ProgressBar, Btn } from '../components/UI';

interface Props {
  teams: Team[];
  onNav: (v: string) => void;
}

const StatCard: React.FC<{ label: string; value: number | string; color?: string; sub?: string }> = ({ label, value, color = COLORS.accent, sub }) => (
  <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 4 }}>
    <div style={{ fontSize: 30, fontWeight: 900, color, fontFamily: "'JetBrains Mono', monospace" }}>{value}</div>
    <div style={{ fontSize: 12, color: COLORS.muted, fontWeight: 500 }}>{label}</div>
    {sub && <div style={{ fontSize: 11, color: COLORS.muted + '88' }}>{sub}</div>}
  </div>
);

export const Dashboard: React.FC<Props> = ({ teams, onNav }) => {
  const unfiltered = teams.filter(t => t.tier === null && t.status !== 'rejected').length;
  const tier2 = teams.filter(t => t.tier === 2).length;
  const tier3 = teams.filter(t => t.tier === 3).length;
  const autoRejected = teams.filter(t => t.status === 'rejected' && t.tier === null).length;
  const quickScored = teams.filter(t => t.tier === 2 && Object.keys(t.quickScores || {}).length > 0).length;
  const deepScored = teams.filter(t => t.tier === 3 && Object.keys(t.scores || {}).length > 0).length;
  const selected = teams.filter(t => t.status === 'selected').length;
  const waitlist = teams.filter(t => t.status === 'waitlist').length;

  // Effective scores for avg
  const scoredTeams = teams.filter(t => calcEffectiveScore(t) > 0);
  const avgScore = scoredTeams.length
    ? Math.round(scoredTeams.reduce((s, t) => s + calcEffectiveScore(t), 0) / scoredTeams.length)
    : 0;

  const cats = { external: 0, 'host-college': 0, 'first-year': 0 };
  teams.forEach(t => { if (t.category in cats) (cats as Record<string,number>)[t.category]++; });

  // Pipeline progress %
  const totalRelevant = teams.length - autoRejected;
  const pipelineProgress = totalRelevant > 0 ? Math.round((quickScored + deepScored) / totalRelevant * 100) : 0;

  return (
    <div style={{ padding: '32px 0' }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, color: COLORS.white, margin: 0 }}>Screening Dashboard</h2>
        <p style={{ color: COLORS.muted, marginTop: 6 }}>3-tier pipeline · {teams.length} total applications</p>
      </div>

      {/* Pipeline flow */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.white, marginBottom: 16 }}>Screening Pipeline</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto' }}>
          {[
            { label: 'Total', value: teams.length, color: COLORS.muted, icon: '📋' },
            { label: 'Auto-Rejected', value: autoRejected, color: COLORS.red, icon: '✗', arrow: true },
            { label: 'To Quick Score', value: tier2 + tier3, color: COLORS.yellow, icon: '✦', arrow: true },
            { label: 'Quick Scored', value: quickScored, color: COLORS.accent, icon: '✓', arrow: true },
            { label: 'Deep Score', value: tier3, color: COLORS.purple, icon: '⚖', arrow: true },
            { label: 'Selected', value: selected, color: COLORS.green, icon: '★', arrow: true },
          ].map(({ label, value, color, icon, arrow }, i) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center' }}>
              {arrow && <div style={{ color: COLORS.border, fontSize: 20, padding: '0 8px' }}>→</div>}
              <div style={{ textAlign: 'center', minWidth: 80 }}>
                <div style={{ fontSize: 22, fontWeight: 900, color, fontFamily: 'monospace' }}>{value}</div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{icon} {label}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: COLORS.muted }}>Overall scoring progress</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: COLORS.accent }}>{pipelineProgress}%</span>
          </div>
          <ProgressBar value={pipelineProgress} max={100} color={COLORS.accent} />
        </div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 14, marginBottom: 20 }}>
        <StatCard label="Unfiltered" value={unfiltered} color={COLORS.muted} sub="not yet pre-filtered" />
        <StatCard label="Auto-Rejected" value={autoRejected} color={COLORS.red} sub="Tier 1 fail" />
        <StatCard label="Quick Scored" value={quickScored} color={COLORS.accent} sub="Tier 2 done" />
        <StatCard label="Deep Scored" value={deepScored} color={COLORS.purple} sub="Tier 3 done" />
        <StatCard label="Selected" value={selected} color={COLORS.green} />
        <StatCard label="Avg Score" value={avgScore} color={COLORS.yellow} sub="effective score" />
      </div>

      {/* Category breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.white, marginBottom: 14 }}>Category Breakdown</div>
          {([['external', COLORS.accent, 'External'], ['host-college', COLORS.purple, 'Host College'], ['first-year', COLORS.green, '1st Year']] as const).map(([k, c, l]) => (
            <div key={k} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 13, color: COLORS.muted }}>{l}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: c }}>{cats[k]}</span>
              </div>
              <ProgressBar value={cats[k]} max={teams.length || 1} color={c} />
            </div>
          ))}
        </div>

        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.white, marginBottom: 14 }}>Tier Distribution</div>
          {([
            ['Unfiltered', unfiltered, COLORS.muted],
            ['Tier 1 Rejected', autoRejected, COLORS.red],
            ['Tier 2 (Quick Score)', tier2, COLORS.accent],
            ['Tier 3 (Deep Score)', tier3, COLORS.purple],
          ] as [string, number, string][]).map(([l, v, c]) => (
            <div key={l} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: COLORS.muted }}>{l}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: c }}>{v}</span>
              </div>
              <ProgressBar value={v} max={teams.length || 1} color={c} />
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 22 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.white, marginBottom: 14 }}>Quick Actions</div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {[
            { label: '➕ Add Team', v: 'add', color: COLORS.accent },
            { label: '⚡ Pre-Filter', v: 'prefilter', color: COLORS.yellow },
            { label: '✦ Quick Score', v: 'quickscore', color: COLORS.green },
            { label: '⚖ Deep Score', v: 'score', color: COLORS.purple },
            { label: '★ Rankings', v: 'rankings', color: COLORS.gold },
            { label: '⬇ Export CSV', v: 'export', color: COLORS.muted },
          ].map(({ label, v, color }) => (
            <Btn key={label} color={color} variant="outline"
              onClick={() => v === 'export' ? exportCSV(teams) : onNav(v)}>
              {label}
            </Btn>
          ))}
        </div>
      </div>
    </div>
  );
};
