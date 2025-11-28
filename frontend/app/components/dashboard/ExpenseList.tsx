"use client";

import { motion } from "framer-motion";

interface Expense {
  _id?: string;
  category?: string;
  amount?: number;
  date?: string;
  description?: string;
}

interface ExpenseListProps {
  expenses: Expense[];
  loading: boolean;
}

export default function ExpenseList({ expenses, loading }: ExpenseListProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <p className="text-gray-600 dark:text-gray-400">Loading expenses...</p>
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <p className="text-gray-600 dark:text-gray-400">No expenses yet.</p>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatAmount = (amount?: number) => {
    if (amount === undefined || amount === null) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Recent Expenses
      </h2>
      <div className="space-y-3">
        {expenses.map((expense, index) => (
          <motion.div
            key={expense._id || index}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800 last:border-0"
          >
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {expense.category || "Uncategorized"}
              </p>
              {expense.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {expense.description}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="font-semibold text-gray-900 dark:text-gray-100">
                {formatAmount(expense.amount)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {formatDate(expense.date)}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

