const express = require('express');
const Expense = require('../models/Expense');
const { generateInsight } = require('../services/insightEngine');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { userId, category, amount, date } = req.body;
    if (!userId || !category || !amount || !date) {
      return res.status(400).json({ error: 'userId, category, amount, and date are required' });
    }

    const expense = await Expense.create({
      userId,
      category,
      amount,
      date,
    });

    // Trigger insight generation in background (non-blocking)
    generateInsight(userId, 'daily')
      .then(() => {
        console.log(`[Expenses] Auto-insight generated for ${userId} after expense creation`);
      })
      .catch((error) => {
        console.error(`[Expenses] Failed to generate auto-insight for ${userId}:`, error.message);
        // Don't throw - this is non-blocking
      });

    res.status(201).json(expense);
  } catch (error) {
    console.error('[expenses] POST failed', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId query param is required' });
    }

    const expenses = await Expense.find({ userId }).sort({ date: -1 }).limit(50);
    res.json(expenses);
  } catch (error) {
    console.error('[expenses] GET failed', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { category, amount, date, description } = req.body;

    if (!category || !amount || !date) {
      return res.status(400).json({ error: 'category, amount, and date are required' });
    }

    const expense = await Expense.findByIdAndUpdate(
      id,
      { category, amount, date, description },
      { new: true, runValidators: true }
    );

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Trigger insight generation in background (non-blocking)
    generateInsight(expense.userId, 'daily')
      .then(() => {
        console.log(`[Expenses] Auto-insight generated for ${expense.userId} after expense update`);
      })
      .catch((error) => {
        console.error(`[Expenses] Failed to generate auto-insight for ${expense.userId}:`, error.message);
      });

    res.json(expense);
  } catch (error) {
    console.error('[expenses] PUT failed', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const expense = await Expense.findByIdAndDelete(id);

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Trigger insight generation in background (non-blocking)
    generateInsight(expense.userId, 'daily')
      .then(() => {
        console.log(`[Expenses] Auto-insight generated for ${expense.userId} after expense deletion`);
      })
      .catch((error) => {
        console.error(`[Expenses] Failed to generate auto-insight for ${expense.userId}:`, error.message);
      });

    res.json({ success: true, message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('[expenses] DELETE failed', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

module.exports = router;

