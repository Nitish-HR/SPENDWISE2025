"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { client } from "@/lib/apiClient";

const userId = process.env.NEXT_PUBLIC_DEFAULT_USER || "test-user-1";

type ScenarioType = "category-change" | "income-change" | "absolute";

interface Scenario {
  type: ScenarioType;
  category?: string;
  percentChange?: number;
  amountChange?: number;
}

interface ScenarioResult {
  overview: string;
  prediction: string;
  savingsPlan: string;
  microTip: string;
}

interface WhatIfResponse {
  success: boolean;
  scenarioResult?: ScenarioResult;
  raw?: any;
  analytics?: {
    original: {
      totals: number;
      byCategory: Record<string, number>;
    };
    adjusted: {
      totals: number;
      byCategory: Record<string, number>;
    };
  };
  error?: string;
}

export default function WhatIfPage() {
  const [scenarioType, setScenarioType] = useState<ScenarioType>("category-change");
  const [category, setCategory] = useState("Food");
  const [percentChange, setPercentChange] = useState("");
  const [amountChange, setAmountChange] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WhatIfResponse | null>(null);

  const categories = ["Food", "Transport", "Entertainment", "Bills", "Other"];

  const validateForm = (): boolean => {
    if (scenarioType === "category-change") {
      if (!category) {
        setError("Please select a category");
        return false;
      }
      if (!percentChange || isNaN(parseFloat(percentChange))) {
        setError("Please enter a valid percentage change");
        return false;
      }
    } else {
      if (!amountChange || isNaN(parseFloat(amountChange))) {
        setError("Please enter a valid amount change");
        return false;
      }
    }
    return true;
  };

  const handleRunAnalysis = async () => {
    setError(null);
    setResult(null);

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const scenario: Scenario = {
      type: scenarioType,
    };

    if (scenarioType === "category-change") {
      scenario.category = category;
      scenario.percentChange = parseFloat(percentChange);
    } else {
      scenario.amountChange = parseFloat(amountChange);
    }

    try {
      const response = await client.post<WhatIfResponse>("/api/what-if", {
        userId,
        scenario,
      });

      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setError(response.message || "Failed to run analysis");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to run what-if analysis";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
    >
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          What-If Analysis
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Simulate different spending scenarios and see how they impact your finances.
        </p>
      </header>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-6">
        {/* Scenario Type Selection */}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Scenario Type
          </label>
          <select
            value={scenarioType}
            onChange={(e) => {
              setScenarioType(e.target.value as ScenarioType);
              setError(null);
              setResult(null);
            }}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
          >
            <option value="category-change">Category Change</option>
            <option value="income-change">Income Change</option>
            <option value="absolute">Absolute Change</option>
          </select>
        </div>

        {/* Dynamic Input Fields */}
        {scenarioType === "category-change" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Percentage Change (%)
              </label>
              <input
                type="number"
                step="0.01"
                value={percentChange}
                onChange={(e) => setPercentChange(e.target.value)}
                placeholder="e.g., -30 for 30% reduction"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Use negative values to reduce spending, positive to increase
              </p>
            </div>
          </motion.div>
        )}

        {(scenarioType === "income-change" || scenarioType === "absolute") && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Amount Change (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={amountChange}
              onChange={(e) => setAmountChange(e.target.value)}
              placeholder={
                scenarioType === "income-change"
                  ? "e.g., 5000 for income increase"
                  : "e.g., -2000 to reduce spending"
              }
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {scenarioType === "income-change"
                ? "Simulates a change in available income/budget"
                : "Adds or subtracts a fixed amount from total spending"}
            </p>
          </motion.div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        {/* Run Button */}
        <button
          onClick={handleRunAnalysis}
          disabled={loading}
          className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium px-4 py-2 transition-colors"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 mr-2 border-2 border-white/60 border-t-white rounded-full animate-spin" />
              Running Analysis...
            </>
          ) : (
            "Run What-If Analysis"
          )}
        </button>
      </div>

      {/* Results Display */}
      {result && result.success && result.scenarioResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Structured Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-6 space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Scenario Results
            </h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Overview
                </h3>
                <p className="text-gray-900 dark:text-gray-100">
                  {result.scenarioResult.overview}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Prediction
                </h3>
                <p className="text-gray-900 dark:text-gray-100">
                  {result.scenarioResult.prediction}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Savings Plan
                </h3>
                <p className="text-gray-900 dark:text-gray-100">
                  {result.scenarioResult.savingsPlan}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Micro Tip
                </h3>
                <p className="text-gray-900 dark:text-gray-100">
                  {result.scenarioResult.microTip}
                </p>
              </div>
            </div>
          </div>

          {/* Analytics Comparison */}
          {result.analytics && (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Analytics Comparison
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Original Total
                  </p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">
                    ₹{result.analytics.original.totals.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Adjusted Total
                  </p>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    ₹{result.analytics.adjusted.totals.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* JSON Response */}
          <details className="bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              View Raw JSON Response
            </summary>
            <pre className="mt-2 text-xs overflow-x-auto text-gray-800 dark:text-gray-200">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </motion.div>
      )}
    </motion.div>
  );
}

