import React, { useState } from 'react';
import type { Team } from '../types';
import { COLORS, INITIAL_TEAM, genId } from '../lib/constants';
import { Btn } from '../components/UI';

interface Props {
  onSave: (team: Omit<Team, '_id'>) => Promise<Team | null>;
  onCancel: () => void;
}

export const AddTeam: React.FC<Props> = ({ onSave, onCancel }) => {
  const [form, setForm] = useState<Omit<Team, '_id'>>({ ...INITIAL_TEAM, id: genId() });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = <K extends keyof Team>(k: K, v: Team[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Team name is required.'); return; }
    setSaving(true);
    setError('');
    const result = await onSave(form);
    setSaving(false);
    if (!result) setError('Failed to save. Check server connection.');
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: COLORS.card, border: `1px solid ${COLORS.border}`,
    borderRadius: 8, padding: '10px 14px', color: COLORS.text,
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.muted, marginBottom: 6,
  };

  return (
    <div style={{ padding: '32px 0', maxWidth: 700 }}>
      <h2 style={{ fontSize: 24, fontWeight: 800, color: COLORS.white, marginBottom: 8 }}>
        Add Team Application
      </h2>
      <p style={{ color: COLORS.muted, marginBottom: 28 }}>Enter application details from Devfolio</p>

      {/* Read-only ID */}
      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle}>Team ID</label>
        <input
          value={form.id} readOnly
          style={{ ...inputStyle, background: COLORS.bg, color: COLORS.muted }}
        />
      </div>

      {/* Team Name */}
      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle}>Team Name *</label>
        <input
          value={form.name}
          onChange={e => set('name', e.target.value)}
          placeholder="Team name from application"
          style={inputStyle}
        />
      </div>

      {/* Members */}
      <div style={{ marginBottom: 18 }}>
        <label style={labelStyle}>Member Names</label>
        <input
          value={form.members}
          onChange={e => set('members', e.target.value)}
          placeholder="Alice, Bob, Carol (comma separated)"
          style={inputStyle}
        />
      </div>

      {/* Category + Triage */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
        <div>
          <label style={labelStyle}>Category</label>
          <select value={form.category} onChange={e => set('category', e.target.value as Team['category'])}
            style={{ ...inputStyle }}>
            <option value="external">External Team</option>
            <option value="host-college">Host College</option>
            <option value="first-year">1st Year Students</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Initial Triage</label>
          <select value={form.triage} onChange={e => set('triage', e.target.value as Team['triage'])}
            style={{ ...inputStyle }}>
            <option value="green">🟢 Green — Fast Track</option>
            <option value="yellow">🟡 Yellow — Needs Review</option>
            <option value="red">🔴 Red — Likely Reject</option>
          </select>
        </div>
      </div>

      {/* Notes */}
      <div style={{ marginBottom: 28 }}>
        <label style={labelStyle}>Notes / Flags</label>
        <textarea
          value={form.notes}
          onChange={e => set('notes', e.target.value)}
          placeholder="Any red flags, observations, or context..."
          rows={3}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {error && (
        <div style={{
          marginBottom: 16, padding: '10px 14px',
          background: COLORS.red + '22', border: `1px solid ${COLORS.red}44`,
          borderRadius: 8, color: COLORS.red, fontSize: 13,
        }}>{error}</div>
      )}

      <div style={{ display: 'flex', gap: 12 }}>
        <Btn onClick={handleSave} disabled={saving} size="lg">
          {saving ? 'Saving...' : 'Save Team'}
        </Btn>
        <Btn onClick={onCancel} variant="ghost" size="lg">Cancel</Btn>
      </div>
    </div>
  );
};
