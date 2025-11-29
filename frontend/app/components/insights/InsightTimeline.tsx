"use client";

import { motion } from "framer-motion";

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

interface InsightTimelineProps {
  timeline: TimelineInsight[];
  loading: boolean;
}

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
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

const formatDate = (dateString?: string) => {
  if (!dateString) return "Date unknown";
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateString;
  }
};

export default function InsightTimeline({
  timeline,
  loading,
}: InsightTimelineProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <p className="text-gray-600 dark:text-gray-400">Loading timeline...</p>
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <p className="text-gray-600 dark:text-gray-400">
          No insights in timeline yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
        AI Timeline
      </h2>

      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="relative"
      >
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

        <div className="space-y-8">
          {timeline.map((insight, index) => (
            <motion.div
              key={insight._id || index}
              variants={item}
              className="relative pl-12"
            >
              {/* Timeline dot */}
              <div className="absolute left-0 top-2 w-8 h-8 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-blue-500 dark:bg-blue-400 ring-4 ring-white dark:ring-gray-900" />
              </div>

              {/* Insight card */}
              <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-5 space-y-4 hover:shadow-md transition-shadow">
                {/* Date header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {formatDate(insight.createdAt)}
                  </span>
                </div>

                {/* Overview */}
                {insight.overview && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Overview
                    </h3>
                    <p className="text-gray-900 dark:text-gray-100 text-sm leading-relaxed">
                      {insight.overview}
                    </p>
                  </div>
                )}

                {/* Prediction */}
                {insight.prediction && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Prediction
                    </h3>
                    <p className="text-gray-900 dark:text-gray-100 text-sm leading-relaxed">
                      {insight.prediction}
                    </p>
                  </div>
                )}

                {/* Savings Plan */}
                {insight.savingsPlan && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Savings Plan
                    </h3>
                    <p className="text-gray-900 dark:text-gray-100 text-sm leading-relaxed">
                      {insight.savingsPlan}
                    </p>
                  </div>
                )}

                {/* Micro Tip */}
                {insight.microTip && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Micro Tip
                    </h3>
                    <p className="text-gray-900 dark:text-gray-100 text-sm leading-relaxed">
                      {insight.microTip}
                    </p>
                  </div>
                )}

                {/* Overspend Areas */}
                {insight.overspendAreas &&
                  insight.overspendAreas.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                        Overspend Areas
                      </h3>
                      <div className="space-y-2">
                        {insight.overspendAreas.map((area, areaIndex) => (
                          <div
                            key={areaIndex}
                            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-2"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-red-800 dark:text-red-200">
                                {area.category}
                              </span>
                              <span className="text-sm text-red-700 dark:text-red-300">
                                ₹{area.amount.toFixed(2)}
                              </span>
                            </div>
                            {area.why && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                {area.why}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

