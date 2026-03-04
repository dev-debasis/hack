import React, { useState } from 'react';
import type { Team } from '../types';
import { COLORS, calcSectionScores, scoreVariance, GATES } from '../lib/constants';
import { Badge } from '../components/UI';

interface Props {
  teams: Team[];
  onUpdate: (id: string, updates: Partial<Team>) => Promise<void>;
}

export const Arbitration: React.FC<Props> = ({ teams, onUpdate }) => {
  const flagged = teams.filter(t =>
    Object.keys(t.evalA || {}).length > 0 &&
    Object.keys(t.evalB || {}).length > 0 &&
    scoreVariance(t.evalA, t.evalB) > GATES.variance
  );

  const [arbitData, setArbitData] = useState<Record<string, { score: string; note: string }>>({});

  const setArbit = (id: string, field: 'score' | 'note', val: string) =>
    setArbitData(d => ({ ...d, [id]: { ...d[id], [field]: val } }));

  const applyArbitration = async (team: Team) => {
    const d = arbitData[team.id];
    if (!d?.score) return;
    const total = Number(d.score);
    if (isNaN(total) || total < 0 || total > 100) return;

    await onUpdate(team.id, {
      evalArbitrated: true,
      evalNotes: { ...team.evalNotes, C: d.note || '' },
      scores: { ...team.scores, _arbitratedTotal: total },
    });
  };

  return (
    <div style={{ padding: '32px 0' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: COLORS.white, margin: 0 }}>Arbitration Queue</h2>
        <p style={{ color: COLORS.muted, marginTop: 6 }}>
          {flagged.length} team{flagged.length !== 1 ? 's' : ''} with evaluator variance &gt;{GATES.variance} points require a 3rd reviewer.
        </p>
      </div>

      {flagged.length === 0 && (
        <div style={{
          background: COLORS.card, border: `1px solid ${COLORS.green}44`,
          borderRadius: 12, padding: 48, textAlign: 'center',
        }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>✓</div>
          <div style={{ color: COLORS.green, fontWeight: 700, fontSize: 16 }}>No arbitration needed</div>
          <div style={{ color: COLORS.muted, marginTop: 6, fontSize: 14 }}>
            All evaluated teams have evaluator variance within ±{GATES.variance} points
          </div>
        </div>
      )}

      {flagged.map(team => {
        const sa = calcSectionScores(team.evalA).total;
        const sb = calcSectionScores(team.evalB).total;
        const variance = Math.abs(sa - sb);
        const d = arbitData[team.id] || { score: '', note: '' };
        const isArbitrated = team.evalArbitrated;

        return (
          <div
            key={team.id}
            style={{
              background: COLORS.card,
              border: `1px solid ${isArbitrated ? COLORS.green + '44' : COLORS.red + '44'}`,
              borderRadius: 12, marginBottom: 20,
            }}
          >
            {/* Header */}
            <div style={{
              padding: '14px 22px', borderBottom: `1px solid ${COLORS.border}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <span style={{ fontFamily: 'monospace', color: COLORS.muted, fontSize: 12 }}>{team.id}</span>
                <span style={{ fontSize: 16, fontWeight: 700, color: COLORS.white, marginLeft: 12 }}>{team.name}</span>
                {isArbitrated && <span style={{ marginLeft: 10 }}><Badge color={COLORS.green}>Resolved</Badge></span>}
              </div>
              <Badge color={COLORS.red}>Variance: {variance.toFixed(1)} pts</Badge>
            </div>

            {/* Eval A vs B */}
            <div style={{ padding: '16px 22px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {([['A', sa, team.evalNotes?.A], ['B', sb, team.evalNotes?.B]] as const).map(([ev, score, note]) => (
                <div key={ev} style={{ background: COLORS.bg, borderRadius: 8, padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.muted, marginBottom: 8 }}>
                    EVALUATOR {ev} — <span style={{ color: COLORS.accent, fontFamily: 'monospace' }}>{score} pts</span>
                  </div>
                  {note
                    ? <div style={{ fontSize: 12, color: COLORS.text, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{note}</div>
                    : <div style={{ fontSize: 12, color: COLORS.muted, fontStyle: 'italic' }}>No notes submitted</div>
                  }
                </div>
              ))}
            </div>

            {/* Arbitrator input */}
            <div style={{ padding: '0 22px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.muted, marginBottom: 8 }}>
                Arbitrator Override (Evaluator C)
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <textarea
                    value={d.note}
                    onChange={e => setArbit(team.id, 'note', e.target.value)}
                    placeholder="Arbitrator reasoning — explain the final score decision..."
                    rows={2}
                    style={{
                      width: '100%', background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                      borderRadius: 8, padding: '10px 12px', color: COLORS.text, fontSize: 13,
                      outline: 'none', resize: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input
                    type="number" min={0} max={100}
                    placeholder="Score"
                    value={d.score}
                    onChange={e => setArbit(team.id, 'score', e.target.value)}
                    style={{
                      width: 90, background: COLORS.bg, border: `1px solid ${COLORS.accent}`,
                      borderRadius: 8, padding: '10px 12px', color: COLORS.accent, fontSize: 18,
                      fontWeight: 800, fontFamily: 'monospace', outline: 'none', textAlign: 'center',
                    }}
                  />
                  <button
                    onClick={() => applyArbitration(team)}
                    disabled={!d.score}
                    style={{
                      background: d.score ? COLORS.accent : COLORS.muted,
                      color: COLORS.white, border: 'none', borderRadius: 8,
                      padding: '10px 12px', cursor: d.score ? 'pointer' : 'not-allowed',
                      fontSize: 13, fontWeight: 700,
                    }}
                  >Apply</button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
