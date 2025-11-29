"use client";

import { motion } from "framer-motion";

interface SurvivalSummaryCardProps {
  avgMonthlyIncome: number;
  avgMonthlyExpenses: number;
  burn: number;
  survivalMonths: number;
  recommendedBuffer: number;
}

export default function SurvivalSummaryCard({
  avgMonthlyIncome,
  avgMonthlyExpenses,
  burn,
  survivalMonths,
  recommendedBuffer,
}: SurvivalSummaryCardProps) {
  const status =
    survivalMonths >= 3 ? "Safe" : survivalMonths >= 1 ? "Moderate Risk" : "High Risk";

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(isNaN(amount) ? 0 : amount);

  const formatMonths = (months: number) => {
    if (!isFinite(months) || months > 120) return "> 10 years";
    if (months < 0) return "N/A";
    return `${months.toFixed(1)} months`;
  };

  const statusClasses =
    status === "Safe"
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      : status === "Moderate Risk"
      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
            Survival Summary
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Based on your last 90 days of income and expenses.
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusClasses}`}>
          {status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Monthly Income</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(avgMonthlyIncome)}
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Avg Monthly Expenses</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {formatCurrency(avgMonthlyExpenses)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Monthly Net Burn</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(burn)}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            {burn <= 0
              ? "You are currently saving each month."
              : "You are burning savings each month."}
          </p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Survival Time</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {formatMonths(survivalMonths)}
          </p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
            With your current savings and burn rate.
          </p>
        </div>
      </div>

      <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
          Recommended 3-Month Buffer
        </p>
        <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
          {formatCurrency(recommendedBuffer)}
        </p>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          Target savings to feel safe for 3 months.
        </p>
      </div>
    </motion.div>
  );
}