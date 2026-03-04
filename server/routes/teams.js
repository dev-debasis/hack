const express = require('express');
const router = express.Router();
const Team = require('../models/Team');

// ─── GET all teams ────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const teams = await Team.find().sort({ createdAt: -1 });
    res.json(teams);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch teams', details: err.message });
  }
});

// ─── GET single team ──────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const team = await Team.findOne({ id: req.params.id });
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST create team ─────────────────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { id, name, members, college, category, githubUrl, linkedinUrls,
            bestWork, resumeUrl, notes, triage, status, scores, evalA, evalB,
            evalNotes, flags } = req.body;

    if (!id || !name) {
      return res.status(400).json({ error: 'id and name are required' });
    }

    // Check for duplicate id
    const existing = await Team.findOne({ id });
    if (existing) {
      return res.status(409).json({ error: `Team with id ${id} already exists` });
    }

    const team = new Team({
      id, name, members, college, category,
      githubUrl, linkedinUrls, bestWork, resumeUrl,
      notes, triage, status, scores, evalA, evalB, evalNotes, flags,
    });

    await team.save();
    res.status(201).json(team);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Team ID already exists' });
    }
    res.status(400).json({ error: err.message });
  }
});

// ─── PATCH update team ────────────────────────────────────────────────────────
router.patch('/:id', async (req, res) => {
  try {
    // Prevent overwriting the team's custom `id` field via patch
    const updates = { ...req.body };
    delete updates.id;
    delete updates._id;

    const team = await Team.findOneAndUpdate(
      { id: req.params.id },
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ─── DELETE team ──────────────────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const team = await Team.findOneAndDelete({ id: req.params.id });
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json({ message: 'Team deleted', id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── POST bulk status update ──────────────────────────────────────────────────
router.post('/bulk-status', async (req, res) => {
  try {
    const { updates } = req.body;
    if (!Array.isArray(updates)) {
      return res.status(400).json({ error: 'updates must be an array' });
    }

    const ops = updates.map(({ id, status }) => ({
      updateOne: {
        filter: { id },
        update: { $set: { status } },
      }
    }));

    const result = await Team.bulkWrite(ops);
    res.json({ modified: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── PATCH save scores ────────────────────────────────────────────────────────
router.patch('/:id/scores', async (req, res) => {
  try {
    const { evaluator, scores, notes, mergedScores } = req.body;
    if (!['A', 'B'].includes(evaluator)) {
      return res.status(400).json({ error: 'evaluator must be A or B' });
    }

    const evalField = evaluator === 'A' ? 'evalA' : 'evalB';
    const noteField = `evalNotes.${evaluator}`;

    const update = {
      [evalField]: scores,
      [noteField]: notes,
      scores: mergedScores,
    };

    const team = await Team.findOneAndUpdate(
      { id: req.params.id },
      { $set: update },
      { new: true, runValidators: true }
    );

    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
