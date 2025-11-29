"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { simulateEMIWhatIf } from "@/lib/api";

interface WhatIfSimulatorProps {
  userId: string;
}

export default function WhatIfSimulator({ userId }: WhatIfSimulatorProps) {
  const [scenarioType, setScenarioType] = useState("income-drop");
  const [scenarioValue, setScenarioValue] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSimulate = async () => {
    if (!scenarioValue || parseFloat(scenarioValue) <= 0) {
      setError("Please enter a valid scenario value");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await simulateEMIWhatIf({
        userId,
        scenario: {
          type: scenarioType,
          value: parseFloat(scenarioValue),
        },
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to simulate scenario");
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

  const chartData = result
    ? [
        {
          name: "Net Income",
          amount: result.impact.newNetIncome,
        },
        {
          name: "EMI",
          amount: result.newEMI,
        },
        {
          name: "Coverage",
          amount: result.impact.emiCoverage,
        },
      ]
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6"
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        EMI What-If Simulator
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Scenario Type
          </label>
          <select
            value={scenarioType}
            onChange={(e) => setScenarioType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
          >
            <option value="income-drop">Income Drop (%)</option>
            <option value="expense-rise">Expense Rise (%)</option>
            <option value="interest-change">Interest Change (%)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Value (%)
          </label>
          <input
            type="number"
            step="0.1"
            value={scenarioValue}
            onChange={(e) => setScenarioValue(e.target.value)}
            placeholder="e.g., 20"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
          />
        </div>

        <button
          onClick={handleSimulate}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {loading ? "Simulating..." : "Run Simulation"}
        </button>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-4 mt-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Survivability Score</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {result.survivabilityScore}/100
              </p>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                {result.microTip}
              </p>
            </div>

            {chartData.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Impact Analysis
                </h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis
                      stroke="#6b7280"
                      tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="amount" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

