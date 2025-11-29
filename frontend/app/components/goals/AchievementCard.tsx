"use client";

import { motion } from "framer-motion";
import { CheckCircleIcon, LockClosedIcon } from "@heroicons/react/24/outline";

interface AchievementCardProps {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  earned: boolean;
  delay?: number;
}

export default function AchievementCard({
  id,
  title,
  description,
  icon: Icon,
  earned,
  delay = 0,
}: AchievementCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ scale: 1.05 }}
      className={`
        relative p-4 rounded-lg border-2 transition-all
        ${
          earned
            ? "border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20"
            : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60"
        }
      `}
    >
      <div className="flex items-start space-x-3">
        <div
          className={`
          flex-shrink-0 p-2 rounded-lg
          ${
            earned
              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
              : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500"
          }
        `}
        >
          {earned ? (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 10 }}
            >
              <Icon className="h-6 w-6" />
            </motion.div>
          ) : (
            <LockClosedIcon className="h-6 w-6" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className={`
            text-sm font-semibold mb-1
            ${
              earned
                ? "text-gray-900 dark:text-gray-100"
                : "text-gray-500 dark:text-gray-400"
            }
          `}
          >
            {title}
          </h3>
          <p
            className={`
            text-xs
            ${
              earned
                ? "text-gray-600 dark:text-gray-300"
                : "text-gray-400 dark:text-gray-500"
            }
          `}
          >
            {description}
          </p>
        </div>
        {earned && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: delay + 0.2, type: "spring" }}
            className="flex-shrink-0"
          >
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

