import type { Scores, SectionScores, GateResult, Team, QuickScores, QuickSectionScores, Tier1Answers } from '../types';

// ─── TIER 1: Binary pre-filter questions ─────────────────────────────────────
export const TIER1_QUESTIONS = [
  {
    id: 'q1' as const,
    label: 'GitHub Activity',
    question: 'Does the team have 3+ non-forked repos with commits in the last 6 months?',
    yesHint: 'At least 3 original repos showing recent, genuine development',
    noHint: 'Fewer than 3 original repos, all forked, or no recent commits',
  },
  {
    id: 'q2' as const,
    label: 'LinkedIn Depth',
    question: 'Do members have 2+ projects listed on LinkedIn with descriptions?',
    yesHint: 'Projects with tech stack and outcomes — not just titles',
    noHint: 'No projects, only titles, or profiles are stubs',
  },
  {
    id: 'q3' as const,
    label: 'Team Diversity',
    question: 'Does the team have 2+ members with clearly different skill signals?',
    yesHint: 'e.g. one frontend + one ML, or one design + one backend',
    noHint: 'All members have identical or unclear skill profiles',
  },
] as const;

// Tier 1 routing logic
export const getTier1Result = (answers: Tier1Answers): { tier: 2 | null; autoReject: boolean; yesCount: number } => {
  const vals = [answers.q1, answers.q2, answers.q3];
  const yesCount = vals.filter(v => v === true).length;
  const allAnswered = vals.every(v => v !== null);
  if (!allAnswered) return { tier: null, autoReject: false, yesCount };
  if (yesCount <= 1) return { tier: null, autoReject: true, yesCount };
  return { tier: 2, autoReject: false, yesCount };
};

// ─── TIER 2: 5-dimension quick rubric ────────────────────────────────────────
export const QUICK_RUBRIC = [
  {
    id: 'githubActivity' as const,
    label: 'GitHub Activity',
    max: 30,
    color: '#00d084',
    description: 'Recency + originality + diversity combined',
    hints: [
      '30: Active repos last 3 months, 3+ domains, meaningful commits, good READMEs',
      '20: Active recently, 2 domains, decent commit history',
      '10: Some activity but sparse, mostly 1 domain, or poor docs',
      '0: New profiles, all forks, no real activity',
    ],
  },
  {
    id: 'linkedinDepth' as const,
    label: 'LinkedIn Depth',
    max: 20,
    color: '#0077b5',
    description: 'Projects + achievements + experience combined',
    hints: [
      '20: 3+ projects with outcomes, hackathon wins, relevant internship',
      '14: 1–2 detailed projects, some achievements',
      '8: Projects listed but thin, minimal achievements',
      '0: Stub profile or no relevant content',
    ],
  },
  {
    id: 'teamBalance' as const,
    label: 'Team Balance',
    max: 20,
    color: '#f59e0b',
    description: 'Skill coverage + team size + collaboration signals',
    hints: [
      '20: 3–4 members, 3+ distinct domains, evidence of prior collaboration',
      '14: 2–3 members, 2 domains, some collaboration signals',
      '8: 2 members or all same skill, no collaboration history',
      '2: Solo or 5+ members, homogeneous skills',
    ],
  },
  {
    id: 'bestWorkQuality' as const,
    label: 'Best Work',
    max: 20,
    color: '#a78bfa',
    description: 'Quality of submitted project/demo (0 if not submitted — no penalty)',
    hints: [
      '20: Live demo + full repo + measurable impact or users',
      '14: Strong repo, good README, clear problem solved',
      '7: Submitted but vague, incomplete, or hard to evaluate',
      '0: Not submitted — no penalty applied',
    ],
  },
  {
    id: 'overallImpression' as const,
    label: 'Overall Impression',
    max: 10,
    color: '#f43f5e',
    description: 'Holistic gut-check: would this team ship something at the hackathon?',
    hints: [
      '10: Confident yes — strong all-round team',
      '7: Probably yes — a few gaps but solid foundation',
      '4: Uncertain — something is missing',
      '1: Unlikely — too many weak signals',
    ],
  },
] as const;

export const QUICK_GATES = { overall: 50, github: 12, linkedin: 8, team: 8 };

// ─── TIER 3: Full 14-criterion deep rubric (borderline only) ─────────────────
export const RUBRIC = {
  github: {
    label: 'GitHub Profile', max: 35, color: '#00d084',
    criteria: [
      { id: 'A1', label: 'Repository Count & Relevance', max: 8, hints: ['8: 10+ original repos with descriptions', '6: 5–9 repos', '4: 2–4 repos', '1: 0–1 or all forked'] },
      { id: 'A2', label: 'Commit Consistency & History', max: 8, hints: ['8: Active last 6 months, multiple repos', '6: Active but sparse', '3: Only burst commits', '0: No recent activity'] },
      { id: 'A3', label: 'Project Domain Diversity', max: 7, hints: ['7: 3+ domains (web, ML, mobile, systems)', '5: 2 domains', '3: 1 domain varied stacks', '1: All forks/clones'] },
      { id: 'A4', label: 'README & Documentation Quality', max: 6, hints: ['6: Most repos have setup + screenshots', '4: Some docs', '2: Minimal READMEs', '0: No docs'] },
      { id: 'A5', label: 'Code Quality Signals', max: 6, hints: ['6: Clear structure, meaningful commits, branches/PRs', '4: Some structure', '2: Single-branch, vague commits', '0: No signal'] },
    ]
  },
  linkedin: {
    label: 'LinkedIn Profile', max: 25, color: '#0077b5',
    criteria: [
      { id: 'B1', label: 'Education & Relevant Coursework', max: 5, hints: ['5: Degree + relevant certs listed', '3: Degree, minimal coursework', '1: Incomplete'] },
      { id: 'B2', label: 'Projects Listed (beyond GitHub)', max: 7, hints: ['7: 3+ projects with tech + outcomes', '5: 1–2 projects', '2: Mentioned but no detail', '0: None'] },
      { id: 'B3', label: 'Hackathons / Competitions', max: 6, hints: ['6: 2+ events with outcomes', '4: 1 event', '2: Listed, no detail', '0: None'] },
      { id: 'B4', label: 'Internships / Work Experience', max: 5, hints: ['5: Relevant tech internship', '3: Any work exp', '1: None (OK for 1st yr)', '0: Misleading'] },
      { id: 'B5', label: 'Profile Completeness', max: 2, hints: ['2: Photo + headline + about + skills', '1: Mostly complete', '0: Stub profile'] },
    ]
  },
  team: {
    label: 'Team Composition', max: 25, color: '#f59e0b',
    criteria: [
      { id: 'C1', label: 'Skill Diversity Across Roles', max: 10, hints: ['10: 3+ distinct domains (FE, BE, ML, Design)', '7: 2 domains', '4: Partial coverage', '1: All same skill'] },
      { id: 'C2', label: 'Prior Collaboration Signals', max: 8, hints: ['8: Shared GitHub repos or joint projects', '5: Same college/community overlap', '2: No visible history (OK for new teams)'] },
      { id: 'C3', label: 'Team Size Appropriateness', max: 4, hints: ['4: 3–4 members (optimal)', '3: 2 members', '2: 1 (solo) or 5+ members'] },
      { id: 'C4', label: 'Member Activity Consistency', max: 3, hints: ['3: All members show recent activity', '2: Most active', '1: 1+ very thin profiles'] },
    ]
  },
  bonus: {
    label: 'Optional Bonuses', max: 15, color: '#a78bfa',
    criteria: [
      { id: 'D', label: 'Best Work Submission', max: 10, hints: ['10: Live demo + repo + measurable impact', '7: Good repo strong README', '4: Vague or basic', '0: Not submitted (NO PENALTY)'] },
      { id: 'E', label: 'Resume Quality', max: 5, hints: ['5: Concrete projects, honest, clean', '3: Some projects, standard', '1: Sparse or generic', '0: Not submitted (NO PENALTY)'] },
    ]
  }
} as const;

export const GATES = { overall: 50, github: 15, linkedin: 8, team: 10, variance: 15 };

// ─── COLORS ───────────────────────────────────────────────────────────────────
export const COLORS = {
  bg: '#0a0e1a', surface: '#0f1629', card: '#141c35',
  border: '#1e2d55', accent: '#3b82f6', green: '#00d084',
  red: '#f43f5e', yellow: '#f59e0b', purple: '#a78bfa',
  text: '#e2e8f0', muted: '#64748b', white: '#ffffff', gold: '#f59e0b',
};

// ─── INITIAL TEAM ─────────────────────────────────────────────────────────────
export const INITIAL_TEAM: Omit<Team, '_id'> = {
  id: '', name: '', members: '', college: '', category: 'external',
  githubUrl: '', linkedinUrls: '', bestWork: '', resumeUrl: '', notes: '',
  tier: null,
  tier1Answers: { q1: null, q2: null, q3: null },
  quickScores: {},
  quickNotes: '',
  scores: {}, evalNotes: {}, status: 'pending', triage: 'yellow',
  evalA: {}, evalB: {}, finalScore: null, flags: [],
};

// ─── SCORE CALCULATORS ────────────────────────────────────────────────────────
export const calcSectionScores = (scores: Scores): SectionScores => {
  const github = (['A1','A2','A3','A4','A5'] as const).reduce((s, k) => s + (Number(scores[k]) || 0), 0);
  const linkedin = (['B1','B2','B3','B4','B5'] as const).reduce((s, k) => s + (Number(scores[k]) || 0), 0);
  const team = (['C1','C2','C3','C4'] as const).reduce((s, k) => s + (Number(scores[k]) || 0), 0);
  const bonus = (['D','E'] as const).reduce((s, k) => s + (Number(scores[k]) || 0), 0);
  const base = github + linkedin + team + bonus;
  const total = scores._arbitratedTotal !== undefined ? scores._arbitratedTotal : Math.min(100, base);
  return { github, linkedin, team, bonus, total };
};

export const calcQuickScores = (qs: QuickScores): QuickSectionScores => {
  const githubActivity = Number(qs.githubActivity) || 0;
  const linkedinDepth = Number(qs.linkedinDepth) || 0;
  const teamBalance = Number(qs.teamBalance) || 0;
  const bestWorkQuality = Number(qs.bestWorkQuality) || 0;
  const overallImpression = Number(qs.overallImpression) || 0;
  const total = Math.min(100, githubActivity + linkedinDepth + teamBalance + bestWorkQuality + overallImpression);
  return { githubActivity, linkedinDepth, teamBalance, bestWorkQuality, overallImpression, total };
};

// Returns the best available score for a team based on its tier
export const calcEffectiveScore = (team: Team): number => {
  if (team.tier === 3 && Object.keys(team.scores || {}).length > 0) {
    return calcSectionScores(team.scores).total;
  }
  if (Object.keys(team.quickScores || {}).length > 0) {
    return calcQuickScores(team.quickScores).total;
  }
  return 0;
};

export const checkGates = (scores: Scores): GateResult => {
  const s = calcSectionScores(scores);
  return {
    overall: s.total >= GATES.overall,
    github: s.github >= GATES.github,
    linkedin: s.linkedin >= GATES.linkedin,
    team: s.team >= GATES.team,
    passed: s.total >= GATES.overall && s.github >= GATES.github && s.linkedin >= GATES.linkedin && s.team >= GATES.team,
  };
};

export const checkQuickGates = (qs: QuickScores) => {
  const s = calcQuickScores(qs);
  return {
    overall: s.total >= QUICK_GATES.overall,
    github: s.githubActivity >= QUICK_GATES.github,
    linkedin: s.linkedinDepth >= QUICK_GATES.linkedin,
    team: s.teamBalance >= QUICK_GATES.team,
    passed: s.total >= QUICK_GATES.overall && s.githubActivity >= QUICK_GATES.github && s.linkedinDepth >= QUICK_GATES.linkedin && s.teamBalance >= QUICK_GATES.team,
  };
};

export const mergeScores = (evalA: Scores, evalB: Scores): Scores => {
  const keys = new Set([...Object.keys(evalA), ...Object.keys(evalB)]) as Set<keyof Scores>;
  const merged: Scores = {};
  keys.forEach(k => {
    (merged as Record<string, number>)[k as string] = ((Number((evalA as Record<string,number>)[k as string]) || 0) + (Number((evalB as Record<string,number>)[k as string]) || 0)) / 2;
  });
  return merged;
};

export const scoreVariance = (a: Scores, b: Scores): number =>
  Math.abs(calcSectionScores(a).total - calcSectionScores(b).total);

export const genId = (): string => 'T' + String(Math.floor(Math.random() * 9000) + 1000);

export const exportCSV = (teams: Team[]): void => {
  const headers = ['ID','Name','College','Category','Tier','Tier1_Q1','Tier1_Q2','Tier1_Q3','QuickTotal','GH_Activity','LI_Depth','Team_Balance','BestWork','Impression','DeepTotal','Status','Notes'];
  const rows = teams.map(t => {
    const qs = calcQuickScores(t.quickScores || {});
    const ds = calcSectionScores(t.scores || {});
    const effective = calcEffectiveScore(t);
    return [
      t.id, t.name, t.college, t.category,
      t.tier ?? 'unfiltered',
      t.tier1Answers?.q1 ?? '', t.tier1Answers?.q2 ?? '', t.tier1Answers?.q3 ?? '',
      qs.total, qs.githubActivity, qs.linkedinDepth, qs.teamBalance, qs.bestWorkQuality, qs.overallImpression,
      ds.total, t.status, t.notes,
    ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
  });
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'hackathon_screening.csv'; a.click();
  URL.revokeObjectURL(url);
};
