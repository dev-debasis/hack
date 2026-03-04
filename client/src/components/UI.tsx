import React, { useState } from 'react';
import { COLORS } from '../lib/constants';

// ─── Badge ────────────────────────────────────────────────────────────────────
export const Badge: React.FC<{ children: React.ReactNode; color?: string; size?: 'sm' | 'md' }> = ({
  children, color = COLORS.accent, size = 'sm'
}) => (
  <span style={{
    background: color + '22', color, border: `1px solid ${color}44`,
    borderRadius: 4, padding: size === 'sm' ? '2px 8px' : '4px 12px',
    fontSize: size === 'sm' ? 11 : 13, fontWeight: 600, letterSpacing: '0.04em',
    whiteSpace: 'nowrap', display: 'inline-block',
  }}>{children}</span>
);

// ─── ScorePill ────────────────────────────────────────────────────────────────
export const ScorePill: React.FC<{ score: number; max: number; label?: string }> = ({ score, max, label }) => {
  const pct = max > 0 ? score / max : 0;
  const color = pct >= 0.8 ? COLORS.green : pct >= 0.5 ? COLORS.yellow : COLORS.red;
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace" }}>
        {score}<span style={{ fontSize: 13, color: COLORS.muted }}>/{max}</span>
      </div>
      {label && <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{label}</div>}
    </div>
  );
};

// ─── GateChip ─────────────────────────────────────────────────────────────────
export const GateChip: React.FC<{ pass: boolean; label: string }> = ({ pass, label }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 5, padding: '3px 8px',
    background: pass ? '#00d08422' : '#f43f5e22',
    border: `1px solid ${pass ? '#00d08444' : '#f43f5e44'}`, borderRadius: 20,
  }}>
    <span style={{ fontSize: 12 }}>{pass ? '✓' : '✗'}</span>
    <span style={{ fontSize: 11, color: pass ? COLORS.green : COLORS.red, fontWeight: 600 }}>{label}</span>
  </div>
);

// ─── ProgressBar ──────────────────────────────────────────────────────────────
export const ProgressBar: React.FC<{ value: number; max: number; color: string }> = ({ value, max, color }) => (
  <div style={{ background: COLORS.border, borderRadius: 4, height: 6, overflow: 'hidden' }}>
    <div style={{
      width: `${Math.min(100, (value / (max || 1)) * 100)}%`, height: '100%',
      background: color, borderRadius: 4, transition: 'width 0.4s ease',
    }} />
  </div>
);

// ─── Slider ───────────────────────────────────────────────────────────────────
export const Slider: React.FC<{
  id: string; value: number; max: number;
  onChange: (v: number) => void; hint?: readonly string[];
}> = ({ id, value, max, onChange, hint }) => {
  const [showHint, setShowHint] = useState(false);
  const pct = max > 0 ? value / max : 0;
  const color = pct >= 0.8 ? COLORS.green : pct >= 0.5 ? COLORS.yellow : COLORS.red;
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <div style={{ fontSize: 12, color: COLORS.muted }}>{id}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hint && (
            <button
              onClick={() => setShowHint(s => !s)}
              style={{
                background: showHint ? COLORS.border : 'transparent',
                border: 'none', color: COLORS.muted, cursor: 'pointer',
                fontSize: 12, padding: '2px 6px', borderRadius: 4,
              }}
            >?</button>
          )}
          <span style={{ fontSize: 16, fontWeight: 700, color, fontFamily: 'monospace', minWidth: 40, textAlign: 'right' }}>
            {value}/{max}
          </span>
        </div>
      </div>
      <input type="range" min={0} max={max} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: color }} />
      {showHint && hint && (
        <div style={{
          background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8,
          padding: 12, marginTop: 8, fontSize: 12, color: COLORS.muted, lineHeight: 1.7,
          position: 'absolute', zIndex: 10, left: 0, right: 0, boxShadow: '0 8px 32px #00000088',
        }}>
          {hint.map((h, i) => <div key={i}>• {h}</div>)}
        </div>
      )}
    </div>
  );
};

// ─── LoadingSpinner ───────────────────────────────────────────────────────────
export const LoadingSpinner: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', minHeight: 300, gap: 16,
  }}>
    <div style={{
      width: 40, height: 40, border: `3px solid ${COLORS.border}`,
      borderTopColor: COLORS.accent, borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <span style={{ color: COLORS.muted, fontSize: 14 }}>{message}</span>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

// ─── ErrorBanner ─────────────────────────────────────────────────────────────
export const ErrorBanner: React.FC<{ message: string; onRetry?: () => void }> = ({ message, onRetry }) => (
  <div style={{
    background: COLORS.red + '22', border: `1px solid ${COLORS.red}44`,
    borderRadius: 12, padding: '20px 24px', margin: '24px 0',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  }}>
    <div>
      <div style={{ color: COLORS.red, fontWeight: 700, marginBottom: 4 }}>Connection Error</div>
      <div style={{ color: COLORS.muted, fontSize: 13 }}>{message}</div>
    </div>
    {onRetry && (
      <button onClick={onRetry} style={{
        background: COLORS.red + '33', border: `1px solid ${COLORS.red}44`,
        color: COLORS.red, padding: '8px 16px', borderRadius: 8,
        cursor: 'pointer', fontSize: 13, fontWeight: 600,
      }}>Retry</button>
    )}
  </div>
);

// ─── Toast notification ───────────────────────────────────────────────────────
export const Toast: React.FC<{ message: string; type?: 'success' | 'error' | 'info' }> = ({
  message, type = 'success'
}) => {
  const color = type === 'success' ? COLORS.green : type === 'error' ? COLORS.red : COLORS.accent;
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 1000,
      background: COLORS.card, border: `1px solid ${color}44`,
      borderRadius: 10, padding: '12px 20px', color,
      fontWeight: 600, fontSize: 14, boxShadow: '0 8px 32px #00000088',
      animation: 'slideUp 0.3s ease',
    }}>
      {type === 'success' ? '✓ ' : type === 'error' ? '✗ ' : 'ℹ '}{message}
      <style>{`@keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  );
};

// ─── Btn ──────────────────────────────────────────────────────────────────────
export const Btn: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  color?: string;
  variant?: 'solid' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  style?: React.CSSProperties;
}> = ({ children, onClick, color = COLORS.accent, variant = 'solid', size = 'md', disabled, style }) => {
  const pad = size === 'sm' ? '6px 14px' : size === 'lg' ? '14px 32px' : '10px 20px';
  const fs = size === 'sm' ? 12 : size === 'lg' ? 15 : 13;
  const base: React.CSSProperties = {
    padding: pad, borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: fs, fontWeight: 600, transition: 'all 0.15s', opacity: disabled ? 0.5 : 1,
    border: 'none', outline: 'none', ...style,
  };
  if (variant === 'solid') return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, background: color, color: COLORS.white }}>
      {children}
    </button>
  );
  if (variant === 'outline') return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, background: color + '22', border: `1px solid ${color}44`, color }}>
      {children}
    </button>
  );
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, background: 'transparent', border: `1px solid ${COLORS.border}`, color: COLORS.muted }}>
      {children}
    </button>
  );
};
