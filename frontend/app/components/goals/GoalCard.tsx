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
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
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

  const getProgressColor = () => {
    if (progress >= 100) return "bg-green-500";
    if (progress >= 50) return "bg-blue-500";
    return "bg-yellow-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-4 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {goal.title}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Deadline: {formatDate(goal.deadline)}
          </p>
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

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
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
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {formatCurrency(goal.savedAmount)}
          </span>
          <span className="text-gray-600 dark:text-gray-400">
            of {formatCurrency(goal.targetAmount)}
          </span>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex gap-2">
        <Link
          href={`/goals/${goal._id}/edit`}
          className="flex-1 text-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
        >
          Edit
        </Link>
      </div>
    </motion.div>
  );
}

