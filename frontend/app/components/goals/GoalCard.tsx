"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

interface Goal {
  _id: string;
  userId: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  deadline: string;
  createdAt?: string;
  updatedAt?: string;
}

interface GoalCardProps {
  goal: Goal;
  onDelete: (id: string) => void;
  deleting?: boolean;
  delay?: number;
}

export default function GoalCard({
  goal,
  onDelete,
  deleting = false,
  delay = 0,
}: GoalCardProps) {
  const progress = Math.min(
    100,
    Math.round((goal.savedAmount / goal.targetAmount) * 100)
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const calculateDailySavings = () => {
    const remaining = goal.targetAmount - goal.savedAmount;
    if (remaining <= 0) return 0;
    const deadline = new Date(goal.deadline);
    const today = new Date();
    const daysLeft = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysLeft > 0 ? remaining / daysLeft : 0;
  };

  const getProgressColor = () => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 50) return "bg-blue-500";
    return "bg-yellow-500";
  };

  const dailySavings = calculateDailySavings();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-4 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 flex-1">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {goal.title}
          </h3>
        </div>
        <button
          onClick={() => onDelete(goal._id)}
          disabled={deleting}
          className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 transition-colors"
          title="Delete goal"
        >
          {deleting ? (
            <span className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin inline-block" />
          ) : (
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          )}
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600 dark:text-gray-400">Progress</span>
            <span className="font-medium text-gray-900 dark:text-gray-100">
              {progress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, delay: delay + 0.1 }}
              className={`h-2.5 rounded-full ${getProgressColor()}`}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-1">Current</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(goal.savedAmount)}
            </p>
          </div>
          <div>
            <p className="text-gray-600 dark:text-gray-400 mb-1">Target</p>
            <p className="font-semibold text-gray-900 dark:text-gray-100">
              {formatCurrency(goal.targetAmount)}
            </p>
          </div>
        </div>

        <div>
          <p className="text-gray-600 dark:text-gray-400 mb-1 text-sm">Daily Savings Needed</p>
          <p className={`font-semibold ${dailySavings > 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-900 dark:text-gray-100'}`}>
            {formatCurrency(dailySavings)}
          </p>
        </div>

        <div>
          <p className="text-gray-600 dark:text-gray-400 mb-1 text-sm">Deadline</p>
          <p className="font-semibold text-gray-900 dark:text-gray-100">
            {formatDate(goal.deadline)}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

