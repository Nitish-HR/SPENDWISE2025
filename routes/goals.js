const express = require('express');
const Goal = require('../models/Goal');

const router = express.Router();

// GET /goals?userId=
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId query param is required' });
    }

    const goals = await Goal.find({ userId }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    console.error('[goals] GET failed', error);
    res.status(500).json({ error: 'Failed to fetch goals' });
  }
});

// POST /goals
router.post('/', async (req, res) => {
  try {
    const { userId, title, targetAmount, savedAmount, deadline } = req.body;

    // Validation
    if (!userId || !title || !targetAmount || !deadline) {
      return res.status(400).json({ 
        error: 'userId, title, targetAmount, and deadline are required' 
      });
    }

    if (typeof targetAmount !== 'number' || targetAmount <= 0) {
      return res.status(400).json({ 
        error: 'targetAmount must be a positive number' 
      });
    }

    if (savedAmount !== undefined && (typeof savedAmount !== 'number' || savedAmount < 0)) {
      return res.status(400).json({ 
        error: 'savedAmount must be a non-negative number' 
      });
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({ 
        error: 'deadline must be a valid date' 
      });
    }

    if (deadlineDate < new Date()) {
      return res.status(400).json({ 
        error: 'deadline cannot be in the past' 
      });
    }

    const goal = await Goal.create({
      userId,
      title,
      targetAmount,
      savedAmount: savedAmount || 0,
      deadline: deadlineDate,
    });

    res.status(201).json(goal);
  } catch (error) {
    console.error('[goals] POST failed', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create goal' });
  }
});

// PUT /goals/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, title, targetAmount, savedAmount, deadline } = req.body;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid goal ID format' });
    }

    // PUT requires all fields (full replacement)
    if (!userId || !title || targetAmount === undefined || !deadline) {
      return res.status(400).json({ 
        error: 'userId, title, targetAmount, and deadline are required' 
      });
    }

    if (typeof targetAmount !== 'number' || targetAmount <= 0) {
      return res.status(400).json({ 
        error: 'targetAmount must be a positive number' 
      });
    }

    if (savedAmount !== undefined && (typeof savedAmount !== 'number' || savedAmount < 0)) {
      return res.status(400).json({ 
        error: 'savedAmount must be a non-negative number' 
      });
    }

    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return res.status(400).json({ error: 'deadline must be a valid date' });
    }

    if (deadlineDate < new Date()) {
      return res.status(400).json({ error: 'deadline cannot be in the past' });
    }

    const goal = await Goal.findByIdAndUpdate(
      id,
      {
        userId,
        title,
        targetAmount,
        savedAmount: savedAmount || 0,
        deadline: deadlineDate,
      },
      { new: true, runValidators: true }
    );

    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json(goal);
  } catch (error) {
    console.error('[goals] PUT failed', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// DELETE /goals/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ID format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ error: 'Invalid goal ID format' });
    }

    const goal = await Goal.findByIdAndDelete(id);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json({ message: 'Goal deleted successfully', goal });
  } catch (error) {
    console.error('[goals] DELETE failed', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

module.exports = router;

