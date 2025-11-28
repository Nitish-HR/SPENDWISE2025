"use client";

import { motion } from "framer-motion";

interface Insight {
  overview?: string;
  topOverspendArea?: string;
  savingsTip?: string;
  microTip?: string;
  riskPrediction?: string;
}

interface InsightCardProps {
  insight: Insight | null;
  loading: boolean;
}

export default function InsightCard({ insight, loading }: InsightCardProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <p className="text-gray-600 dark:text-gray-400">Loading insights...</p>
      </div>
    );
  }

  if (!insight) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6"
      >
        <p className="text-gray-600 dark:text-gray-400">
          No insights yet. Add expenses to generate.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-4"
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Insights
      </h2>

      {insight.overview && (
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Overview
          </h3>
          <p className="text-gray-900 dark:text-gray-100">{insight.overview}</p>
        </div>
      )}

      {insight.topOverspendArea && (
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Top Overspend Area
          </h3>
          <p className="text-gray-900 dark:text-gray-100">
            {insight.topOverspendArea}
          </p>
        </div>
      )}

      {insight.savingsTip && (
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Savings Tip
          </h3>
          <p className="text-gray-900 dark:text-gray-100">
            {insight.savingsTip}
          </p>
        </div>
      )}

      {insight.microTip && (
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Micro Tip
          </h3>
          <p className="text-gray-900 dark:text-gray-100">{insight.microTip}</p>
        </div>
      )}

      {insight.riskPrediction && (
        <div>
          <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
            Risk Prediction
          </h3>
          <p className="text-gray-900 dark:text-gray-100">
            {insight.riskPrediction}
          </p>
        </div>
      )}
    </motion.div>
  );
}

