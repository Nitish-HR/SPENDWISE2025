"use client";

import { motion } from "framer-motion";

interface TipCardProps {
  microTip: string;
}

export default function TipCard({ microTip }: TipCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6"
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
        Survival Micro-Tip
      </h2>
      <p className="text-gray-900 dark:text-gray-100 leading-relaxed">{microTip}</p>
    </motion.div>
  );
}