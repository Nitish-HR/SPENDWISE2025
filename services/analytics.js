const Expense = require('../models/Expense');
const Income = require('../models/Income');

async function computeSimpleAnalytics(userId, days = 30) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const expenses = await Expense.find({
    userId,
    date: { $gte: cutoff },
  });

  const incomes = await Income.find({
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

  // Income calculations
  const totalIncome = incomes.reduce((sum, income) => sum + (income.amount || 0), 0);
  const avgIncome = incomes.length > 0 ? totalIncome / incomes.length : 0;

  // Calculate income volatility (variance)
  let incomeVariance = 0;
  let volatilityScore = 0;
  if (incomes.length > 1) {
    const incomeAmounts = incomes.map(i => i.amount || 0);
    const mean = avgIncome;
    const variance = incomeAmounts.reduce((sum, amt) => sum + Math.pow(amt - mean, 2), 0) / incomeAmounts.length;
    incomeVariance = variance;
    const stdDev = Math.sqrt(variance);
    // Volatility score: 0-100, where 0 = very stable, 100 = very volatile
    volatilityScore = mean > 0 ? Math.min(100, (stdDev / mean) * 100) : 0;
  }

  // Savings ratio = (income - expenses) / income
  const savingsRatio = totalIncome > 0 ? ((totalIncome - totals) / totalIncome) * 100 : 0;

  return {
    totals,
    byCategory,
    avgWeekly,
    count: expenses.length,
    rawExpenses: expenses,
    // Income metrics
    totalIncome,
    avgIncome,
    incomeVariance,
    volatilityScore: Math.round(volatilityScore * 100) / 100, // Round to 2 decimal places
    savingsRatio: Math.round(savingsRatio * 100) / 100, // Round to 2 decimal places
    incomeCount: incomes.length,
    rawIncomes: incomes,
  };
}

module.exports = { computeSimpleAnalytics };

