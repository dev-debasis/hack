export type TriageStatus = 'green' | 'yellow' | 'red';
export type TeamCategory = 'external' | 'host-college' | 'first-year';
export type TeamStatus = 'pending' | 'selected' | 'waitlist' | 'rejected';
export type TeamTier = 1 | 2 | 3 | null; // null = not yet pre-filtered

// ─── Tier 1: 3 binary questions (90-second pre-filter) ───────────────────────
export interface Tier1Answers {
  q1: boolean | null; // GitHub: 3+ non-forked repos with commits in last 6 months?
  q2: boolean | null; // LinkedIn: 2+ projects listed with descriptions?
  q3: boolean | null; // Team: 2+ members with different skill signals?
}

// ─── Tier 2: 5-dimension quick scores (~5 min) ───────────────────────────────
export interface QuickScores {
  githubActivity?: number;    // 0–30: recency + originality + diversity combined
  linkedinDepth?: number;     // 0–20: projects + achievements combined
  teamBalance?: number;       // 0–20: skill coverage + team size
  bestWorkQuality?: number;   // 0–20: submitted work quality (0 if not submitted)
  overallImpression?: number; // 0–10: gut-check holistic score
}

// ─── Tier 3: Full 14-criterion deep scores (borderline only) ─────────────────
export interface Scores {
  A1?: number; A2?: number; A3?: number; A4?: number; A5?: number;
  B1?: number; B2?: number; B3?: number; B4?: number; B5?: number;
  C1?: number; C2?: number; C3?: number; C4?: number;
  D?: number; E?: number;
  _arbitratedTotal?: number;
}

export interface EvalNotes {
  A?: string;
  B?: string;
  C?: string;
}

export interface Team {
  _id?: string;
  id: string;
  name: string;
  members: string;
  college: string;
  category: TeamCategory;
  githubUrl: string;
  linkedinUrls: string;
  bestWork: string;
  resumeUrl: string;
  notes: string;

  // ── Tiered evaluation ──────────────────────────────────────────────────────
  tier: TeamTier;
  tier1Answers: Tier1Answers;
  quickScores: QuickScores;
  quickNotes?: string;

  scores: Scores;        // Tier 3 deep
  evalA: Scores;
  evalB: Scores;
  evalNotes: EvalNotes;
  evalArbitrated?: boolean;

  triage: TriageStatus;  // kept for manual override compatibility
  status: TeamStatus;
  flags: string[];
  finalScore?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface SectionScores {
  github: number;
  linkedin: number;
  team: number;
  bonus: number;
  total: number;
}

export interface QuickSectionScores {
  githubActivity: number;
  linkedinDepth: number;
  teamBalance: number;
  bestWorkQuality: number;
  overallImpression: number;
  total: number;
}

export interface GateResult {
  overall: boolean;
  github: boolean;
  linkedin: boolean;
  team: boolean;
  passed: boolean;
}

export interface QuickGateResult {
  overall: boolean;
  github: boolean;
  linkedin: boolean;
  team: boolean;
  passed: boolean;
}

export interface SelectionCaps {
  total: number;
  firstYear: number;
  hostCollege: number;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
