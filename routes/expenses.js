const express = require('express');
const Expense = require('../models/Expense');

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

module.exports = router;

