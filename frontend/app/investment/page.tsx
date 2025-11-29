"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getSIPTip } from "@/lib/api";

interface SIPResults {
  totalInvested: number;
  estimatedReturns: number;
  finalCorpus: number;
}

interface ProjectionPoint {
  year: number;
  value: number;
}

export default function InvestmentPage() {
  const [monthlyInvestment, setMonthlyInvestment] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const [duration, setDuration] = useState("");
  const [results, setResults] = useState<SIPResults | null>(null);
  const [projectionData, setProjectionData] = useState<ProjectionPoint[]>([]);
  const [microTip, setMicroTip] = useState<string | null>(null);
  const [tipLoading, setTipLoading] = useState(false);
  const [tipError, setTipError] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);

  /**
   * Calculate SIP returns using the formula:
   * FV = P * [ ((1+r)^n - 1) / r ] * (1+r)
   * Where:
   * - P = monthly contribution
   * - r = monthly interest rate (annual rate / 12 / 100)
   * - n = total months
   */
  const calculateSIP = () => {
    const P = parseFloat(monthlyInvestment);
    const annualRate = parseFloat(expectedReturn);
    const years = parseFloat(duration);

    if (!P || !annualRate || !years || P <= 0 || annualRate < 0 || years <= 0) {
      alert("Please enter valid positive values for all fields.");
      return;
    }

    setCalculating(true);

    // Calculate monthly interest rate
    const r = annualRate / 12 / 100;
    const n = years * 12;

    // Calculate future value using SIP formula
    let FV = 0;
    if (r === 0) {
      // If interest rate is 0, simple calculation
      FV = P * n;
    } else {
      // FV = P * [ ((1+r)^n - 1) / r ] * (1+r)
      const numerator = Math.pow(1 + r, n) - 1;
      FV = P * (numerator / r) * (1 + r);
    }

    const totalInvested = P * n;
    const estimatedReturns = FV - totalInvested;

    const calculatedResults: SIPResults = {
      totalInvested: Math.round(totalInvested * 100) / 100,
      estimatedReturns: Math.round(estimatedReturns * 100) / 100,
      finalCorpus: Math.round(FV * 100) / 100,
    };

    setResults(calculatedResults);
    // Build projection data per year (for up to 20 years)
    const maxYears = Math.min(20, Math.max(1, Math.round(years)));
    const points: ProjectionPoint[] = [];

    for (let y = 1; y <= maxYears; y++) {
      const ny = y * 12;
      let FVy = 0;
      if (r === 0) {
        FVy = P * ny;
      } else {
        const numeratorY = Math.pow(1 + r, ny) - 1;
        FVy = P * (numeratorY / r) * (1 + r);
      }
      points.push({
        year: y,
        value: Math.round(FVy),
      });
    }
    setProjectionData(points);

    setCalculating(false);
    setMicroTip(null);
    setTipError(null);

    // Automatically fetch micro-tip
    fetchMicroTip(calculatedResults);
  };

  const fetchMicroTip = async (sipResults: SIPResults) => {
    setTipLoading(true);
    setTipError(null);

    try {
      const response = await getSIPTip({
        finalCorpus: sipResults.finalCorpus,
        invested: sipResults.totalInvested,
        returns: sipResults.estimatedReturns,
      });

      if (response.success && response.microTip) {
        setMicroTip(response.microTip);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch investment insight";
      setTipError(errorMessage);
      console.error("Error fetching SIP tip:", err);
    } finally {
      setTipLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          SIP Calculator
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Calculate your Systematic Investment Plan returns and build wealth over time.
        </p>
      </div>

      {/* Main layout: Calculator left, Projection chart right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calculator Form + Summary */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xl">
              📈
            </span>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              SIP Calculator
            </h2>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              calculateSIP();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Monthly Investment (₹)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={monthlyInvestment}
                onChange={(e) => setMonthlyInvestment(e.target.value)}
                placeholder="e.g., 5000"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Expected Annual Return (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(e.target.value)}
                placeholder="e.g., 12"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Investment Duration (Years)
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                placeholder="e.g., 10"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-gray-100"
              />
            </div>

            <button
              type="submit"
              disabled={calculating}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {calculating ? "Calculating..." : "Calculate Returns"}
            </button>
          </form>

          {/* Quick summary stats below inputs */}
          {results && (
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-gray-600 dark:text-gray-400 mb-1">Total Invested</p>
                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {formatCurrency(results.totalInvested)}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-gray-600 dark:text-gray-400 mb-1">Estimated Returns</p>
                <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {formatCurrency(results.estimatedReturns)}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-gray-600 dark:text-gray-400 mb-1">Projected Value</p>
                <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  {formatCurrency(results.finalCorpus)}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* SIP Growth Projection Chart (right side) */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            SIP Growth Projection
          </h2>
          {projectionData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={projectionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="year"
                  stroke="#6b7280"
                  tickFormatter={(value) => value.toString()}
                />
                <YAxis
                  stroke="#6b7280"
                  tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`}
                />
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  labelFormatter={(label) => `Year ${label}`}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                />
                <Legend />
                <Bar
                  dataKey="value"
                  name="Projected Value"
                  fill="#3b82f6"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[320px] flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
              Enter SIP details and calculate to see the growth projection.
            </div>
          )}
        </motion.div>
      </div>

      {/* AI Micro-Tip */}
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Investment Insight
          </h2>
          {tipLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                Generating insight...
              </span>
            </div>
          ) : tipError ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-800 dark:text-red-200 text-sm">
                {tipError}
              </p>
            </div>
          ) : microTip ? (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-blue-900 dark:text-blue-100 leading-relaxed">
                {microTip}
              </p>
            </div>
          ) : null}
        </motion.div>
      )}
    </motion.div>
  );
}

