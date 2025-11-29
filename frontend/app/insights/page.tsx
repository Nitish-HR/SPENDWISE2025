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

      {/* Investment Growth Potential Card */}
      {latestInsight && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6 bg-gradient-to-br from-green-500 to-green-600 rounded-lg border border-green-600 p-6 text-white"
        >
          <h2 className="text-xl font-semibold mb-2">Investment Growth Potential</h2>
          <p className="text-green-50 mb-4">
            If you invest ₹500/month as SIP, it could become ₹40,000 in 5 years (assuming 12% annual return)
          </p>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Growth Projection</span>
            <div className="flex-1 bg-green-400/30 rounded-full h-2">
              <div className="bg-white rounded-full h-2" style={{ width: '75%' }}></div>
            </div>
            <span className="text-2xl font-bold">₹40,000</span>
          </div>
        </motion.div>
      )}

      {/* Insight Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Food Delivery Opportunity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-900 rounded-lg border border-blue-200 dark:border-blue-800 p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Food Delivery Opportunity
            </h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            You spent ₹2,500 on food delivery last month. Cooking twice a week could save you ₹1,000.
          </p>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Potential Impact</p>
            <p className="text-lg font-bold text-blue-600 dark:text-blue-400">₹1,000/month</p>
          </div>
        </motion.div>

        {/* Transport Spike Detected */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-900 rounded-lg border border-red-200 dark:border-red-800 p-6"
        >
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Transport Spike Detected
            </h3>
          </div>
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Your transport expenses increased 40% this month. Consider carpooling or public transit.
          </p>
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Potential Impact</p>
            <p className="text-lg font-bold text-red-600 dark:text-red-400">Save ₹500/month</p>
          </div>
        </motion.div>
      </div>

      {/* Latest Insight Section */}
      {latestInsight && (
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Latest Insight
          </h2>
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
        </section>
      )}

      {/* AI Timeline Section */}
      <section>
        <InsightTimeline timeline={timeline} loading={timelineLoading} />
      </section>
    </motion.div>
  );
}

