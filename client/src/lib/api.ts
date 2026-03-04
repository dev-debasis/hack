import axios from 'axios';
import type { Team, Scores, EvalNotes } from '../types';

// In development, Vite proxies /api → localhost:5000
// In production (Vercel), this must point to your Render backend URL
const BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const api = axios.create({ baseURL: BASE_URL });

// ─── Teams ────────────────────────────────────────────────────────────────────
export const teamsApi = {
  getAll: async (): Promise<Team[]> => {
    const res = await api.get('/teams');
    return res.data;
  },

  create: async (team: Omit<Team, '_id'>): Promise<Team> => {
    const res = await api.post('/teams', team);
    return res.data;
  },

  update: async (id: string, updates: Partial<Team>): Promise<Team> => {
    const res = await api.patch(`/teams/${id}`, updates);
    return res.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/teams/${id}`);
  },

  updateTriage: async (id: string, triage: string): Promise<Team> => {
    const res = await api.patch(`/teams/${id}`, { triage });
    return res.data;
  },

  saveScores: async (
    id: string,
    evaluator: 'A' | 'B',
    scores: Scores,
    notes: string,
    mergedScores: Scores
  ): Promise<Team> => {
    const updates: Partial<Team> = {
      scores: mergedScores,
      evalNotes: {} as EvalNotes,
    };
    if (evaluator === 'A') {
      updates.evalA = scores;
      updates.evalNotes = { A: notes } as EvalNotes;
    } else {
      updates.evalB = scores;
      updates.evalNotes = { B: notes } as EvalNotes;
    }
    const res = await api.patch(`/teams/${id}/scores`, { evaluator, scores, notes, mergedScores });
    return res.data;
  },

  applyArbitration: async (id: string, finalTotal: number, note: string): Promise<Team> => {
    const res = await api.patch(`/teams/${id}`, {
      evalArbitrated: true,
      'evalNotes.C': note,
      'scores._arbitratedTotal': finalTotal,
    });
    return res.data;
  },

  bulkUpdateStatus: async (updates: { id: string; status: string }[]): Promise<void> => {
    await api.post('/teams/bulk-status', { updates });
  },
};

export default api;
