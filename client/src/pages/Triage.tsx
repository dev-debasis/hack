import React, { useState } from 'react';
import type { Team } from '../types';
import { COLORS } from '../lib/constants';
import { Badge } from '../components/UI';

interface Props {
  teams: Team[];
  onUpdate: (id: string, updates: Partial<Team>) => Promise<void>;
}

type FilterType = 'all' | 'green' | 'yellow' | 'red';

const TRIAGE_COLOR: Record<string, string> = {
  green: COLORS.green, yellow: COLORS.yellow, red: COLORS.red,
};

const CAT_COLOR: Record<string, string> = {
  external: COLORS.accent, 'host-college': COLORS.purple, 'first-year': COLORS.green,
};

export const Triage: React.FC<Props> = ({ teams, onUpdate }) => {
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = filter === 'all' ? teams : teams.filter(t => t.triage === filter);

  return (
    <div style={{ padding: '32px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: COLORS.white, margin: 0 }}>Layer 1 — Rapid Triage</h2>
          <p style={{ color: COLORS.muted, marginTop: 6 }}>~2 minutes per team. Bucket into Green / Yellow / Red.</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['all', 'green', 'yellow', 'red'] as FilterType[]).map(f => {
            const count = f === 'all' ? teams.length : teams.filter(t => t.triage === f).length;
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600,
                  border: `1px solid ${filter === f ? COLORS.accent : COLORS.border}`,
                  background: filter === f ? COLORS.accent + '33' : 'transparent',
                  color: filter === f ? COLORS.accent : COLORS.muted,
                }}
              >
                {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Team list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(team => (
          <div
            key={team.id}
            style={{
              background: COLORS.card,
              border: `1px solid ${TRIAGE_COLOR[team.triage] || COLORS.border}44`,
              borderRadius: 12, padding: '16px 20px',
              display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap',
            }}
          >
            {/* ID + name */}
            <div style={{ flex: '0 0 120px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: 12, color: COLORS.muted }}>{team.id}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: COLORS.white, marginTop: 2 }}>{team.name || '—'}</div>
              <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 2 }}>{team.college || 'No college'}</div>
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                <Badge color={CAT_COLOR[team.category] || COLORS.accent}>{team.category}</Badge>
                {team.githubUrl && (
                  <a href={team.githubUrl.split(',')[0].trim()} target="_blank" rel="noreferrer"
                    style={{ color: COLORS.green, fontSize: 12 }}>GitHub ↗</a>
                )}
                {team.linkedinUrls && (
                  <a href={team.linkedinUrls.split(',')[0].trim()} target="_blank" rel="noreferrer"
                    style={{ color: '#0077b5', fontSize: 12 }}>LinkedIn ↗</a>
                )}
                {team.bestWork && (
                  <a href={team.bestWork} target="_blank" rel="noreferrer"
                    style={{ color: COLORS.purple, fontSize: 12 }}>Best Work ↗</a>
                )}
              </div>
              <div style={{ fontSize: 13, color: COLORS.muted }}>{team.members || 'No members listed'}</div>
              {team.notes && (
                <div style={{ fontSize: 12, color: COLORS.yellow, marginTop: 4 }}>⚑ {team.notes}</div>
              )}
            </div>

            {/* Triage buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
              <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 600, letterSpacing: '0.06em' }}>TRIAGE</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['green', 'yellow', 'red'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => onUpdate(team.id, { triage: t })}
                    title={t.charAt(0).toUpperCase() + t.slice(1)}
                    style={{
                      width: 34, height: 34, borderRadius: 8,
                      border: `2px solid ${TRIAGE_COLOR[t]}`,
                      background: team.triage === t ? TRIAGE_COLOR[t] + '55' : 'transparent',
                      cursor: 'pointer', fontSize: 15,
                      outline: team.triage === t ? `2px solid ${TRIAGE_COLOR[t]}` : 'none',
                      outlineOffset: 1,
                    }}
                  >
                    {t === 'green' ? '🟢' : t === 'yellow' ? '🟡' : '🔴'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{
            textAlign: 'center', padding: 60, color: COLORS.muted,
            background: COLORS.card, borderRadius: 12, border: `1px solid ${COLORS.border}`,
          }}>
            No teams in this bucket yet.
          </div>
        )}
      </div>
    </div>
  );
};
