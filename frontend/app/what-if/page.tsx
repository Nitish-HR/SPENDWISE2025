"use client";

import { useState, useMemo } from "react";
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

interface PredefinedScenario {
  id: string;
  title: string;
  description: string;
  scenario: Scenario;
}

const predefinedScenarios: PredefinedScenario[] = [
  {
    id: "reduce-outings",
    title: "Reduce Outings",
    description: "Cut food delivery and entertainment by ₹500",
    scenario: {
      type: "absolute",
      amountChange: -500,
    },
  },
  {
    id: "rent-increase",
    title: "Rent Increase",
    description: "What if your rent increases by ₹2000?",
    scenario: {
      type: "absolute",
      amountChange: 2000,
    },
  },
  {
    id: "income-boost",
    title: "Income Boost",
    description: "Earn ₹13,500 more this month",
    scenario: {
      type: "income-change",
      amountChange: 13500,
    },
  },
];

export default function WhatIfPage() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string | null>(null);
  const [customScenario, setCustomScenario] = useState<Scenario | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WhatIfResponse | null>(null);
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customForm, setCustomForm] = useState({
    category: "Food",
    percentChange: "",
    amountChange: "",
  });

  const categories = ["Food", "Transport", "Entertainment", "Bills", "Shopping", "Other"];

  const currentScenario = useMemo(() => {
    if (selectedScenarioId === "custom" && customScenario) {
      return {
        id: "custom",
        title: "Custom Scenario",
        description: customScenario.type === "category-change"
          ? `${customScenario.category} Reduction (₹${Math.abs(customScenario.percentChange || 0)}%)`
          : `Amount Change: ₹${customScenario.amountChange || 0}`,
        scenario: customScenario,
      };
    }
    return predefinedScenarios.find((s) => s.id === selectedScenarioId) || null;
  }, [selectedScenarioId, customScenario]);

  const handleScenarioSelect = (scenarioId: string) => {
    if (scenarioId === "custom") {
      setShowCustomForm(true);
      setSelectedScenarioId("custom");
      setResult(null);
      setError(null);
    } else {
      setShowCustomForm(false);
      setSelectedScenarioId(scenarioId);
      setResult(null);
      setError(null);
      // Auto-run the scenario
      if (scenarioId) {
        const scenario = predefinedScenarios.find((s) => s.id === scenarioId);
        if (scenario) {
          runScenario(scenario.scenario);
        }
      }
    }
  };

  const handleCustomSubmit = () => {
    const scenario: Scenario = {
      type: customForm.percentChange ? "category-change" : "absolute",
    };

    if (scenario.type === "category-change") {
      scenario.category = customForm.category;
      scenario.percentChange = parseFloat(customForm.percentChange);
    } else {
      scenario.amountChange = parseFloat(customForm.amountChange);
    }

    setCustomScenario(scenario);
    setShowCustomForm(false);
    runScenario(scenario);
  };

  const runScenario = async (scenario: Scenario) => {
    setLoading(true);
    setError(null);
    setResult(null);

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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const currentMonthlySpending = result?.analytics?.original.totals || 0;
  const adjustedMonthlySpending = result?.analytics?.adjusted.totals || 0;
  const potentialSavings = currentMonthlySpending - adjustedMonthlySpending;
  const annualImpact = potentialSavings * 12;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Sidebar - Scenario List */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-1 space-y-3"
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Scenarios
          </h2>
          <div className="space-y-2">
            {predefinedScenarios.map((scenario) => (
              <motion.button
                key={scenario.id}
                onClick={() => handleScenarioSelect(scenario.id)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedScenarioId === scenario.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                    : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700"
                }`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {scenario.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {scenario.description}
                </p>
              </motion.button>
            ))}

            {/* Custom Scenario */}
            <motion.button
              onClick={() => handleScenarioSelect("custom")}
              className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                selectedScenarioId === "custom"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300 dark:hover:border-gray-700"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                Custom Scenario
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Create your own scenario
              </p>
            </motion.button>
          </div>

          {/* Custom Scenario Form */}
          {showCustomForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 space-y-3"
            >
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Category Reduction
                </label>
                <select
                  value={customForm.category}
                  onChange={(e) =>
                    setCustomForm({ ...customForm, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Percentage Change (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={customForm.percentChange}
                  onChange={(e) =>
                    setCustomForm({ ...customForm, percentChange: e.target.value })
                  }
                  placeholder="e.g., -30"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                  Or Amount Change (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={customForm.amountChange}
                  onChange={(e) =>
                    setCustomForm({ ...customForm, amountChange: e.target.value })
                  }
                  placeholder="e.g., -500"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
                />
              </div>
              <button
                onClick={handleCustomSubmit}
                className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors text-sm"
              >
                Run Scenario
              </button>
            </motion.div>
          )}
        </motion.div>

        {/* Right Main Content - Scenario Impact */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-2 space-y-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <svg
              className="w-6 h-6 text-blue-600 dark:text-blue-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
              />
            </svg>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Scenario Impact
            </h2>
          </div>

          {currentScenario && (
            <div className="mb-4">
              <p className="text-gray-700 dark:text-gray-300">
                {currentScenario.title} - See how your finances change.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                Analyzing scenario...
              </span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
            </div>
          )}

          {result && result.success && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Impact Boxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Current Monthly Spending */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <p className="text-sm font-medium text-blue-100 mb-2">
                    Current Monthly Spending
                  </p>
                  <p className="text-3xl font-bold">
                    {formatCurrency(currentMonthlySpending)}
                  </p>
                </div>

                {/* Potential Savings */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-6 text-white">
                  <p className="text-sm font-medium text-green-100 mb-2">
                    Potential Savings
                  </p>
                  <p className="text-3xl font-bold">
                    {potentialSavings >= 0 ? "+" : ""}
                    {formatCurrency(potentialSavings)}
                  </p>
                </div>
              </div>

              {/* Annual Impact */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <p className="text-sm font-medium text-purple-100 mb-2">
                  Annual Impact
                </p>
                <p className="text-4xl font-bold">
                  {formatCurrency(annualImpact)}
                </p>
              </div>

              {/* Spending Breakdown */}
              {result.analytics && (
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    Spending Breakdown
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(result.analytics.original.byCategory).map(
                      ([category, amount]) => {
                        const adjustedAmount =
                          result.analytics?.adjusted.byCategory[category] || amount;
                        const change = adjustedAmount - amount;
                        return (
                          <div
                            key={category}
                            className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-800 last:border-0"
                          >
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {category}
                              </p>
                              <div className="flex items-center gap-4 mt-1">
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  Original: {formatCurrency(amount)}
                                </span>
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  Adjusted: {formatCurrency(adjustedAmount)}
                                </span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p
                                className={`font-semibold ${
                                  change < 0
                                    ? "text-green-600 dark:text-green-400"
                                    : change > 0
                                    ? "text-red-600 dark:text-red-400"
                                    : "text-gray-600 dark:text-gray-400"
                                }`}
                              >
                                {change >= 0 ? "+" : ""}
                                {formatCurrency(change)}
                              </p>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              )}

              {/* AI Insights */}
              {result.scenarioResult && (
                <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                    AI Insights
                  </h3>
                  <div className="space-y-4">
                    {result.scenarioResult.overview && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Overview
                        </h4>
                        <p className="text-gray-900 dark:text-gray-100">
                          {result.scenarioResult.overview}
                        </p>
                      </div>
                    )}
                    {result.scenarioResult.microTip && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Quick Tip
                        </h4>
                        <p className="text-gray-900 dark:text-gray-100">
                          {result.scenarioResult.microTip}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {!currentScenario && !loading && (
            <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">
                Select a scenario
              </h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Choose a scenario from the left to see its financial impact.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
