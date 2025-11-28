"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { generateAIInsight, getInsightsHistory } from "@/lib/api";

interface Insight {
  _id?: string;
  overview?: string;
  prediction?: string;
  savingsPlan?: string;
  microTip?: string;
  createdAt?: string;
}

const userId = process.env.NEXT_PUBLIC_DEFAULT_USER || "test-user-1";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await getInsightsHistory(userId);
      setInsights(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load insights";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const handleGenerateInsight = async () => {
    if (!userId) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      await generateAIInsight(userId);
      await fetchInsights();
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate insight";
      setGenerateError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Insights
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Review your AI-driven spending guidance and trends.
          </p>
        </div>
        <button
          onClick={handleGenerateInsight}
          disabled={generating}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium px-4 py-2 transition-colors"
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
      </div>

      {generateError && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-sm text-red-800 dark:text-red-200">
          {generateError}
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-gray-600 dark:text-gray-400">Loading insights...</p>
        </div>
      ) : insights.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-gray-600 dark:text-gray-400">
            No insights available yet.
          </p>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {insights.map((insight, index) => (
            <motion.div
              key={insight._id || index}
              variants={item}
              className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-4"
            >
              {insight.overview && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Overview
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100">
                    {insight.overview}
                  </p>
                </div>
              )}

              {insight.prediction && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Prediction
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100">
                    {insight.prediction}
                  </p>
                </div>
              )}

              {insight.savingsPlan && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Savings Plan
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100">
                    {insight.savingsPlan}
                  </p>
                </div>
              )}

              {insight.microTip && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Micro Tip
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100">
                    {insight.microTip}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}

      {insights.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-gray-600 dark:text-gray-400">No insights available yet.</p>
        </div>
      ) : (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {insights.map((insight, index) => (
            <motion.div
              key={insight._id || index}
              variants={item}
              className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-4"
            >
              {insight.overview && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Overview
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100">{insight.overview}</p>
                </div>
              )}

              {insight.prediction && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Prediction
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100">{insight.prediction}</p>
                </div>
              )}

              {insight.savingsPlan && (
                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                    Savings Plan
                  </h3>
                  <p className="text-gray-900 dark:text-gray-100">{insight.savingsPlan}</p>
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
            </motion.div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}

