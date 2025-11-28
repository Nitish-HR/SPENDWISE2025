const Expense = require('../models/Expense');

async function computeSimpleAnalytics(userId, days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const expenses = await Expense.find({
    userId,
    date: { $gte: cutoff },
  });

  const totals = expenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

  const byCategory = {};
  expenses.forEach((expense) => {
    const category = expense.category || 'uncategorized';
    byCategory[category] = (byCategory[category] || 0) + (expense.amount || 0);
  });

  const avgWeekly = totals / (days / 7 || 1);

  return {
    totals,
    byCategory,
    avgWeekly,
    count: expenses.length,
    rawExpenses: expenses,
  };
}

module.exports = { computeSimpleAnalytics };

