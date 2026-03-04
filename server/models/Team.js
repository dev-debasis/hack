const mongoose = require('mongoose');

const scoresSchema = new mongoose.Schema({
  A1: Number, A2: Number, A3: Number, A4: Number, A5: Number,
  B1: Number, B2: Number, B3: Number, B4: Number, B5: Number,
  C1: Number, C2: Number, C3: Number, C4: Number,
  D: Number, E: Number,
  _arbitratedTotal: Number,
}, { _id: false });

const evalNotesSchema = new mongoose.Schema({
  A: String, B: String, C: String,
}, { _id: false });

// Tier 1: 3 binary answers
const tier1AnswersSchema = new mongoose.Schema({
  q1: { type: Boolean, default: null },
  q2: { type: Boolean, default: null },
  q3: { type: Boolean, default: null },
}, { _id: false });

// Tier 2: 5-dimension quick scores
const quickScoresSchema = new mongoose.Schema({
  githubActivity:    { type: Number, min: 0, max: 30 },
  linkedinDepth:     { type: Number, min: 0, max: 20 },
  teamBalance:       { type: Number, min: 0, max: 20 },
  bestWorkQuality:   { type: Number, min: 0, max: 20 },
  overallImpression: { type: Number, min: 0, max: 10 },
}, { _id: false });

const teamSchema = new mongoose.Schema({
  id:           { type: String, required: true, unique: true },
  name:         { type: String, required: true, trim: true },
  members:      { type: String, default: '' },
  college:      { type: String, default: '' },
  category: {
    type: String,
    enum: ['external', 'host-college', 'first-year'],
    default: 'external',
  },
  githubUrl:    { type: String, default: '' },
  linkedinUrls: { type: String, default: '' },
  bestWork:     { type: String, default: '' },
  resumeUrl:    { type: String, default: '' },
  notes:        { type: String, default: '' },

  // ── Tiered evaluation ──────────────────────────────────────────────────────
  tier: { type: Number, enum: [1, 2, 3, null], default: null },
  tier1Answers: { type: tier1AnswersSchema, default: () => ({ q1: null, q2: null, q3: null }) },
  quickScores:  { type: quickScoresSchema, default: () => ({}) },
  quickNotes:   { type: String, default: '' },

  // ── Tier 3 deep scoring ───────────────────────────────────────────────────
  scores:        { type: scoresSchema, default: () => ({}) },
  evalA:         { type: scoresSchema, default: () => ({}) },
  evalB:         { type: scoresSchema, default: () => ({}) },
  evalNotes:     { type: evalNotesSchema, default: () => ({}) },
  evalArbitrated:{ type: Boolean, default: false },

  triage: {
    type: String,
    enum: ['green', 'yellow', 'red'],
    default: 'yellow',
  },
  status: {
    type: String,
    enum: ['pending', 'selected', 'waitlist', 'rejected'],
    default: 'pending',
  },
  flags:      { type: [String], default: [] },
  finalScore: { type: Number, default: null },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

teamSchema.index({ status: 1 });
teamSchema.index({ tier: 1 });
teamSchema.index({ category: 1 });

module.exports = mongoose.model('Team', teamSchema);
