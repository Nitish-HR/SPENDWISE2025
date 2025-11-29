"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { generateAIInsight, getInsightsHistory, getInsightsTimeline } from "@/lib/api";
import InsightTimeline from "@/app/components/insights/InsightTimeline";

interface Insight {
  _id?: string;
  overview?: string;
  prediction?: string;
  savingsPlan?: string;
  microTip?: string;
  createdAt?: string;
}

interface TimelineInsight {
  _id?: string;
  overview?: string;
  prediction?: string;
  savingsPlan?: string;
  microTip?: string;
  overspendAreas?: Array<{
    category: string;
    amount: number;
    why?: string;
  }>;
  createdAt?: string;
}

const userId = process.env.NEXT_PUBLIC_DEFAULT_USER || "test-user-1";

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [timeline, setTimeline] = useState<TimelineInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [timelineLoading, setTimelineLoading] = useState(true);
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

  const fetchTimeline = useCallback(async () => {
    setTimelineLoading(true);
    try {
      const data = await getInsightsTimeline(userId);
      setTimeline(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load timeline:", err);
      // Don't set error state for timeline, just log it
    } finally {
      setTimelineLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchInsights();
    fetchTimeline();
  }, [fetchInsights, fetchTimeline]);

  const handleGenerateInsight = async () => {
    if (!userId) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      await generateAIInsight(userId);
      await Promise.all([fetchInsights(), fetchTimeline()]);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to generate insight";
      setGenerateError(errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  const latestInsight = insights.length > 0 ? insights[0] : null;

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

      {/* Latest Insight Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Latest Insight
        </h2>
        {loading ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <p className="text-gray-600 dark:text-gray-400">Loading latest insight...</p>
          </div>
        ) : latestInsight ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-4"
          >
            {latestInsight.overview && (
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Overview
                </h3>
                <p className="text-gray-900 dark:text-gray-100">
                  {latestInsight.overview}
                </p>
              </div>
            )}

            {latestInsight.prediction && (
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Prediction
                </h3>
                <p className="text-gray-900 dark:text-gray-100">
                  {latestInsight.prediction}
                </p>
              </div>
            )}

            {latestInsight.savingsPlan && (
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Savings Plan
                </h3>
                <p className="text-gray-900 dark:text-gray-100">
                  {latestInsight.savingsPlan}
                </p>
              </div>
            )}

            {latestInsight.microTip && (
              <div>
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                  Micro Tip
                </h3>
                <p className="text-gray-900 dark:text-gray-100">
                  {latestInsight.microTip}
                </p>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
            <p className="text-gray-600 dark:text-gray-400">
              No insights available yet. Generate your first insight to get started.
            </p>
          </div>
        )}
      </section>

      {/* AI Timeline Section */}
      <section>
        <InsightTimeline timeline={timeline} loading={timelineLoading} />
      </section>
    </motion.div>
  );
}

