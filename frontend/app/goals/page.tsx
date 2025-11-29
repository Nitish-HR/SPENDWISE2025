"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { getGoals, deleteGoal } from "@/lib/api";
import GoalCard from "@/app/components/goals/GoalCard";
import DeleteConfirmModal from "@/app/components/goals/DeleteConfirmModal";
import GoalsAchievements from "@/app/components/goals/GoalsAchievements";

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

const userId = process.env.NEXT_PUBLIC_DEFAULT_USER || "test-user-1";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    goalId: string | null;
    goalTitle: string;
  }>({
    isOpen: false,
    goalId: null,
    goalTitle: "",
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getGoals(userId);
      setGoals(Array.isArray(data) ? data : []);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to load goals";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handleDeleteClick = (goalId: string, goalTitle: string) => {
    setDeleteModal({
      isOpen: true,
      goalId,
      goalTitle,
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.goalId) return;

    setDeletingId(deleteModal.goalId);
    try {
      await deleteGoal(deleteModal.goalId);
      setGoals((prev) => prev.filter((g) => g._id !== deleteModal.goalId));
      setDeleteModal({ isOpen: false, goalId: null, goalTitle: "" });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete goal";
      setError(errorMessage);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, goalId: null, goalTitle: "" });
  };

  if (loading && goals.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Goals</h1>
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-gray-600 dark:text-gray-400">Loading goals...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Goals
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Track your savings goals and progress
            </p>
          </div>
          <Link
            href="/goals/new"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors shadow-sm hover:shadow-md"
          >
            + Add Goal
          </Link>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </motion.div>
        )}

        {/* Achievements Section */}
        <GoalsAchievements />

        {goals.length === 0 && !loading ? (
          <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              No goals yet. Create your first goal to get started!
            </p>
            <Link
              href="/goals/new"
              className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
            >
              Create Your First Goal
            </Link>
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {goals.map((goal, index) => (
              <GoalCard
                key={goal._id}
                goal={goal}
                onDelete={handleDeleteClick}
                deleting={deletingId === goal._id}
                delay={index * 0.1}
              />
            ))}
          </motion.div>
        )}
      </motion.div>

      <DeleteConfirmModal
        isOpen={deleteModal.isOpen}
        goalTitle={deleteModal.goalTitle}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        deleting={deletingId !== null}
      />
    </>
  );
}
