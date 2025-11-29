"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  getLoans,
  addLoan,
  updateLoan,
  deleteLoan,
  getEMIStress,
  getEMICalendar,
  getEMIAI,
} from "@/lib/api";
import LoanForm from "./components/LoanForm";
import EMIStressCard from "./components/EMIStressCard";
import WhatIfSimulator from "./components/WhatIfSimulator";
import SmartCalendar from "./components/SmartCalendar";

interface Loan {
  _id?: string;
  loanName?: string;
  principal?: number;
  interestRate?: number;
  tenureMonths?: number;
  emiAmount?: number;
  dueDate?: string;
}

const userId = process.env.NEXT_PUBLIC_DEFAULT_USER || "test-user-1";

export default function LoanPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [stressData, setStressData] = useState<any>(null);
  const [calendar, setCalendar] = useState<any>(null);
  const [aiInsight, setAIInsight] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stressLoading, setStressLoading] = useState(false);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [aiLoading, setAILoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLoan, setEditingLoan] = useState<Loan | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchLoans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getLoans(userId);
      setLoans(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load loans");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const fetchStressData = useCallback(async () => {
    setStressLoading(true);
    try {
      const data = await getEMIStress(userId);
      // Validate and set fallback values if API fails or returns empty
      if (data && typeof data === 'object') {
        setStressData({
          emiToIncomeRatio: data.emiToIncomeRatio ?? 0,
          missProbability: data.missProbability ?? 0,
          dailyCushion: data.dailyCushion ?? 0,
          weeklyCushion: data.weeklyCushion ?? 0,
          readinessScore: data.readinessScore ?? 0,
          totalEMI: data.totalEMI ?? 0,
          netIncome: data.netIncome ?? 0,
          riskLevel: data.riskLevel ?? "Low",
          nextWarning: data.nextWarning ?? null,
        });
      } else {
        // Fallback values if API fails
        setStressData({
          emiToIncomeRatio: 0,
          missProbability: 0,
          dailyCushion: 0,
          weeklyCushion: 0,
          readinessScore: 0,
          totalEMI: 0,
          netIncome: 0,
          riskLevel: "Low",
          nextWarning: null,
        });
      }
    } catch (err) {
      console.error("Failed to load stress data:", err);
      // Set fallback values on error
      setStressData({
        emiToIncomeRatio: 0,
        missProbability: 0,
        dailyCushion: 0,
        weeklyCushion: 0,
        readinessScore: 0,
        totalEMI: 0,
        netIncome: 0,
        riskLevel: "Low",
        nextWarning: null,
      });
    } finally {
      setStressLoading(false);
    }
  }, [userId]);

  const fetchCalendar = useCallback(async () => {
    setCalendarLoading(true);
    try {
      const data = await getEMICalendar(userId);
      setCalendar(data);
    } catch (err) {
      console.error("Failed to load calendar:", err);
    } finally {
      setCalendarLoading(false);
    }
  }, [userId]);

  const fetchAIInsight = useCallback(async () => {
    setAILoading(true);
    try {
      const data = await getEMIAI(userId);
      setAIInsight(data);
    } catch (err) {
      console.error("Failed to load AI insight:", err);
    } finally {
      setAILoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchLoans();
    fetchStressData();
    fetchCalendar();
    fetchAIInsight();
  }, [fetchLoans, fetchStressData, fetchCalendar, fetchAIInsight]);

  const handleAddLoan = async (loanData: any) => {
    await addLoan({ ...loanData, userId });
    await fetchLoans();
    await fetchStressData();
    await fetchCalendar();
    setShowAddForm(false);
  };

  const handleUpdateLoan = async (loanData: any) => {
    if (!editingLoan?._id) return;
    await updateLoan(editingLoan._id, loanData);
    await fetchLoans();
    await fetchStressData();
    await fetchCalendar();
    setEditingLoan(null);
  };

  const handleDeleteLoan = async (id: string) => {
    if (!confirm("Are you sure you want to delete this loan?")) return;
    setIsDeleting(id);
    try {
      await deleteLoan(id);
      await fetchLoans();
      await fetchStressData();
      await fetchCalendar();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete loan");
    } finally {
      setIsDeleting(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Calculate EMI buffer
  const nextEMIDate = loans.length > 0
    ? loans.reduce((earliest, loan) => {
        if (!loan.dueDate) return earliest;
        const loanDate = new Date(loan.dueDate);
        return !earliest || loanDate < earliest ? loanDate : earliest;
      }, null as Date | null)
    : null;

  const daysUntilEMI = nextEMIDate
    ? Math.ceil((nextEMIDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const totalEMI = loans.reduce((sum, loan) => sum + (loan.emiAmount || 0), 0);
  const requiredBuffer = totalEMI;
  const dailySavingsNeeded = daysUntilEMI && daysUntilEMI > 0 ? requiredBuffer / daysUntilEMI : 0;

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
            Loan & EMI Stress Manager
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2">
            Manage your loans, track EMI stress, and stay on top of payments.
          </p>
        </div>
        <button
          onClick={() => {
            setEditingLoan(null);
            setShowAddForm(true);
          }}
          className="inline-flex items-center justify-center rounded-md bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 transition-colors"
        >
          Add Loan
        </button>
      </div>

      {/* Alert Banner */}
      {stressData && !stressLoading && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mb-6 rounded-lg p-4 ${
            (stressData.readinessScore ?? 0) >= 80
              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              : (stressData.readinessScore ?? 0) >= 60
              ? "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
              : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
          }`}
        >
          <p
            className={`font-medium ${
              (stressData.readinessScore ?? 0) >= 80
                ? "text-green-800 dark:text-green-200"
                : (stressData.readinessScore ?? 0) >= 60
                ? "text-yellow-800 dark:text-yellow-200"
                : "text-red-800 dark:text-red-200"
            }`}
          >
            {(stressData.readinessScore ?? 0) >= 80
              ? "✅ EMI-safe — you're fully covered for this month"
              : (stressData.readinessScore ?? 0) >= 60
              ? "⚠️ Moderate EMI stress — monitor your expenses"
              : "⚠️ High EMI stress — you may miss next month's payment"}
          </p>
        </motion.div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-800 dark:text-red-200">
          {error}
        </div>
      )}

      {/* Section 1: Add Loan Form */}
      {showAddForm && (
        <div className="mb-6">
          <LoanForm
            onSubmit={handleAddLoan}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {editingLoan && (
        <div className="mb-6">
          <LoanForm
            initialData={editingLoan}
            onSubmit={handleUpdateLoan}
            onCancel={() => setEditingLoan(null)}
          />
        </div>
      )}

      {/* Section 2: EMI Stress Forecast */}
      <div className="mb-6">
        <EMIStressCard stressData={stressData} loading={stressLoading} />
      </div>

      {/* Section 3: EMI-Ready Envelope */}
      {stressData && !stressLoading && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            EMI-Ready Envelope
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Required Buffer</p>
              <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {formatCurrency(requiredBuffer)}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Days Until EMI</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">
                {daysUntilEMI !== null ? `${daysUntilEMI} days` : "N/A"}
              </p>
            </div>
            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Save Per Day</p>
              <p className="text-xl font-bold text-orange-600 dark:text-orange-400">
                {formatCurrency(dailySavingsNeeded)}
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Shortfall</p>
              <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                {stressData?.emiCoverage && stressData.emiCoverage < 0
                  ? formatCurrency(Math.abs(stressData.emiCoverage))
                  : "₹0"}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Section 4: What-If Simulator */}
      <div className="mb-6">
        <WhatIfSimulator userId={userId} />
      </div>

      {/* AI Insight */}
      {aiInsight && aiInsight.success && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6"
        >
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
            AI EMI Analysis
          </h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Overview</p>
              <p className="text-gray-900 dark:text-gray-100">{aiInsight.overview}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Stress Level
              </p>
              <span
                className={`px-3 py-1 rounded-full text-sm font-medium ${
                  aiInsight.stressLevel === "low"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : aiInsight.stressLevel === "medium"
                    ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                    : aiInsight.stressLevel === "high"
                    ? "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {aiInsight.stressLevel.toUpperCase()}
              </span>
            </div>
            {aiInsight.recommendedCuts && aiInsight.recommendedCuts.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Recommended Cuts
                </p>
                <ul className="list-disc list-inside text-gray-900 dark:text-gray-100">
                  {aiInsight.recommendedCuts.map((cut: string, idx: number) => (
                    <li key={idx}>{cut}</li>
                  ))}
                </ul>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Micro Tip</p>
              <p className="text-gray-900 dark:text-gray-100">{aiInsight.microTip}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Next Step</p>
              <p className="text-gray-900 dark:text-gray-100">{aiInsight.nextStep}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Section 5: Smart Calendar */}
      {calendar && (
        <div className="mb-6">
          <SmartCalendar calendar={calendar} loading={calendarLoading} />
        </div>
      )}

      {/* Loans List */}
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Your Loans
        </h2>
        {loading ? (
          <p className="text-gray-600 dark:text-gray-400">Loading loans...</p>
        ) : loans.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400">No loans added yet.</p>
        ) : (
          <div className="space-y-3">
            {loans.map((loan, index) => (
              <motion.div
                key={loan._id || index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="flex items-center justify-between py-3 border-b border-gray-200 dark:border-gray-800 last:border-0"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {loan.loanName}
                  </p>
                  <div className="flex gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                    <span>EMI: {formatCurrency(loan.emiAmount || 0)}</span>
                    <span>Due: {formatDate(loan.dueDate)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingLoan(loan)}
                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => loan._id && handleDeleteLoan(loan._id)}
                    disabled={isDeleting === loan._id}
                    className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 text-sm font-medium disabled:opacity-50"
                  >
                    {isDeleting === loan._id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

