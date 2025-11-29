"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  SparklesIcon,
  TrophyIcon,
  CurrencyDollarIcon,
  FlagIcon,
  FireIcon,
  CheckCircleIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { getExpenses, getGoals } from "@/lib/api";

interface Expense {
  _id?: string;
  category?: string;
  amount?: number;
  date?: string;
  description?: string;
}

interface Goal {
  _id: string;
  userId: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  earned: boolean;
}

const userId = process.env.NEXT_PUBLIC_DEFAULT_USER || "test-user-1";

export default function Achievements() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [expenseData, goalData] = await Promise.all([
          getExpenses(userId),
          getGoals(userId),
        ]);
        setExpenses(Array.isArray(expenseData) ? expenseData : []);
        setGoals(Array.isArray(goalData) ? goalData : []);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load achievements data";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const achievements = useMemo<Achievement[]>(() => {
    // 1. First Expense Added
    const firstExpenseEarned = expenses.length >= 1;

    // 2. 10 Expenses Logged
    const tenExpensesEarned = expenses.length >= 10;

    // 3. Spent Less Than ₹500 This Week
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastWeekSpending = expenses.reduce((sum, expense) => {
      if (!expense.date) return sum;
      const expenseDate = new Date(expense.date);
      if (expenseDate >= sevenDaysAgo) {
        return sum + (expense.amount || 0);
      }
      return sum;
    }, 0);
    const lowSpendingEarned = lastWeekSpending < 500;

    // 4. Goal Created
    const goalCreatedEarned = goals.length >= 1;

    // 5. 50% to Goal
    const fiftyPercentEarned = goals.some(
      (goal) => goal.savedAmount >= goal.targetAmount * 0.5
    );

    // 6. 3-Day Logging Streak
    const threeDayStreakEarned = (() => {
      if (expenses.length === 0) return false;

      // Get unique dates from expenses
      const expenseDates = expenses
        .map((exp) => {
          if (!exp.date) return null;
          const date = new Date(exp.date);
          return date.toISOString().split("T")[0]; // YYYY-MM-DD
        })
        .filter((date): date is string => date !== null);

      const uniqueDates = Array.from(new Set(expenseDates)).sort();

      if (uniqueDates.length < 3) return false;

      // Check for 3 consecutive days
      for (let i = 0; i <= uniqueDates.length - 3; i++) {
        const date1 = new Date(uniqueDates[i]);
        const date2 = new Date(uniqueDates[i + 1]);
        const date3 = new Date(uniqueDates[i + 2]);

        const diff1 = (date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24);
        const diff2 = (date3.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24);

        if (diff1 === 1 && diff2 === 1) {
          return true;
        }
      }

      return false;
    })();

    return [
      {
        id: "first-expense",
        title: "First Expense Added",
        description: "Log your first expense",
        icon: SparklesIcon,
        earned: firstExpenseEarned,
      },
      {
        id: "ten-expenses",
        title: "10 Expenses Logged",
        description: "Keep tracking your spending",
        icon: TrophyIcon,
        earned: tenExpensesEarned,
      },
      {
        id: "low-spending",
        title: "Spent Less Than ₹500 This Week",
        description: "Great job managing your budget",
        icon: CurrencyDollarIcon,
        earned: lowSpendingEarned,
      },
      {
        id: "goal-created",
        title: "Goal Created",
        description: "Set your first savings goal",
        icon: FlagIcon,
        earned: goalCreatedEarned,
      },
      {
        id: "fifty-percent",
        title: "50% to Goal",
        description: "Halfway there! Keep going",
        icon: CheckCircleIcon,
        earned: fiftyPercentEarned,
      },
      {
        id: "three-day-streak",
        title: "3-Day Logging Streak",
        description: "Consistency is key to success",
        icon: FireIcon,
        earned: threeDayStreakEarned,
      },
    ];
  }, [expenses, goals]);

  const earnedCount = achievements.filter((a) => a.earned).length;

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <p className="text-gray-600 dark:text-gray-400">Loading achievements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Achievements
        </h2>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {earnedCount} / {achievements.length}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {achievements.map((achievement, index) => {
          const Icon = achievement.icon;
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              whileHover={{ scale: 1.05 }}
              className={`
                relative p-4 rounded-lg border-2 transition-all
                ${
                  achievement.earned
                    ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60"
                }
              `}
            >
              <div className="flex items-start space-x-3">
                <div
                  className={`
                  flex-shrink-0 p-2 rounded-lg
                  ${
                    achievement.earned
                      ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
                  }
                `}
                >
                  {achievement.earned ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    >
                      <Icon className="h-6 w-6" />
                    </motion.div>
                  ) : (
                    <LockClosedIcon className="h-6 w-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className={`
                    text-sm font-semibold mb-1
                    ${
                      achievement.earned
                        ? "text-gray-900 dark:text-gray-100"
                        : "text-gray-500 dark:text-gray-400"
                    }
                  `}
                  >
                    {achievement.title}
                  </h3>
                  <p
                    className={`
                    text-xs
                    ${
                      achievement.earned
                        ? "text-gray-600 dark:text-gray-300"
                        : "text-gray-400 dark:text-gray-500"
                    }
                  `}
                  >
                    {achievement.description}
                  </p>
                </div>
                {achievement.earned && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                    className="flex-shrink-0"
                  >
                    <CheckCircleIcon className="h-5 w-5 text-green-500" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

