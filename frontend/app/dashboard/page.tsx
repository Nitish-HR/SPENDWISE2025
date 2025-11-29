"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { generateAIInsight, getExpenses, getLatestInsights, getIncome } from "@/lib/api";
import StatCard from "@/app/components/dashboard/StatCard";
import InsightCard from "@/app/components/dashboard/InsightCard";
import ExpenseList from "@/app/components/dashboard/ExpenseList";
import Achievements from "@/app/components/Achievements";

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
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Dashboard
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Overview of your recent spending, insights, and trends.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Expenses"
          value={formatCurrency(stats.totalExpenses)}
          delay={0}
        />
        <StatCard
          title="Last 30 Days"
          value={formatCurrency(stats.lastMonthSpend)}
          delay={0.1}
        />
        <StatCard
          title="Total Income (Last 30 Days)"
          value={formatCurrency(stats.lastMonthIncome)}
          delay={0.2}
        />
        <StatCard
          title="Savings Ratio"
          value={`${stats.savingsRatio >= 0 ? '+' : ''}${stats.savingsRatio.toFixed(1)}%`}
          delay={0.3}
        />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard
          title="Food Spend"
          value={formatCurrency(stats.foodSpend)}
          delay={0.4}
        />
        <StatCard
          title="Income Volatility"
          value={`${stats.volatilityScore.toFixed(1)}%`}
          delay={0.5}
        />
        <StatCard
          title="Last AI Insight"
          value={
            stats.lastOverview.length > 48
              ? `${stats.lastOverview.slice(0, 48)}…`
              : stats.lastOverview
          }
          delay={0.6}
        />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
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

