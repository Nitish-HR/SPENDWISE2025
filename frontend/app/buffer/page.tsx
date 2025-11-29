"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { getExpenses, getIncome } from "@/lib/api";
import SurvivalSummaryCard from "@/app/components/buffer/SurvivalSummaryCard";
import BufferChart from "@/app/components/buffer/BufferChart";
import TipCard from "@/app/components/buffer/TipCard";

interface Expense {
  amount?: number;
  category?: string;
  date?: string;
}

interface Income {
  amount?: number;
  date?: string;
}

const userId = process.env.NEXT_PUBLIC_DEFAULT_USER || "test-user-1";

export default function BufferPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [savings, setSavings] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [expenseData, incomeData] = await Promise.all([
        getExpenses(userId),
        getIncome(userId),
      ]);

      setExpenses(Array.isArray(expenseData) ? expenseData : []);
      setIncomes(Array.isArray(incomeData) ? incomeData : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const now = useMemo(() => new Date(), []);
  const ninetyDaysAgo = useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() - 90);
    return d;
  }, [now]);

  const {
    avgMonthlyIncome,
    avgMonthlyExpenses,
    burn,
    survivalMonths,
    recommendedBuffer,
    microTip,
  } = useMemo(() => {
    // Filter last 90 days
    const recentExpenses = expenses.filter((exp) => {
      if (!exp.date) return false;
      const d = new Date(exp.date);
      return d >= ninetyDaysAgo && d <= now;
    });

    const recentIncomes = incomes.filter((inc) => {
      if (!inc.date) return false;
      const d = new Date(inc.date);
      return d >= ninetyDaysAgo && d <= now;
    });

    const totalExpenses = recentExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    const totalIncome = recentIncomes.reduce((sum, inc) => sum + (inc.amount || 0), 0);

    // Convert 90-day totals to monthly (approximate)
    const avgMonthlyExpenses = (totalExpenses / 90) * 30;
    const avgMonthlyIncome = (totalIncome / 90) * 30;

    const burn = avgMonthlyExpenses - avgMonthlyIncome;

    const savingsNum = parseFloat(savings) || 0;
    const effectiveBurn = burn <= 0 ? 1 : burn; // avoid division by zero / negative
    const survivalMonthsRaw = savingsNum > 0 ? savingsNum / effectiveBurn : 0;

    let recommendedBuffer = burn > 0 ? burn * 3 : 0;

    // Category breakdown for micro-tip
    const totalForPercent = totalExpenses || 1;
    const byCategory: Record<string, number> = {};
    recentExpenses.forEach((exp) => {
      const cat = (exp.category || "other").toLowerCase();
      byCategory[cat] = (byCategory[cat] || 0) + (exp.amount || 0);
    });

    const foodPct = ((byCategory["food"] || 0) / totalForPercent) * 100;
    const shoppingPct = ((byCategory["shopping"] || 0) / totalForPercent) * 100;
    const transportPct = ((byCategory["transport"] || 0) / totalForPercent) * 100;

    let microTip = "Good job! Increase savings by automating transfers.";
    if (foodPct > 30) {
      microTip = "Reduce food delivery frequency for instant savings.";
    } else if (shoppingPct > 20) {
      microTip = "Limit impulse purchases for a stronger buffer.";
    } else if (transportPct > 15) {
      microTip = "Use cheaper commute alternatives this month.";
    }

    return {
      avgMonthlyIncome,
      avgMonthlyExpenses,
      burn,
      survivalMonths: isFinite(survivalMonthsRaw) ? survivalMonthsRaw : 0,
      recommendedBuffer,
      microTip,
    };
  }, [expenses, incomes, ninetyDaysAgo, now, savings]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(isNaN(amount) ? 0 : amount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
    >
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Emergency Buffer Calculator
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Understand how long your savings can support you and what buffer you need to feel
          safe.
        </p>
      </header>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Savings Input */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
          Current Savings (₹)
        </label>
        <input
          type="number"
          min={0}
          value={savings}
          onChange={(e) => setSavings(e.target.value)}
          placeholder="Enter your available savings"
          className="w-full max-w-sm px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          This is the amount you have in cash or liquid savings today.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SurvivalSummaryCard
            avgMonthlyIncome={avgMonthlyIncome}
            avgMonthlyExpenses={avgMonthlyExpenses}
            burn={burn}
            survivalMonths={survivalMonths}
            recommendedBuffer={recommendedBuffer}
          />

          <BufferChart
            currentSavings={parseFloat(savings) || 0}
            recommendedBuffer={recommendedBuffer}
          />
        </div>
        <div>
          <TipCard microTip={microTip} />

          <div className="mt-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-4 text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <p className="font-medium text-gray-900 dark:text-gray-100">Quick Stats</p>
            <p>
              <span className="text-gray-500 dark:text-gray-400">Total 90d Income: </span>
              <span>
                {formatCurrency(
                  incomes.reduce((sum, inc) => sum + (inc.amount || 0), 0)
                )}
              </span>
            </p>
            <p>
              <span className="text-gray-500 dark:text-gray-400">Total 90d Expenses: </span>
              <span>
                {formatCurrency(
                  expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0)
                )}
              </span>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}