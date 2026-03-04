import React, { useState } from 'react';
import type { Team, SelectionCaps } from '../types';
import { COLORS, calcEffectiveScore, calcQuickScores, calcSectionScores, checkQuickGates, checkGates, scoreVariance, GATES, exportCSV } from '../lib/constants';
import { Badge, Btn } from '../components/UI';

interface Props {
  teams: Team[];
  onUpdate: (id: string, updates: Partial<Team>) => Promise<void>;
  onBulkApply: (caps: SelectionCaps) => Promise<void>;
}

const STATUS_COLOR: Record<string, string> = {
  selected: COLORS.green, waitlist: COLORS.yellow, rejected: COLORS.red, pending: COLORS.muted,
};
const CAT_COLOR: Record<string, string> = {
  external: COLORS.accent, 'host-college': COLORS.purple, 'first-year': COLORS.green,
};

export const Rankings: React.FC<Props> = ({ teams, onUpdate, onBulkApply }) => {
  const [caps, setCaps] = useState<SelectionCaps>({ firstYear: 7, hostCollege: 12, total: 80 });
  const [showCaps, setShowCaps] = useState(false);
  const [applying, setApplying] = useState(false);

  // Include any team that has been scored at any tier
  const scored = teams.filter(t => calcEffectiveScore(t) > 0);
  const ranked = [...scored].sort((a, b) => calcEffectiveScore(b) - calcEffectiveScore(a));

  const isEligible = (team: Team) => {
    if (team.tier === 3 && Object.keys(team.scores || {}).length > 0) return checkGates(team.scores).passed;
    if (Object.keys(team.quickScores || {}).length > 0) return checkQuickGates(team.quickScores).passed;
    return false;
  };

  const handleApply = async () => {
    setApplying(true);
    await onBulkApply(caps);
    setApplying(false);
  };

  return (
    <div style={{ padding: '32px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: COLORS.white, margin: 0 }}>Final Rankings & Selection</h2>
          <p style={{ color: COLORS.muted, marginTop: 6 }}>
            {scored.length} teams scored · {ranked.filter(isEligible).length} pass gates
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Btn onClick={() => setShowCaps(s => !s)} variant="ghost">⚙ Configure Caps</Btn>
          <Btn onClick={handleApply} disabled={applying}>{applying ? 'Applying...' : '🎯 Apply Selection Caps'}</Btn>
          <Btn onClick={() => exportCSV(teams)} variant="ghost">⬇ Export CSV</Btn>
        </div>
      </div>

      {showCaps && (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 22, marginBottom: 22 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.white, marginBottom: 14 }}>Category Cap Configuration</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {([
              { key: 'total', label: 'Total Slots', color: COLORS.white },
              { key: 'firstYear', label: '1st Year Reserved', color: COLORS.green },
              { key: 'hostCollege', label: 'Host College Max', color: COLORS.purple },
            ] as const).map(({ key, label, color }) => (
              <div key={key}>
                <div style={{ fontSize: 12, color: COLORS.muted, marginBottom: 8 }}>{label}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input type="number" min={0} max={500} value={caps[key]}
                    onChange={e => setCaps(c => ({ ...c, [key]: Number(e.target.value) }))}
                    style={{ width: 80, background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '8px 10px', color, fontSize: 20, fontWeight: 800, fontFamily: 'monospace', outline: 'none', textAlign: 'center' }} />
                  <span style={{ fontSize: 12, color: COLORS.muted }}>teams</span>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: COLORS.muted }}>
            External slots = {Math.max(0, caps.total - caps.firstYear - caps.hostCollege)}
          </div>
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'grid', gridTemplateColumns: '44px 52px 1fr 110px 60px 60px 110px', gap: 10, padding: '6px 14px', fontSize: 10, fontWeight: 700, color: COLORS.muted, letterSpacing: '0.08em' }}>
        <span>RANK</span><span>ID</span><span>TEAM</span><span>CATEGORY</span>
        <span style={{ textAlign: 'center' }}>TIER</span>
        <span style={{ textAlign: 'center' }}>SCORE</span>
        <span style={{ textAlign: 'center' }}>STATUS</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {ranked.map((team, idx) => {
          const effective = calcEffectiveScore(team);
          const eligible = isEligible(team);
          const isDeep = team.tier === 3;
          const varFlagged = isDeep && Object.keys(team.evalA || {}).length > 0 &&
            Object.keys(team.evalB || {}).length > 0 &&
            scoreVariance(team.evalA, team.evalB) > GATES.variance;

          return (
            <div key={team.id} style={{
              display: 'grid', gridTemplateColumns: '44px 52px 1fr 110px 60px 60px 110px',
              gap: 10, padding: '10px 14px', alignItems: 'center',
              background: COLORS.card,
              border: `1px solid ${!eligible ? COLORS.red + '33' : varFlagged ? COLORS.yellow + '44' : COLORS.border}`,
              borderRadius: 10, opacity: !eligible ? 0.65 : 1,
            }}>
              <span style={{ fontSize: 14, fontWeight: 800, fontFamily: 'monospace', color: idx < 10 ? COLORS.gold : COLORS.muted }}>
                #{idx + 1}
              </span>
              <span style={{ fontSize: 10, color: COLORS.muted, fontFamily: 'monospace' }}>{team.id}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.white, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.name}</div>
                <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{team.members}</div>
              </div>
              <Badge color={CAT_COLOR[team.category] || COLORS.accent}>{team.category}</Badge>
              <div style={{ textAlign: 'center' }}>
                <Badge color={isDeep ? COLORS.purple : COLORS.accent}>
                  {isDeep ? 'Deep' : 'Quick'}
                </Badge>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: eligible ? COLORS.green : COLORS.red, fontFamily: 'monospace' }}>{effective}</div>
                <div style={{ fontSize: 9, color: COLORS.muted }}>/100</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                {varFlagged ? (
                  <Badge color={COLORS.red}>ARBITRATE</Badge>
                ) : !eligible ? (
                  <Badge color={COLORS.red}>FAIL GATE</Badge>
                ) : (
                  <select value={team.status} onChange={e => onUpdate(team.id, { status: e.target.value as Team['status'] })}
                    style={{ background: COLORS.bg, border: `1px solid ${STATUS_COLOR[team.status] || COLORS.border}`, borderRadius: 6, padding: '4px 6px', color: STATUS_COLOR[team.status] || COLORS.muted, fontSize: 11, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                    <option value="pending">Pending</option>
                    <option value="selected">Selected</option>
                    <option value="waitlist">Waitlist</option>
                    <option value="rejected">Rejected</option>
                  </select>
                )}
              </div>
            </div>
          );
        })}
        {ranked.length === 0 && (
          <div style={{ textAlign: 'center', padding: 80, color: COLORS.muted, background: COLORS.card, borderRadius: 12, border: `1px solid ${COLORS.border}` }}>
            No scored teams yet. Complete Quick Score (Tier 2) first.
          </div>
        )}
      </div>
    </div>
  );
};
