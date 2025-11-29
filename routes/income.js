const express = require('express');
const Income = require('../models/Income');

const router = express.Router();

// CREATE income
router.post('/', async (req, res) => {
  try {
    const { userId, amount, date, source } = req.body;

    if (!userId || !amount || !date || !source) {
      return res.status(400).json({ error: 'userId, amount, date, and source are required' });
    }

    const income = await Income.create({
      userId,
      amount,
      date,
      source,
    });

    return res.status(201).json(income);

  } catch (error) {
    console.error('[income] POST failed', error);
    return res.status(500).json({ error: 'Failed to create income' });
  }
});


// GET all income for user
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId query param is required' });
    }

    const incomes = await Income.find({ userId })
      .sort({ date: -1 })
      .limit(100);

    return res.json(incomes);

  } catch (error) {
    console.error('[income] GET failed', error);
    return res.status(500).json({ error: 'Failed to fetch income' });
  }
});


// UPDATE income
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, date, source } = req.body;

    if (!amount || !date || !source) {
      return res.status(400).json({ error: 'amount, date, and source are required' });
    }

    const income = await Income.findByIdAndUpdate(
      id,
      { amount, date, source },
      { new: true, runValidators: true }
    );

    if (!income) {
      return res.status(404).json({ error: 'Income not found' });
    }

    return res.json(income);

  } catch (error) {
    console.error('[income] PUT failed', error);
    return res.status(500).json({ error: 'Failed to update income' });
  }
});


// DELETE income
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const income = await Income.findByIdAndDelete(id);

    if (!income) {
      return res.status(404).json({ error: 'Income not found' });
    }

    return res.json({ success: true, message: 'Income deleted successfully' });

  } catch (error) {
    console.error('[income] DELETE failed', error);
    return res.status(500).json({ error: 'Failed to delete income' });
  }
});

module.exports = router;