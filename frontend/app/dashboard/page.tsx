"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { generateAIInsight, getExpenses, getLatestInsights, getIncome } from "@/lib/api";
import StatCard from "@/app/components/dashboard/StatCard";
import InsightCard from "@/app/components/dashboard/InsightCard";
import ExpenseList from "@/app/components/dashboard/ExpenseList";
import Achievements from "@/app/components/Achievements";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Expense {
  _id?: string;
  category?: string;
  amount?: number;
  date?: string;
  description?: string;
}

interface Insight {
  overview?: string;
  prediction?: string;
  topOverspendArea?: string;
  savingsTip?: string;
  microTip?: string;
  riskPrediction?: string;
  overspendAreas?: Array<{
    category: string;
    amount: number;
    why?: string;
  }>;
}

const userId = process.env.NEXT_PUBLIC_DEFAULT_USER || "test-user-1";

interface Income {
  _id?: string;
  amount?: number;
  date?: string;
  source?: string;
}

export default function DashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [expenseData, incomeData, insightData] = await Promise.all([
        getExpenses(userId),
        getIncome(userId),
        getLatestInsights(userId),
      ]);

      setExpenses(Array.isArray(expenseData) ? expenseData : []);
      setIncomes(Array.isArray(incomeData) ? incomeData : []);
      setInsight(insightData || null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load dashboard data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleGenerateInsight = async () => {
    if (!userId) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      await generateAIInsight(userId);
      await fetchDashboardData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to generate insight";
      setGenerateError(message);
    } finally {
      setGenerating(false);
    }
  };

  const stats = useMemo(() => {
    const totals = expenses.reduce((sum, expense) => {
      return sum + (expense.amount || 0);
    }, 0);

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const lastMonthSpend = expenses.reduce((sum, expense) => {
      if (!expense.date) return sum;
      const expenseDate = new Date(expense.date);
      if (expenseDate >= thirtyDaysAgo) {
        return sum + (expense.amount || 0);
      }
      return sum;
    }, 0);

    const foodSpend = expenses.reduce((sum, expense) => {
      if (expense.category?.toLowerCase() === "food") {
        return sum + (expense.amount || 0);
      }
      return sum;
    }, 0);

    // Income calculations (last 30 days)
    const lastMonthIncome = incomes.reduce((sum, income) => {
      if (!income.date) return sum;
      const incomeDate = new Date(income.date);
      if (incomeDate >= thirtyDaysAgo) {
        return sum + (income.amount || 0);
      }
      return sum;
    }, 0);

    // Calculate income volatility (variance)
    const last30DaysIncomes = incomes.filter((income) => {
      if (!income.date) return false;
      const incomeDate = new Date(income.date);
      return incomeDate >= thirtyDaysAgo;
    });

    let volatilityScore = 0;
    if (last30DaysIncomes.length > 1) {
      const incomeAmounts = last30DaysIncomes.map((i) => i.amount || 0);
      const avgIncome = lastMonthIncome / last30DaysIncomes.length;
      const variance =
        incomeAmounts.reduce((sum, amt) => sum + Math.pow(amt - avgIncome, 2), 0) /
        incomeAmounts.length;
      const stdDev = Math.sqrt(variance);
      volatilityScore = avgIncome > 0 ? Math.min(100, (stdDev / avgIncome) * 100) : 0;
    }

    // Savings ratio = (income - expenses) / income
    const savingsRatio = lastMonthIncome > 0 
      ? ((lastMonthIncome - lastMonthSpend) / lastMonthIncome) * 100 
      : 0;

    const lastOverview =
      insight?.overview ||
      insight?.prediction ||
      "No insights yet. Add expenses to get personalized guidance.";

    return {
      totalExpenses: totals,
      lastMonthSpend,
      foodSpend,
      lastMonthIncome,
      volatilityScore: Math.round(volatilityScore * 100) / 100,
      savingsRatio: Math.round(savingsRatio * 100) / 100,
      lastOverview,
    };
  }, [expenses, incomes, insight]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);

  // Pie chart data
  const pieChartData = useMemo(() => {
    const byCategory: Record<string, number> = {};
    expenses.forEach(exp => {
      const cat = exp.category || 'Other';
      byCategory[cat] = (byCategory[cat] || 0) + (exp.amount || 0);
    });
    
    const data = Object.entries(byCategory)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
    
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#ef4444', '#14b8a6'];
    const total = data.reduce((sum, e) => sum + e.value, 0);
    
    return { pieData: data, colors, total };
  }, [expenses]);

  // Line chart data with category breakdown
  const lineChartData = useMemo(() => {
    const now = new Date();
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    
    // Get all unique categories
    const categories = Array.from(new Set(expenses.map(exp => exp.category || 'Other')));
    const categoryColors: Record<string, string> = {
      Food: '#3b82f6',
      Transport: '#8b5cf6',
      Entertainment: '#ec4899',
      Bills: '#f59e0b',
      Shopping: '#10b981',
      Other: '#6366f1',
    };
    
    const chartData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - i));
      const dayData: any = {
        day: days[date.getDay()],
      };
      
      // Calculate spending per category for this day
      categories.forEach(cat => {
        dayData[cat] = expenses
          .filter(exp => {
            if (!exp.date || (exp.category || 'Other') !== cat) return false;
            const expDate = new Date(exp.date);
            return expDate.toDateString() === date.toDateString();
          })
          .reduce((sum, exp) => sum + (exp.amount || 0), 0);
      });
      
      return dayData;
    });

    return { chartData, categories, categoryColors };
  }, [expenses]);

  if (error && !loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg p-6">
          {error}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
    >
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Welcome back, Coach!
        </h1>
        <p className="text-gray-500 dark:text-gray-400">
          Your financial overview for this month.
        </p>
      </header>

      {/* Key Metrics Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Income</h3>
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {formatCurrency(stats.lastMonthIncome)}
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            +12% from last month
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Spent</h3>
            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {formatCurrency(stats.lastMonthSpend)}
          </p>
          <p className="text-sm text-red-600 dark:text-red-400">
            -8% from last month
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Monthly Savings</h3>
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            {formatCurrency(stats.lastMonthIncome - stats.lastMonthSpend)}
          </p>
          <p className="text-sm text-blue-600 dark:text-blue-400">
            {stats.savingsRatio.toFixed(1)}% of income saved
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Survival Fund</h3>
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
            2.5 months
          </p>
          <p className="text-sm text-green-600 dark:text-green-400">
            Goal: 3 months
          </p>
        </motion.div>
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Spending Trend Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Spending Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lineChartData.chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
              <XAxis dataKey="day" stroke="#6b7280" className="dark:stroke-gray-400" />
              <YAxis stroke="#6b7280" className="dark:stroke-gray-400" tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number) => `₹${value.toFixed(0)}`}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              {lineChartData.categories.map((cat: string) => (
                <Line
                  key={cat}
                  type="monotone"
                  dataKey={cat}
                  stroke={lineChartData.categoryColors[cat] || '#6366f1'}
                  strokeWidth={2}
                  dot={{ fill: lineChartData.categoryColors[cat] || '#6366f1', r: 4 }}
                  name={cat}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Category Breakdown Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Category Breakdown
          </h2>
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieChartData.pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={pieChartData.colors[index % pieChartData.colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      `₹${value.toFixed(0)}`,
                      name
                    ]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Organized Legend */}
            <div className="flex flex-col justify-center gap-2 lg:min-w-[220px]">
              {pieChartData.pieData.map((entry, index) => {
                const percentage = pieChartData.total > 0 ? ((entry.value / pieChartData.total) * 100).toFixed(1) : '0';
                return (
                  <div
                    key={entry.name}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: pieChartData.colors[index % pieChartData.colors.length] }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                        {entry.name}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {percentage}% • {formatCurrency(entry.value)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <ExpenseList expenses={expenses} loading={loading} onUpdate={fetchDashboardData} />
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-6"
        >
          <div className="space-y-3">
            <button
              onClick={handleGenerateInsight}
              disabled={generating}
              className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium px-4 py-2 transition-colors"
            >
              {generating ? (
                <>
                  <span className="h-4 w-4 mr-2 border-2 border-white/60 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate New AI Insight"
              )}
            </button>
            {generateError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 text-sm text-red-800 dark:text-red-200">
                {generateError}
              </div>
            )}
          </div>
          <InsightCard insight={insight} loading={loading} />
          <Achievements />
        </motion.div>
      </section>
    </motion.div>
  );
}

