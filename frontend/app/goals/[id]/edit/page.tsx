"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { getGoals, updateGoal } from "@/lib/api";

const userId = process.env.NEXT_PUBLIC_DEFAULT_USER || "test-user-1";

export default function EditGoalPage() {
  const router = useRouter();
  const params = useParams();
  const goalId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    targetAmount: "",
    savedAmount: "0",
    deadline: "",
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchGoal = async () => {
      setLoading(true);
      try {
        const goals = await getGoals(userId);
        const goal = Array.isArray(goals)
          ? goals.find((g) => g._id === goalId)
          : null;

        if (!goal) {
          setError("Goal not found");
          return;
        }

        setFormData({
          title: goal.title,
          targetAmount: goal.targetAmount.toString(),
          savedAmount: goal.savedAmount.toString(),
          deadline: new Date(goal.deadline).toISOString().split("T")[0],
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load goal";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (goalId) {
      fetchGoal();
    }
  }, [goalId]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.title.trim()) {
      errors.title = "Title is required";
    }

    if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
      errors.targetAmount = "Target amount must be greater than 0";
    }

    if (
      formData.savedAmount &&
      parseFloat(formData.savedAmount) < 0
    ) {
      errors.savedAmount = "Saved amount cannot be negative";
    }

    if (!formData.deadline) {
      errors.deadline = "Deadline is required";
    } else {
      const deadlineDate = new Date(formData.deadline);
      if (isNaN(deadlineDate.getTime())) {
        errors.deadline = "Invalid date";
      } else if (deadlineDate < new Date()) {
        errors.deadline = "Deadline cannot be in the past";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    setError(null);
    try {
      await updateGoal(goalId, {
        userId,
        title: formData.title.trim(),
        targetAmount: parseFloat(formData.targetAmount),
        savedAmount: parseFloat(formData.savedAmount) || 0,
        deadline: new Date(formData.deadline).toISOString(),
      });

      router.push("/goals");
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update goal";
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-gray-600 dark:text-gray-400">Loading goal...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
    >
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Edit Goal
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Update your savings goal
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        {error && (
          <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
            <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.title
                  ? "border-red-300 dark:border-red-700"
                  : "border-gray-300 dark:border-gray-700"
              }`}
              placeholder="e.g., Vacation Fund"
            />
            {formErrors.title && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                {formErrors.title}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Target Amount *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.targetAmount}
                onChange={(e) =>
                  setFormData({ ...formData, targetAmount: e.target.value })
                }
                className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.targetAmount
                    ? "border-red-300 dark:border-red-700"
                    : "border-gray-300 dark:border-gray-700"
                }`}
                placeholder="0.00"
              />
              {formErrors.targetAmount && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                  {formErrors.targetAmount}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                Saved Amount
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.savedAmount}
                onChange={(e) =>
                  setFormData({ ...formData, savedAmount: e.target.value })
                }
                className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.savedAmount
                    ? "border-red-300 dark:border-red-700"
                    : "border-gray-300 dark:border-gray-700"
                }`}
                placeholder="0.00"
              />
              {formErrors.savedAmount && (
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                  {formErrors.savedAmount}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Deadline *
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) =>
                setFormData({ ...formData, deadline: e.target.value })
              }
              className={`w-full px-4 py-2 border rounded-md bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                formErrors.deadline
                  ? "border-red-300 dark:border-red-700"
                  : "border-gray-300 dark:border-gray-700"
              }`}
            />
            {formErrors.deadline && (
              <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                {formErrors.deadline}
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              {submitting ? "Updating..." : "Update Goal"}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}

