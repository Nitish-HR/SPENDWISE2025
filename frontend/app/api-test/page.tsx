"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { getLatestInsights, generateAIInsight } from "@/lib/api";

const userId = "test-user-1";

export default function ApiTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const fetchLatestInsight = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getLatestInsights(userId);
      setResult(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      setResult({ error: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInsight = async () => {
    setGenerating(true);
    setError(null);
    try {
      const response = await generateAIInsight(userId);
      setResult(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      setResult({ error: errorMessage });
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchLatestInsight();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <h1 className="text-3xl font-bold mb-6">API Test (Debug)</h1>
      
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-4">
        <div className="flex gap-4 mb-4">
          <button
            onClick={fetchLatestInsight}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
          >
            {loading ? "Loading..." : "Refresh Latest Insight"}
          </button>
          <button
            onClick={handleGenerateInsight}
            disabled={generating}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md transition-colors"
          >
            {generating ? "Generating..." : "Generate Fresh Insight"}
          </button>
        </div>

        {loading || generating ? (
          <div className="text-lg text-gray-600 dark:text-gray-400">
            {generating ? "Generating insight..." : "Loading..."}
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-2">
                {error ? (
                  <span className="text-red-600 dark:text-red-400">Error</span>
                ) : (
                  <span className="text-green-600 dark:text-green-400">Success</span>
                )}
              </h2>
            </div>
            <pre className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 overflow-auto text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </motion.div>
  );
}

