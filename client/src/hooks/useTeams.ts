import { useState, useEffect, useCallback } from 'react';
import type { Team, Scores, QuickScores } from '../types';
import { teamsApi } from '../lib/api';
import { mergeScores, scoreVariance, GATES, calcEffectiveScore, checkQuickGates } from '../lib/constants';

export function useTeams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchTeams(); }, []);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teamsApi.getAll();
      setTeams(data);
    } catch (err: unknown) {
      setError('Failed to load teams. Is the server running?');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addTeam = useCallback(async (teamData: Omit<Team, '_id'>): Promise<Team | null> => {
    try {
      const created = await teamsApi.create(teamData);
      setTeams(prev => [created, ...prev]);
      return created;
    } catch (err) {
      console.error('Failed to add team:', err);
      return null;
    }
  }, []);

  const updateTeam = useCallback(async (id: string, updates: Partial<Team>): Promise<void> => {
    // Optimistic update first for snappy UI
    setTeams(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    try {
      const updated = await teamsApi.update(id, updates);
      setTeams(prev => prev.map(t => t.id === id ? updated : t));
    } catch (err) {
      console.error('Failed to update team:', err);
      await fetchTeams();
    }
  }, []);

  // ── Tier 2: save quick scores ─────────────────────────────────────────────
  const saveQuickScores = useCallback(async (
    teamId: string,
    quickScores: QuickScores,
    quickNotes: string,
  ): Promise<void> => {
    await updateTeam(teamId, { quickScores, quickNotes });
  }, [updateTeam]);

  // ── Tier 3: escalate a team from Tier 2 to deep scoring ──────────────────
  const escalateToDeep = useCallback(async (teamId: string): Promise<void> => {
    await updateTeam(teamId, { tier: 3 });
  }, [updateTeam]);

  // ── Tier 3: save deep eval scores ────────────────────────────────────────
  const saveEvalScores = useCallback(async (
    teamId: string,
    evaluator: 'A' | 'B',
    scores: Scores,
    notes: string,
    currentTeam: Team,
  ): Promise<void> => {
    const evalAScores = evaluator === 'A' ? scores : (currentTeam.evalA || {});
    const evalBScores = evaluator === 'B' ? scores : (currentTeam.evalB || {});
    const bothPresent = Object.keys(evalAScores).length > 0 && Object.keys(evalBScores).length > 0;
    const mergedScores = bothPresent ? mergeScores(evalAScores, evalBScores) : scores;

    const updates: Partial<Team> = {
      scores: mergedScores,
      evalNotes: { ...currentTeam.evalNotes, [evaluator]: notes },
    };
    if (evaluator === 'A') updates.evalA = scores;
    else updates.evalB = scores;

    await updateTeam(teamId, updates);
  }, [updateTeam]);

  const deleteTeam = useCallback(async (id: string): Promise<void> => {
    setTeams(prev => prev.filter(t => t.id !== id));
    try {
      await teamsApi.delete(id);
    } catch (err) {
      console.error('Failed to delete team:', err);
      await fetchTeams();
    }
  }, []);

  // ── Bulk selection — uses effective score across all tiers ────────────────
  const bulkApplySelection = useCallback(async (
    caps: { total: number; firstYear: number; hostCollege: number }
  ): Promise<void> => {
    const { checkGates } = await import('../lib/constants');

    const scored = teams.filter(t => calcEffectiveScore(t) > 0);
    const ranked = [...scored].sort((a, b) => calcEffectiveScore(b) - calcEffectiveScore(a));

    const isEligible = (team: Team) => {
      if (team.tier === 3 && Object.keys(team.scores || {}).length > 0)
        return checkGates(team.scores).passed;
      if (Object.keys(team.quickScores || {}).length > 0)
        return checkQuickGates(team.quickScores).passed;
      return false;
    };

    const fyTeams = ranked.filter(t => t.category === 'first-year' && isEligible(t));
    const fySelected = fyTeams.slice(0, caps.firstYear);
    const fyIds = new Set(fySelected.map(t => t.id));

    const remaining = ranked.filter(t => !fyIds.has(t.id) && isEligible(t));
    const hostTeams = remaining.filter(t => t.category === 'host-college');
    const hostSelected = hostTeams.slice(0, caps.hostCollege);
    const hostIds = new Set(hostSelected.map(t => t.id));

    const external = remaining.filter(t => !hostIds.has(t.id));
    const externalSlots = caps.total - fySelected.length - hostSelected.length;
    const externalSelected = external.slice(0, Math.max(0, externalSlots));
    const selectedIds = new Set([...fySelected, ...hostSelected, ...externalSelected].map(t => t.id));
    const failedIds = new Set(ranked.filter(t => !isEligible(t)).map(t => t.id));

    const statusUpdates = teams.map(team => {
      let status: Team['status'] = team.status;
      if (calcEffectiveScore(team) === 0) return { id: team.id, status };
      if (selectedIds.has(team.id)) status = 'selected';
      else if (failedIds.has(team.id)) status = 'rejected';
      else status = 'waitlist';
      return { id: team.id, status };
    });

    setTeams(prev => prev.map(t => {
      const u = statusUpdates.find(s => s.id === t.id);
      return u ? { ...t, status: u.status } : t;
    }));

    try {
      await teamsApi.bulkUpdateStatus(statusUpdates);
    } catch (err) {
      console.error('Bulk update failed:', err);
      await fetchTeams();
    }
  }, [teams]);

  const variantTeams = teams.filter(t =>
    Object.keys(t.evalA || {}).length > 0 &&
    Object.keys(t.evalB || {}).length > 0 &&
    scoreVariance(t.evalA, t.evalB) > GATES.variance
  );

  return {
    teams, loading, error,
    refetch: fetchTeams,
    addTeam, updateTeam, deleteTeam,
    saveQuickScores, escalateToDeep,
    saveEvalScores, bulkApplySelection,
    variantTeams,
  };
}
