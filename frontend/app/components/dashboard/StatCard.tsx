"use client";

import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  delay?: number;
}

export default function StatCard({ title, value, delay = 0 }: StatCardProps) {
  return (
    <motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  whileHover={{ scale: 1.03 }}
  transition={{ duration: 0.3 }}
  className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 cursor-pointer shadow-sm hover:shadow-lg"
>

      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
        {title}
      </h3>
      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
        {value}
      </p>
    </motion.div>
  );
}

