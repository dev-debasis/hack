# 🎯 Hackathon Screening Platform — 3-Tier System

Full-stack screening platform with a **3-tier evaluation pipeline** that reduces screening time from 42+ hours to ~14 hours for 170 teams.

## Tier Architecture

| Tier | Step | Time/team | Purpose |
|---|---|---|---|
| **Tier 1** | Pre-Filter | ~90 sec | 3 binary Yes/No questions — auto-routes or rejects |
| **Tier 2** | Quick Score | ~5 min | 5 holistic dimensions (100pts) |
| **Tier 3** | Deep Score | ~15 min | Full 14-criterion rubric — borderline teams only |

### Tier 1 — Pre-Filter Logic
- **3/3 Yes** → Fast-track to Quick Score (green)
- **2/3 Yes** → Quick Score (borderline, yellow)
- **0–1 Yes** → Auto-rejected immediately

### Tier 2 — 5 Quick Dimensions (100pts)
| Dimension | Max | Covers |
|---|---|---|
| GitHub Activity | 30 | Recency + originality + diversity |
| LinkedIn Depth | 20 | Projects + achievements |
| Team Balance | 20 | Skill coverage + size |
| Best Work | 20 | Submitted work quality |
| Overall Impression | 10 | Holistic gut-check |

Gates: Overall ≥50, GH ≥12, LI ≥8, Team ≥8

### Tier 3 — Full 14-Criterion Deep Rubric (borderline only)
A1–A5 GitHub (35pts), B1–B5 LinkedIn (25pts), C1–C4 Team (25pts), D–E Bonus (+15pts)

---

## Tech Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Backend**: Node.js + Express
- **Database**: MongoDB + Mongoose

## Setup

```bash
# Install all dependencies
npm run install:all

# Configure environment
cd server && cp .env.example .env
# Edit .env: set MONGO_URI

# Start both servers
cd .. && npm run dev
# Frontend → http://localhost:5173
# Backend  → http://localhost:5000
```

## Deployment
1. Deploy **server** on Render (Root Dir: `server`, set `MONGO_URI` env var)
2. Deploy **client** on Vercel (set `VITE_API_URL` to your Render URL)
3. Set `CLIENT_ORIGIN` on Render to your Vercel URL, redeploy
