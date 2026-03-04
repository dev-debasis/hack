import React, { useState, useEffect } from 'react';
import type { Team, Scores } from '../types';
import { COLORS, RUBRIC, GATES, calcSectionScores, checkGates, scoreVariance } from '../lib/constants';
import { ScorePill, GateChip, Slider, Badge } from '../components/UI';

interface Props {
  teams: Team[];
  onSaveScores: (teamId: string, evaluator: 'A' | 'B', scores: Scores, notes: string, currentTeam: Team) => Promise<void>;
}

export const Score: React.FC<Props> = ({ teams, onSaveScores }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [evaluator, setEvaluator] = useState<'A' | 'B'>('A');
  const [localScores, setLocalScores] = useState<Scores>({});
  const [localNotes, setLocalNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Tier 3: only teams explicitly escalated for deep review
  const scoreable = teams.filter(t => t.tier === 3);
  const selected = scoreable.find(t => t.id === selectedId) || null;

  useEffect(() => {
    if (selected) {
      const evalScores = evaluator === 'A' ? (selected.evalA || {}) : (selected.evalB || {});
      setLocalScores({ ...evalScores });
      setLocalNotes(selected.evalNotes?.[evaluator] || '');
    }
  }, [selectedId, evaluator]);

  const handleScore = (key: string, val: number) =>
    setLocalScores(s => ({ ...s, [key]: val }));

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    await onSaveScores(selected.id, evaluator, localScores, localNotes, selected);
    setSaving(false);
    const idx = scoreable.findIndex(t => t.id === selectedId);
    const next = scoreable.slice(idx + 1).find(t => {
      const ef = evaluator === 'A' ? t.evalA : t.evalB;
      return !ef || Object.keys(ef).length === 0;
    });
    if (next) setSelectedId(next.id);
  };

  const scoreSummary = calcSectionScores(localScores);
  const gates = checkGates(localScores);

  return (
    <div style={{ padding: '32px 0', display: 'grid', gridTemplateColumns: '270px 1fr', gap: 20, alignItems: 'start' }}>
      {/* Team list */}
      <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, overflow: 'hidden', position: 'sticky', top: 24 }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px solid ${COLORS.border}` }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.white }}>Deep Score — Tier 3</div>
          <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 4 }}>14 criteria · borderline teams only</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {(['A', 'B'] as const).map(e => (
              <button key={e} onClick={() => setEvaluator(e)} style={{
                flex: 1, padding: '7px', borderRadius: 6,
                border: `1px solid ${evaluator === e ? COLORS.accent : COLORS.border}`,
                background: evaluator === e ? COLORS.accent + '33' : 'transparent',
                color: evaluator === e ? COLORS.accent : COLORS.muted,
                cursor: 'pointer', fontWeight: 600, fontSize: 12,
              }}>Evaluator {e}</button>
            ))}
          </div>
        </div>
        <div style={{ maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>
          {scoreable.map(team => {
            const hasScore = evaluator === 'A'
              ? Object.keys(team.evalA || {}).length > 0
              : Object.keys(team.evalB || {}).length > 0;
            const s = calcSectionScores(team.scores || {});
            const varFlagged = Object.keys(team.evalA || {}).length > 0 &&
              Object.keys(team.evalB || {}).length > 0 &&
              scoreVariance(team.evalA, team.evalB) > GATES.variance;
            return (
              <div key={team.id} onClick={() => setSelectedId(team.id)} style={{
                padding: '10px 14px', cursor: 'pointer', borderBottom: `1px solid ${COLORS.border}`,
                background: selectedId === team.id ? COLORS.accent + '22' : 'transparent',
                borderLeft: `3px solid ${selectedId === team.id ? COLORS.accent : varFlagged ? COLORS.red : hasScore ? COLORS.green : COLORS.border}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 10, color: COLORS.muted, fontFamily: 'monospace' }}>{team.id}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.white }}>{team.name || '—'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {hasScore && <div style={{ fontSize: 13, fontWeight: 800, color: COLORS.accent, fontFamily: 'monospace' }}>{s.total}</div>}
                    {varFlagged && <div style={{ fontSize: 9, color: COLORS.red }}>VAR!</div>}
                    {!hasScore && <div style={{ fontSize: 11, color: COLORS.muted }}>unseen</div>}
                  </div>
                </div>
              </div>
            );
          })}
          {scoreable.length === 0 && (
            <div style={{ padding: 28, textAlign: 'center', color: COLORS.muted, fontSize: 12 }}>
              No teams escalated yet.<br />Use ⬆ Escalate button in Quick Score<br />for borderline teams.
            </div>
          )}
        </div>
      </div>

      {/* Scoring panel */}
      {selected ? (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12 }}>
          <div style={{ padding: '16px 22px', borderBottom: `1px solid ${COLORS.border}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ fontFamily: 'monospace', fontSize: 11, color: COLORS.purple }}>⬆ ESCALATED — Tier 3 Deep · Evaluator {evaluator}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: COLORS.white }}>{selected.name}</div>
                <div style={{ fontSize: 13, color: COLORS.muted, marginTop: 2 }}>{selected.members}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {selected.githubUrl && <a href={selected.githubUrl.split(',')[0].trim()} target="_blank" rel="noreferrer" style={{ padding: '6px 10px', background: COLORS.green + '22', border: `1px solid ${COLORS.green}44`, borderRadius: 7, color: COLORS.green, fontSize: 12 }}>GitHub ↗</a>}
                {selected.linkedinUrls && <a href={selected.linkedinUrls.split(',')[0].trim()} target="_blank" rel="noreferrer" style={{ padding: '6px 10px', background: '#0077b522', border: '1px solid #0077b544', borderRadius: 7, color: '#0077b5', fontSize: 12 }}>LinkedIn ↗</a>}
                {selected.bestWork && <a href={selected.bestWork} target="_blank" rel="noreferrer" style={{ padding: '6px 10px', background: COLORS.purple + '22', border: `1px solid ${COLORS.purple}44`, borderRadius: 7, color: COLORS.purple, fontSize: 12 }}>Best Work ↗</a>}
              </div>
            </div>
            {/* Show quick score context */}
            {Object.keys(selected.quickScores || {}).length > 0 && (
              <div style={{ marginTop: 10, padding: '8px 12px', background: COLORS.purple + '11', border: `1px solid ${COLORS.purple}33`, borderRadius: 8, fontSize: 12, color: COLORS.muted }}>
                Quick Score context: GH {selected.quickScores.githubActivity ?? '—'}/30 · LI {selected.quickScores.linkedinDepth ?? '—'}/20 · Team {selected.quickScores.teamBalance ?? '—'}/20 · BW {selected.quickScores.bestWorkQuality ?? '—'}/20 · Imp {selected.quickScores.overallImpression ?? '—'}/10
                {selected.quickNotes && <div style={{ marginTop: 4, fontStyle: 'italic' }}>"{selected.quickNotes}"</div>}
              </div>
            )}
          </div>

          {/* Score summary */}
          <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}` }}>
            {([
              { label: 'GitHub', score: scoreSummary.github, max: 35, color: COLORS.green },
              { label: 'LinkedIn', score: scoreSummary.linkedin, max: 25, color: '#0077b5' },
              { label: 'Team', score: scoreSummary.team, max: 25, color: COLORS.yellow },
              { label: 'Bonus', score: scoreSummary.bonus, max: 15, color: COLORS.purple },
              { label: 'TOTAL', score: scoreSummary.total, max: 100, color: gates.passed ? COLORS.green : COLORS.red },
            ] as const).map(({ label, score, max, color }, i) => (
              <div key={label} style={{
                flex: i === 4 ? '0 0 100px' : 1, padding: '12px 6px', textAlign: 'center',
                borderRight: i < 4 ? `1px solid ${COLORS.border}` : 'none',
                background: i === 4 ? (gates.passed ? COLORS.green + '11' : COLORS.red + '11') : 'transparent',
              }}>
                <ScorePill score={score} max={max} label={label} />
              </div>
            ))}
          </div>

          <div style={{ padding: '10px 22px', borderBottom: `1px solid ${COLORS.border}`, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <GateChip pass={gates.overall} label={`Overall ≥${GATES.overall}`} />
            <GateChip pass={gates.github} label={`GH ≥${GATES.github}`} />
            <GateChip pass={gates.linkedin} label={`LI ≥${GATES.linkedin}`} />
            <GateChip pass={gates.team} label={`Team ≥${GATES.team}`} />
            {Object.keys(selected.evalA || {}).length > 0 && Object.keys(selected.evalB || {}).length > 0 && (
              <GateChip pass={scoreVariance(selected.evalA, selected.evalB) <= GATES.variance}
                label={`Variance: ${scoreVariance(selected.evalA, selected.evalB).toFixed(1)}pts`} />
            )}
          </div>

          <div style={{ padding: '18px 22px', overflowY: 'auto', maxHeight: 'calc(100vh - 500px)' }}>
            {Object.entries(RUBRIC).map(([section, { label, color, criteria }]) => (
              <div key={section} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 4, height: 16, background: color, borderRadius: 2 }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.white }}>{label}</div>
                  {section === 'bonus' && <Badge color={COLORS.purple}>Optional</Badge>}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {criteria.map(({ id, label: cLabel, max, hints }) => (
                    <div key={id} style={{ background: COLORS.bg, borderRadius: 8, padding: '12px 14px' }}>
                      <div style={{ fontSize: 12, color: COLORS.white, marginBottom: 8, fontWeight: 500 }}>
                        <span style={{ color: COLORS.muted, fontFamily: 'monospace', marginRight: 8 }}>{id}</span>{cLabel}
                      </div>
                      <Slider id={id} value={Number((localScores as Record<string,number>)[id]) || 0}
                        max={max} onChange={v => handleScore(id, v)} hint={hints} />
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: COLORS.muted, marginBottom: 8 }}>
                Evaluator Notes <span style={{ color: COLORS.red }}>*</span>
              </div>
              <textarea value={localNotes} onChange={e => setLocalNotes(e.target.value)}
                placeholder={`Positive evidence: [finding]\nConcern: [finding]\nFlag: [if any]`} rows={4}
                style={{ width: '100%', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px', color: COLORS.text, fontSize: 13, outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>

            <button onClick={handleSave} disabled={saving} style={{
              background: saving ? COLORS.muted : COLORS.accent, color: COLORS.white, border: 'none',
              padding: '12px', borderRadius: 8, cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: 14, fontWeight: 700, width: '100%',
            }}>
              {saving ? 'Saving...' : 'Save Scores & Next →'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 12 }}>
          <div style={{ fontSize: 32 }}>⚖</div>
          <div style={{ color: COLORS.muted, fontSize: 15 }}>Select a team for deep scoring</div>
          <div style={{ color: COLORS.muted + '88', fontSize: 13 }}>Only borderline teams escalated from Tier 2</div>
        </div>
      )}
    </div>
  );
};
