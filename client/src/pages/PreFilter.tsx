import React, { useState } from 'react';
import type { Team, Tier1Answers } from '../types';
import { COLORS, TIER1_QUESTIONS, getTier1Result } from '../lib/constants';

interface Props {
  teams: Team[];
  onUpdate: (id: string, updates: Partial<Team>) => Promise<void>;
}

const CAT_COLOR: Record<string, string> = {
  external: COLORS.accent, 'host-college': COLORS.purple, 'first-year': COLORS.green,
};

type FilterMode = 'all' | 'unfiltered' | 'tier2' | 'rejected';

export const PreFilter: React.FC<Props> = ({ teams, onUpdate }) => {
  const [filter, setFilter] = useState<FilterMode>('unfiltered');

  const categorized = {
    unfiltered: teams.filter(t => t.tier === null && t.status !== 'rejected'),
    tier2: teams.filter(t => t.tier === 2 || t.tier === 3),
    rejected: teams.filter(t => t.status === 'rejected' && t.tier === null),
  };

  const filtered =
    filter === 'all' ? teams :
    filter === 'unfiltered' ? categorized.unfiltered :
    filter === 'tier2' ? categorized.tier2 :
    categorized.rejected;

  const handleAnswer = async (team: Team, q: keyof Tier1Answers, val: boolean) => {
    const newAnswers: Tier1Answers = { ...team.tier1Answers, [q]: val };
    const result = getTier1Result(newAnswers);

    const updates: Partial<Team> = { tier1Answers: newAnswers };

    if (result.autoReject) {
      updates.status = 'rejected';
      updates.tier = null;
      updates.triage = 'red';
    } else if (result.tier === 2) {
      updates.tier = 2;
      updates.status = 'pending';
      updates.triage = result.yesCount === 3 ? 'green' : 'yellow';
    }

    await onUpdate(team.id, updates);
  };

  const resetFilter = async (team: Team) => {
    await onUpdate(team.id, {
      tier: null,
      tier1Answers: { q1: null, q2: null, q3: null },
      status: 'pending',
      triage: 'yellow',
    });
  };

  const filterCounts: Record<FilterMode, number> = {
    all: teams.length,
    unfiltered: categorized.unfiltered.length,
    tier2: categorized.tier2.length,
    rejected: categorized.rejected.length,
  };

  const filterLabels: Record<FilterMode, string> = {
    all: 'All',
    unfiltered: 'Pending',
    tier2: 'Passed →',
    rejected: 'Auto-Rejected',
  };

  return (
    <div style={{ padding: '32px 0' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: COLORS.white, margin: 0 }}>
          Tier 1 — Pre-Filter
        </h2>
        <p style={{ color: COLORS.muted, marginTop: 6 }}>
          ~90 seconds per team. Answer 3 binary questions — auto-routes to Quick Score or rejects.
        </p>
      </div>

      {/* Routing legend */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { icon: '✓✓✓', label: '3/3 Yes → Quick Score (fast-track)', color: COLORS.green },
          { icon: '✓✓✗', label: '2/3 Yes → Quick Score (borderline)', color: COLORS.yellow },
          { icon: '✗', label: '0–1 Yes → Auto-Rejected', color: COLORS.red },
        ].map(({ icon, label, color }) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
            background: color + '11', border: `1px solid ${color}33`, borderRadius: 8,
          }}>
            <span style={{ fontSize: 13, color, fontWeight: 700 }}>{icon}</span>
            <span style={{ fontSize: 12, color: COLORS.muted }}>{label}</span>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {(['all', 'unfiltered', 'tier2', 'rejected'] as FilterMode[]).map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{
            padding: '7px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
            border: `1px solid ${filter === f ? COLORS.accent : COLORS.border}`,
            background: filter === f ? COLORS.accent + '33' : 'transparent',
            color: filter === f ? COLORS.accent : COLORS.muted,
          }}>
            {filterLabels[f]} ({filterCounts[f]})
          </button>
        ))}
      </div>

      {/* Team cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(team => {
          const result = getTier1Result(team.tier1Answers || { q1: null, q2: null, q3: null });
          const answeredCount = [team.tier1Answers?.q1, team.tier1Answers?.q2, team.tier1Answers?.q3].filter(v => v !== null).length;
          const isRejected = result.autoReject || (team.status === 'rejected' && team.tier === null);
          const isPassed = team.tier === 2 || team.tier === 3;

          return (
            <div key={team.id} style={{
              background: COLORS.card,
              border: `1px solid ${isRejected ? COLORS.red + '44' : isPassed ? COLORS.green + '44' : COLORS.border}`,
              borderRadius: 12, overflow: 'hidden',
            }}>
              {/* Team info row */}
              <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', borderBottom: `1px solid ${COLORS.border}` }}>
                <div style={{ flex: '0 0 110px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: 11, color: COLORS.muted }}>{team.id}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.white }}>{team.name || '—'}</div>
                </div>
                <div style={{ flex: 1, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                  <span style={{
                    background: (CAT_COLOR[team.category] || COLORS.accent) + '22',
                    color: CAT_COLOR[team.category] || COLORS.accent,
                    border: `1px solid ${(CAT_COLOR[team.category] || COLORS.accent)}44`,
                    borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600,
                  }}>{team.category}</span>
                  <span style={{ fontSize: 13, color: COLORS.muted }}>{team.members || 'No members'}</span>
                  {team.githubUrl && <a href={team.githubUrl.split(',')[0].trim()} target="_blank" rel="noreferrer" style={{ color: COLORS.green, fontSize: 12 }}>GitHub ↗</a>}
                  {team.linkedinUrls && <a href={team.linkedinUrls.split(',')[0].trim()} target="_blank" rel="noreferrer" style={{ color: '#0077b5', fontSize: 12 }}>LinkedIn ↗</a>}
                </div>

                {/* Status badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {isRejected && (
                    <span style={{ background: COLORS.red + '22', color: COLORS.red, border: `1px solid ${COLORS.red}44`, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
                      AUTO-REJECTED ({answeredCount}/3)
                    </span>
                  )}
                  {isPassed && (
                    <span style={{ background: COLORS.green + '22', color: COLORS.green, border: `1px solid ${COLORS.green}44`, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
                      TIER 2 ({result.yesCount}/3 ✓)
                    </span>
                  )}
                  {!isRejected && !isPassed && (
                    <span style={{ color: COLORS.muted, fontSize: 12 }}>{answeredCount}/3 answered</span>
                  )}
                  {(isRejected || isPassed) && (
                    <button onClick={() => resetFilter(team)} style={{
                      background: 'transparent', border: `1px solid ${COLORS.border}`,
                      borderRadius: 6, padding: '3px 10px', color: COLORS.muted,
                      fontSize: 11, cursor: 'pointer',
                    }}>Reset</button>
                  )}
                </div>
              </div>

              {/* Questions row */}
              <div style={{ padding: '12px 20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                {TIER1_QUESTIONS.map(q => {
                  const answer = team.tier1Answers?.[q.id] ?? null;
                  return (
                    <div key={q.id} style={{
                      background: COLORS.bg, borderRadius: 8, padding: '12px 14px',
                      border: `1px solid ${answer === true ? COLORS.green + '44' : answer === false ? COLORS.red + '44' : COLORS.border}`,
                    }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.muted, marginBottom: 4, letterSpacing: '0.05em' }}>
                        {q.label.toUpperCase()}
                      </div>
                      <div style={{ fontSize: 12, color: COLORS.text, marginBottom: 10, lineHeight: 1.5 }}>
                        {q.question}
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          onClick={() => handleAnswer(team, q.id, true)}
                          style={{
                            flex: 1, padding: '6px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                            border: `1px solid ${answer === true ? COLORS.green : COLORS.border}`,
                            background: answer === true ? COLORS.green + '33' : 'transparent',
                            color: answer === true ? COLORS.green : COLORS.muted,
                          }}
                        >✓ Yes</button>
                        <button
                          onClick={() => handleAnswer(team, q.id, false)}
                          style={{
                            flex: 1, padding: '6px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                            border: `1px solid ${answer === false ? COLORS.red : COLORS.border}`,
                            background: answer === false ? COLORS.red + '33' : 'transparent',
                            color: answer === false ? COLORS.red : COLORS.muted,
                          }}
                        >✗ No</button>
                      </div>
                      <div style={{ marginTop: 8, fontSize: 11, color: COLORS.muted, lineHeight: 1.4 }}>
                        {answer === true ? `✓ ${q.yesHint}` : answer === false ? `✗ ${q.noHint}` : q.yesHint}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center', padding: 60, color: COLORS.muted,
            background: COLORS.card, borderRadius: 12, border: `1px solid ${COLORS.border}`,
          }}>
            {filter === 'unfiltered' ? 'All teams have been pre-filtered. 🎉' : 'No teams in this group.'}
          </div>
        )}
      </div>
    </div>
  );
};
