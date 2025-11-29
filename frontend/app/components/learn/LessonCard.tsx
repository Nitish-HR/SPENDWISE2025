"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { SpeakerWaveIcon, SpeakerXMarkIcon } from "@heroicons/react/24/outline";

interface LessonCardProps {
  title: string;
  content: string;
  tag: string;
  readingTime: number;
  delay?: number;
}

export default function LessonCard({
  title,
  content,
  tag,
  readingTime,
  delay = 0,
}: LessonCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleListen = () => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech is not supported in your browser");
      return;
    }

    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(content);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const getTagColor = (tag: string) => {
    const tagLower = tag.toLowerCase();
    if (tagLower.includes("overspend") || tagLower.includes("risk")) {
      return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200";
    }
    if (tagLower.includes("savings") || tagLower.includes("goal")) {
      return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200";
    }
    if (tagLower.includes("budget") || tagLower.includes("plan")) {
      return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200";
    }
    return "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6 hover:shadow-lg transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h3>
            <span
              className={`px-2 py-1 rounded-md text-xs font-medium ${getTagColor(tag)}`}
            >
              {tag}
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
            <span>📖 {readingTime} min read</span>
          </div>
        </div>
        <button
          onClick={handleListen}
          className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
            isPlaying
              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
          title={isPlaying ? "Stop audio" : "Listen to lesson"}
        >
          {isPlaying ? (
            <SpeakerXMarkIcon className="h-5 w-5" />
          ) : (
            <SpeakerWaveIcon className="h-5 w-5" />
          )}
        </button>
      </div>

      <div className="space-y-3">
        {isExpanded ? (
          <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
            {content}
          </div>
        ) : (
          <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {content.length > 300 ? `${content.substring(0, 300)}...` : content}
          </div>
        )}

        {content.length > 300 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
          >
            {isExpanded ? "Show less" : "Read more"}
          </button>
        )}
      </div>
    </motion.div>
  );
}

