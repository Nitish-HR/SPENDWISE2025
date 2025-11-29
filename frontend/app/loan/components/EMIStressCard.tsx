"use client";

import { motion } from "framer-motion";

interface EMIStressCardProps {
  stressData: {
    emiToIncomeRatio?: number;
    missProbability?: number;
    dailyCushion?: number;
    weeklyCushion?: number;
    readinessScore?: number;
    totalEMI?: number;
    netIncome?: number;
    riskLevel?: string;
    nextWarning?: string | null;
  } | null;
  loading: boolean;
}

export default function EMIStressCard({ stressData, loading }: EMIStressCardProps) {
  if (loading || !stressData) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const getStressColor = (score: number | undefined) => {
    const safeScore = score ?? 0;
    if (safeScore >= 80) return "bg-green-500";
    if (safeScore >= 60) return "bg-yellow-500";
    if (safeScore >= 40) return "bg-orange-500";
    return "bg-red-500";
  };

  const getStressLevel = (score: number | undefined) => {
    const safeScore = score ?? 0;
    if (safeScore >= 80) return "Low";
    if (safeScore >= 60) return "Medium";
    if (safeScore >= 40) return "High";
    return "Critical";
  };

  const formatCurrency = (amount: number | undefined) => {
    const safeAmount = amount ?? 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(safeAmount);
  };

  const emiToIncomeRatio = stressData?.emiToIncomeRatio ?? 0;
  const missProbability = stressData?.missProbability ?? 0;
  const readinessScore = stressData?.readinessScore ?? 0;
  const dailyCushion = stressData?.dailyCushion ?? 0;
  const weeklyCushion = stressData?.weeklyCushion ?? 0;
  const riskLevel = stressData?.riskLevel ?? getStressLevel(readinessScore);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-4"
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
        EMI Stress Forecast
      </h2>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">EMI-to-Income Ratio</span>
            <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {emiToIncomeRatio.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className={`h-2 rounded-full ${getStressColor(readinessScore)}`}
              style={{ width: `${Math.min(100, emiToIncomeRatio)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Miss Probability</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {missProbability.toFixed(1)}%
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Readiness Score</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {readinessScore}/100
            </p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Daily Cushion Needed
          </p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(dailyCushion)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Weekly: {formatCurrency(weeklyCushion)}
          </p>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
          <span className="text-sm text-gray-600 dark:text-gray-400">Stress Level:</span>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            readinessScore >= 80
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : readinessScore >= 60
              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
              : readinessScore >= 40
              ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
          }`}>
            {riskLevel}
          </span>
        </div>

        {stressData?.nextWarning && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ {stressData.nextWarning}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

