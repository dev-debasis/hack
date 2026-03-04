import React, { useState, useEffect } from 'react';
import type { Team, QuickScores } from '../types';
import { COLORS, QUICK_RUBRIC, QUICK_GATES, calcQuickScores, checkQuickGates } from '../lib/constants';
import { Slider, Badge, GateChip } from '../components/UI';

interface Props {
  teams: Team[];
  onSave: (id: string, quickScores: QuickScores, notes: string) => Promise<void>;
  onEscalate: (id: string) => Promise<void>;
}

export const QuickScore: React.FC<Props> = ({ teams, onSave, onEscalate }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [localScores, setLocalScores] = useState<QuickScores>({});
  const [localNotes, setLocalNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Only show teams that passed Tier 1 and haven't been deep-scored yet
  const scoreable = teams.filter(t => t.tier === 2 || t.tier === 3);
  const selected = scoreable.find(t => t.id === selectedId) || null;

  useEffect(() => {
    if (selected) {
      setLocalScores({ ...selected.quickScores });
      setLocalNotes(selected.quickNotes || '');
    }
  }, [selectedId]);

  const handleScore = (key: keyof QuickScores, val: number) =>
    setLocalScores(s => ({ ...s, [key]: val }));

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    await onSave(selected.id, localScores, localNotes);
    setSaving(false);
    // Advance to next unscored
    const idx = scoreable.findIndex(t => t.id === selectedId);
    const next = scoreable.slice(idx + 1).find(t => !t.quickScores || Object.keys(t.quickScores).length === 0);
    if (next) setSelectedId(next.id);
  };

  const handleEscalate = async () => {
    if (!selected) return;
    await onEscalate(selected.id);
  };

  const qs = calcQuickScores(localScores);
  const gates = checkQuickGates(localScores);
  const hasAnyScore = Object.keys(localScores).length > 0;
  const totalMax = QUICK_RUBRIC.reduce((s, r) => s + r.max, 0);

  return (
    <div style={{ padding: '32px 0', display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, alignItems: 'start' }}>

      {/* Team list */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: 'hidden', position: 'sticky', top: 24 }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.white }}>Quick Score — Tier 2</div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 4 }}>5 dimensions · ~5 min per team</div>
        </div>
        <div style={{ maxHeight: 'calc(100vh - 260px)', overflowY: 'auto' }}>
          {scoreable.map(team => {
            const hasScore = Object.keys(team.quickScores || {}).length > 0;
            const qs2 = calcQuickScores(team.quickScores || {});
            const isDeep = team.tier === 3;
            return (
              <div key={team.id} onClick={() => setSelectedId(team.id)} style={{
                padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${COLORS.border}`,
                background: selectedId === team.id ? COLORS.accent + '22' : 'transparent',
                borderLeft: `3px solid ${selectedId === team.id ? COLORS.accent : isDeep ? COLORS.purple : hasScore ? COLORS.green : COLORS.border}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 10, color: COLORS.muted, fontFamily: 'monospace' }}>{team.id}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.white }}>{team.name || '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {isDeep && <div style={{ fontSize: 10, color: COLORS.purple, fontWeight: 700 }}>DEEP↑</div>}
                    {hasScore && !isDeep && <div style={{ fontSize: 14, fontWeight: 800, color: COLORS.accent, fontFamily: 'monospace' }}>{qs2.total}</div>}
                    {!hasScore && !isDeep && <div style={{ fontSize: 11, color: COLORS.muted }}>unseen</div>}
                  </div>
                </div>
              </div>
            );
          })}
          {scoreable.length === 0 && (
            <div style={{ padding: 32, textAlign: 'center', color: COLORS.muted, fontSize: 13 }}>
              No teams passed Tier 1 yet.<br />Complete Pre-Filter first.
            </div>
          )}
        </div>
      </div>

      {/* Scoring panel */}
      {selected ? (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12 }}>
          {/* Header */}
          <div style={{ padding: '16px 22px', borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: COLORS.muted }}>{selected.id} · Tier 2 Quick Score</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.white }}>{selected.name}</div>
                <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>{selected.members}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {selected.githubUrl && <a href={selected.githubUrl.split(',')[0].trim()} target="_blank" rel="noreferrer" style={{ padding: '6px 12px', background: COLORS.green + '22', border: `1px solid ${COLORS.green}44`, borderRadius: 7, color: COLORS.green, fontSize: 12 }}>GitHub ↗</a>}
                {selected.linkedinUrls && <a href={selected.linkedinUrls.split(',')[0].trim()} target="_blank" rel="noreferrer" style={{ padding: '6px 12px', background: '#0077b522', border: '1px solid #0077b544', borderRadius: 7, color: '#0077b5', fontSize: 12 }}>LinkedIn ↗</a>}
                {selected.bestWork && <a href={selected.bestWork} target="_blank" rel="noreferrer" style={{ padding: '6px 12px', background: COLORS.purple + '22', border: `1px solid ${COLORS.purple}44`, borderRadius: 7, color: COLORS.purple, fontSize: 12 }}>Best Work ↗</a>}
                <button onClick={handleEscalate} title="Send to Tier 3 Deep Score for borderline review" style={{
                  padding: '6px 12px', background: COLORS.purple + '22', border: `1px solid ${COLORS.purple}44`,
                  borderRadius: 7, color: COLORS.purple, fontSize: 12, cursor: 'pointer', fontWeight: 600,
                }}>⬆ Escalate to Deep</button>
              </div>
            </div>
          </div>

          {/* Score summary bar */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}` }}>
            {QUICK_RUBRIC.map(({ id, label, max, color }, i) => {
              const score = Number((localScores as Record<string,number>)[id]) || 0;
              return (
                <div key={id} style={{
                  flex: 1, padding: '12px 6px', textAlign: 'center',
                  borderRight: i < QUICK_RUBRIC.length - 1 ? `1px solid ${COLORS.border}` : 'none',
                }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color, fontFamily: 'monospace' }}>{score}</div>
                  <div style={{ fontSize: 10, color: COLORS.muted }}>/{max}</div>
                  <div style={{ fontSize: 10, color: COLORS.muted, marginTop: 2 }}>{label.split(' ')[0]}</div>
                </div>
              );
            })}
            <div style={{
              flex: '0 0 90px', padding: '12px 6px', textAlign: 'center',
              background: gates.passed ? COLORS.green + '11' : COLORS.red + '11',
              borderLeft: `1px solid ${COLORS.border}`,
            }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: gates.passed ? COLORS.green : COLORS.red, fontFamily: 'monospace' }}>{qs.total}</div>
              <div style={{ fontSize: 10, color: COLORS.muted }}>/{totalMax}</div>
              <div style={{ fontSize: 10, color: gates.passed ? COLORS.green : COLORS.red, marginTop: 2, fontWeight: 700 }}>
                {gates.passed ? 'PASS' : 'FAIL'}
              </div>
            </div>
          </div>

          {/* Gate chips */}
          <div style={{ padding: '10px 22px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <GateChip pass={gates.overall} label={`Overall ≥${QUICK_GATES.overall}`} />
            <GateChip pass={gates.github} label={`GH Activity ≥${QUICK_GATES.github}`} />
            <GateChip pass={gates.linkedin} label={`LinkedIn ≥${QUICK_GATES.linkedin}`} />
            <GateChip pass={gates.team} label={`Team ≥${QUICK_GATES.team}`} />
          </div>

          {/* 5 sliders */}
          <div style={{ padding: '20px 22px', overflowY: 'auto', maxHeight: 'calc(100vh - 440px)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
              {QUICK_RUBRIC.map(({ id, label, max, color, description, hints }) => (
                <div key={id} style={{ background: COLORS.bg, borderRadius: 8, padding: '14px 16px', borderLeft: `3px solid ${color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.white }}>{label}</div>
                      <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{description}</div>
                    </div>
                    {id === 'bestWorkQuality' && <Badge color={COLORS.purple}>0 = no penalty</Badge>}
                  </div>
                  <Slider
                    id={id}
                    value={Number((localScores as Record<string,number>)[id]) || 0}
                    max={max}
                    onChange={v => handleScore(id as keyof QuickScores, v)}
                    hint={hints as unknown as readonly string[]}
                  />
                </div>
              ))}
            </div>

            {/* Notes */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.muted, marginBottom: 8 }}>Quick Notes</div>
              <textarea
                value={localNotes}
                onChange={e => setLocalNotes(e.target.value)}
                placeholder="Key observations — strengths, concerns, any flags..."
                rows={3}
                style={{
                  width: '100%', background: COLORS.bg, border: `1px solid ${COLORS.border}`,
                  borderRadius: 8, padding: '10px 12px', color: COLORS.text, fontSize: 13,
                  outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={handleSave} disabled={saving} style={{
                flex: 1, background: saving ? COLORS.muted : COLORS.accent, color: COLORS.white, border: 'none',
                padding: '12px', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer',
                fontSize: 14, fontWeight: 700,
              }}>
                {saving ? 'Saving...' : 'Save & Next →'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 400, gap: 12,
        }}>
          <div style={{ fontSize: 32 }}>✦</div>
          <div style={{ color: COLORS.muted, fontSize: 15 }}>Select a team to begin quick scoring</div>
          <div style={{ color: COLORS.muted + '88', fontSize: 13 }}>5 dimensions · ~5 minutes per team</div>
        </div>
      )}
    </div>
  );
};
