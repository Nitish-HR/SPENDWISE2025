"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  FlagIcon,
  ArrowPathIcon,
  TrophyIcon,
  CheckBadgeIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { getGoals, getLatestInsights } from "@/lib/api";
import AchievementCard from "./AchievementCard";

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

interface Insight {
  overspendAreas?: Array<{
    category: string;
    amount: number;
    why?: string;
  }>;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  earned: boolean;
}

const userId = process.env.NEXT_PUBLIC_DEFAULT_USER || "test-user-1";

export default function GoalsAchievements() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [goalData, insightData] = await Promise.all([
          getGoals(userId),
          getLatestInsights(userId),
        ]);
        setGoals(Array.isArray(goalData) ? goalData : []);
        setInsight(insightData || null);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load achievements data";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const achievements = useMemo<Achievement[]>(() => {
    // 1. Starter Saver - created first goal
    const starterSaverEarned = goals.length >= 1;

    // 2. Consistent Contributor - updated savings for a goal 3+ times
    // Since we don't have exact update history, we use a heuristic:
    // A goal that has been updated over time (updatedAt is significantly after createdAt)
    // and has made progress indicates consistent contributions
    const consistentContributorEarned = (() => {
      if (goals.length === 0) return false;
      
      // Check if any goal shows signs of consistent updates:
      // - updatedAt exists and is at least 3 days after createdAt (indicating multiple updates over time)
      // - has made progress (savedAmount > 0)
      const hasConsistentGoal = goals.some((goal) => {
        if (!goal.updatedAt || !goal.createdAt || goal.savedAmount === 0) return false;
        
        const updated = new Date(goal.updatedAt);
        const created = new Date(goal.createdAt);
        const daysDiff = (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        
        // If goal has been updated at least 3 days after creation and has progress,
        // it likely indicates consistent contributions
        return daysDiff >= 3 && goal.savedAmount > 0;
      });
      
      return hasConsistentGoal;
    })();

    // 3. 50% Milestone - any goal passed 50% progress
    const fiftyPercentEarned = goals.some(
      (goal) => goal.savedAmount >= goal.targetAmount * 0.5
    );

    // 4. Goal Completed - any goal reaches 100%
    const goalCompletedEarned = goals.some(
      (goal) => goal.savedAmount >= goal.targetAmount
    );

    // 5. Spending Discipline - last 30 days overspend areas = 0
    const spendingDisciplineEarned = (() => {
      if (!insight) return false;
      const overspendAreas = insight.overspendAreas || [];
      return overspendAreas.length === 0;
    })();

    return [
      {
        id: "starter-saver",
        title: "Starter Saver",
        description: "Created your first goal",
        icon: FlagIcon,
        earned: starterSaverEarned,
      },
      {
        id: "consistent-contributor",
        title: "Consistent Contributor",
        description: "Updated savings for a goal 3+ times",
        icon: ArrowPathIcon,
        earned: consistentContributorEarned,
      },
      {
        id: "fifty-percent-milestone",
        title: "50% Milestone",
        description: "Any goal passed 50% progress",
        icon: TrophyIcon,
        earned: fiftyPercentEarned,
      },
      {
        id: "goal-completed",
        title: "Goal Completed",
        description: "Any goal reaches 100%",
        icon: CheckBadgeIcon,
        earned: goalCompletedEarned,
      },
      {
        id: "spending-discipline",
        title: "Spending Discipline",
        description: "Last 30 days overspend areas = 0",
        icon: ShieldCheckIcon,
        earned: spendingDisciplineEarned,
      },
    ];
  }, [goals, insight]);

  const earnedCount = achievements.filter((a) => a.earned).length;

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <p className="text-gray-600 dark:text-gray-400">Loading achievements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          Achievements
        </h2>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {earnedCount} / {achievements.length}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {achievements.map((achievement, index) => (
          <AchievementCard
            key={achievement.id}
            id={achievement.id}
            title={achievement.title}
            description={achievement.description}
            icon={achievement.icon}
            earned={achievement.earned}
            delay={index * 0.1}
          />
        ))}
      </div>
    </motion.div>
  );
}

