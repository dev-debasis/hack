import React, { useState } from 'react';
import { COLORS } from './lib/constants';
import { useTeams } from './hooks/useTeams';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { AddTeam } from './pages/AddTeam';
import { PreFilter } from './pages/PreFilter';
import { QuickScore } from './pages/QuickScore';
import { Score } from './pages/Score';
import { Arbitration } from './pages/Arbitration';
import { Rankings } from './pages/Rankings';
import { LoadingSpinner, ErrorBanner, Toast } from './components/UI';
import type { Team, QuickScores, Scores, SelectionCaps } from './types';

type View = 'dashboard' | 'add' | 'prefilter' | 'quickscore' | 'score' | 'arbitration' | 'rankings';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  const {
    teams, loading, error, refetch,
    addTeam, updateTeam, deleteTeam,
    saveQuickScores, escalateToDeep,
    saveEvalScores, bulkApplySelection,
  } = useTeams();

  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Handlers ────────────────────────────────────────────────────────────────
  const handleAddTeam = async (teamData: Omit<Team, '_id'>) => {
    const result = await addTeam(teamData);
    if (result) {
      showToast(`Team "${result.name}" added — ready for pre-filter`);
      setView('prefilter');
    } else {
      showToast('Failed to add team', 'error');
    }
    return result;
  };

  const handleUpdateTeam = async (id: string, updates: Partial<Team>) => {
    await updateTeam(id, updates);
  };

  const handleSaveQuickScores = async (id: string, quickScores: QuickScores, notes: string) => {
    await saveQuickScores(id, quickScores, notes);
    showToast('Quick scores saved');
  };

  const handleEscalate = async (id: string) => {
    await escalateToDeep(id);
    showToast('Team escalated to Deep Score (Tier 3)');
    setView('score');
  };

  const handleSaveDeepScores = async (
    teamId: string, evaluator: 'A' | 'B',
    scores: Scores, notes: string, currentTeam: Team
  ) => {
    await saveEvalScores(teamId, evaluator, scores, notes, currentTeam);
    showToast('Deep scores saved');
  };

  const handleBulkApply = async (caps: SelectionCaps) => {
    await bulkApplySelection(caps);
    showToast('Selection caps applied successfully');
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, color: COLORS.text, display: 'flex' }}>
      <Sidebar teams={teams} view={view} onNav={v => setView(v as View)} />

      <main style={{ flex: 1, padding: '0 36px', overflowX: 'hidden', minWidth: 0 }}>
        {loading && <LoadingSpinner message="Loading teams from database..." />}

        {error && !loading && <ErrorBanner message={error} onRetry={refetch} />}

        {!loading && !error && (
          <>
            {view === 'dashboard' &&
              <Dashboard teams={teams} onNav={v => setView(v as View)} />}

            {view === 'add' &&
              <AddTeam onSave={handleAddTeam} onCancel={() => setView('dashboard')} />}

            {view === 'prefilter' &&
              <PreFilter teams={teams} onUpdate={handleUpdateTeam} />}

            {view === 'quickscore' &&
              <QuickScore
                teams={teams}
                onSave={handleSaveQuickScores}
                onEscalate={handleEscalate}
              />}

            {view === 'score' &&
              <Score teams={teams} onSaveScores={handleSaveDeepScores} />}

            {view === 'arbitration' &&
              <Arbitration teams={teams} onUpdate={handleUpdateTeam} />}

            {view === 'rankings' &&
              <Rankings
                teams={teams}
                onUpdate={handleUpdateTeam}
                onBulkApply={handleBulkApply}
              />}
          </>
        )}
      </main>

      {toast && <Toast message={toast.msg} type={toast.type} />}
    </div>
  );
}
