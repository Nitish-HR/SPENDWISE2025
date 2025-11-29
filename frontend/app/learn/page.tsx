"use client";

import { useEffect, useState, useMemo } from "react";
import { motion } from "framer-motion";
import { getLatestInsights, getExpenses, getGoals } from "@/lib/api";
import LessonCard from "@/app/components/learn/LessonCard";

interface Expense {
  _id?: string;
  category?: string;
  amount?: number;
  date?: string;
  description?: string;
}

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
  overview?: string;
  prediction?: string;
  savingsPlan?: string;
  microTip?: string;
  overspendAreas?: Array<{
    category: string;
    amount: number;
    why?: string;
  }>;
}

interface Lesson {
  title: string;
  content: string;
  tag: string;
  readingTime: number;
}

const userId = "test-user-1";

// Helper function to calculate reading time
const calculateReadingTime = (text: string): number => {
  const wordsPerMinute = 200;
  const wordCount = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / wordsPerMinute));
};

// Generate personalized lessons from insights
const generatePersonalizedLessons = (
  insight: Insight | null,
  expenses: Expense[],
  goals: Goal[]
): Lesson[] => {
  const lessons: Lesson[] = [];

  if (!insight) {
    return lessons;
  }

  // Lesson 1: Based on overspend areas
  if (insight.overspendAreas && insight.overspendAreas.length > 0) {
    const topOverspend = insight.overspendAreas[0];
    const totalOverspend = insight.overspendAreas.reduce(
      (sum, area) => sum + area.amount,
      0
    );

    const content = `You're currently overspending in the ${topOverspend.category} category by ₹${topOverspend.amount.toFixed(2)}. This is a common financial challenge that many people face.

To address this, start by tracking every expense in this category for a week. You'll be surprised how small purchases add up. Set a monthly budget limit for ${topOverspend.category} and use the 50/30/20 rule: allocate 50% to needs, 30% to wants, and 20% to savings. Consider meal prepping instead of frequent takeouts, or look for subscription services you can cancel. Small changes can save significant amounts over time.`;

    lessons.push({
      title: `How to Reduce ${topOverspend.category} Overspending`,
      content,
      tag: "Overspending",
      readingTime: calculateReadingTime(content),
    });
  }

  // Lesson 2: Based on prediction/risk
  if (insight.prediction) {
    const isRisk = insight.prediction.toLowerCase().includes("risk") ||
                   insight.prediction.toLowerCase().includes("overspend");

    const content = isRisk
      ? `Your spending pattern indicates a potential risk in the coming month. ${insight.prediction}

To mitigate this risk, create a buffer in your budget. Start by reviewing your last 30 days of expenses and identify non-essential spending. Build an emergency fund equivalent to at least 3 months of expenses. Consider using the envelope method: allocate cash for different categories and stop spending when the envelope is empty. Track your expenses daily for the next week to build awareness. Remember, small adjustments now can prevent financial stress later.`
      : `Great news! Your current spending pattern looks healthy. ${insight.prediction}

To maintain this positive trajectory, continue tracking your expenses regularly. Consider automating your savings by setting up automatic transfers to your savings account on payday. Review your goals monthly and adjust as needed. This is also a good time to explore investment options like SIPs (Systematic Investment Plans) to grow your wealth over time.`;

    lessons.push({
      title: isRisk
        ? "Understanding Your Financial Risk Profile"
        : "Maintaining Your Healthy Spending Habits",
      content,
      tag: isRisk ? "Risk Prediction" : "Financial Health",
      readingTime: calculateReadingTime(content),
    });
  }

  // Lesson 3: Based on microTip
  if (insight.microTip) {
    const content = `${insight.microTip}

This tip is personalized based on your spending behavior. To make the most of it, implement this change gradually. Start by making this adjustment for one week and track the impact. Small, consistent changes are more sustainable than drastic overhauls. Once this becomes a habit, you can build on it with additional improvements. Remember, financial wellness is a journey, not a destination.`;

    lessons.push({
      title: "Actionable Tip: Improving Your Financial Habits",
      content,
      tag: "Savings Strategy",
      readingTime: calculateReadingTime(content),
    });
  }

  // Lesson 4: Based on savings plan
  if (insight.savingsPlan) {
    const content = `Based on your current spending patterns, here's a tailored savings approach: ${insight.savingsPlan}

To implement this effectively, start by setting up automatic transfers to a separate savings account. Treat savings as a non-negotiable expense, just like rent or utilities. Use the "pay yourself first" principle: allocate money to savings before spending on wants. Consider opening a high-yield savings account or starting a SIP in mutual funds to make your money work harder. Review your progress monthly and celebrate small milestones.`;

    lessons.push({
      title: "A Smarter Savings System Based on Your Income Pattern",
      content,
      tag: "Savings Strategy",
      readingTime: calculateReadingTime(content),
    });
  }

  // Lesson 5: Based on goals progress
  if (goals.length > 0) {
    const avgProgress = goals.reduce((sum, goal) => {
      const progress = (goal.savedAmount / goal.targetAmount) * 100;
      return sum + progress;
    }, 0) / goals.length;

    if (avgProgress < 50) {
      const content = `You have ${goals.length} active goal${goals.length > 1 ? "s" : ""}, and your average progress is ${avgProgress.toFixed(0)}%. 

To accelerate your progress, consider these strategies: Break down large goals into smaller milestones. Celebrate each 10% milestone to stay motivated. Automate your savings by setting up recurring transfers. Review your goals monthly and adjust your contributions if your income changes. Consider cutting one non-essential expense and redirecting that money to your goals. Remember, consistency beats intensity when it comes to saving.`;

      lessons.push({
        title: "Accelerating Your Goals Progress",
        content,
        tag: "Goal Achievement",
        readingTime: calculateReadingTime(content),
      });
    }
  }

  return lessons;
};

// General financial lessons
const generalLessons: Lesson[] = [
  {
    title: "Why Emergency Funds Matter",
    content: `An emergency fund is your financial safety net, designed to cover unexpected expenses like medical emergencies, job loss, or major repairs. Financial experts recommend having 3-6 months of living expenses saved.

Start by setting a small initial goal, like ₹10,000, then gradually build up. Keep this money in a separate, easily accessible savings account. The key is to only use it for true emergencies, not for planned expenses or wants. Having an emergency fund prevents you from going into debt when unexpected situations arise and gives you peace of mind.`,
    tag: "Emergency Planning",
    readingTime: 2,
  },
  {
    title: "How SIPs Grow Over Time",
    content: `A Systematic Investment Plan (SIP) allows you to invest a fixed amount regularly in mutual funds. The power of SIPs lies in rupee cost averaging and compounding.

When you invest ₹5,000 monthly for 10 years at an average return of 12%, you'll invest ₹6 lakh but potentially accumulate over ₹11 lakh. The key is starting early and staying consistent. Even small amounts invested regularly can grow significantly over time. SIPs help you build wealth gradually without the stress of timing the market.`,
    tag: "Investing Basics",
    readingTime: 2,
  },
  {
    title: "Understanding Needs vs Wants",
    content: `Needs are essential for survival and basic well-being: food, shelter, utilities, healthcare, and transportation to work. Wants are things that enhance your lifestyle but aren't necessary.

Before making a purchase, ask yourself: "Can I survive without this?" If yes, it's likely a want. The 50/30/20 budget rule helps: 50% for needs, 30% for wants, and 20% for savings. Being mindful of this distinction helps you prioritize spending and build better financial habits.`,
    tag: "Budgeting Foundations",
    readingTime: 2,
  },
  {
    title: "Basics of Mutual Funds",
    content: `Mutual funds pool money from multiple investors to buy a diversified portfolio of stocks, bonds, or other securities. They're managed by professional fund managers.

Key benefits include diversification (reducing risk), professional management, and accessibility with small investment amounts. Types include equity funds (higher risk, higher returns), debt funds (lower risk, stable returns), and hybrid funds (balanced approach). Start with index funds or large-cap funds for beginners, and always invest based on your risk tolerance and financial goals.`,
    tag: "Investing Basics",
    readingTime: 3,
  },
  {
    title: "Beginner's Guide to Budgeting",
    content: `Budgeting is simply a plan for your money. Start by tracking all your income and expenses for one month to understand where your money goes.

Use the 50/30/20 rule as a starting point: 50% for needs (rent, groceries, bills), 30% for wants (entertainment, dining out), and 20% for savings and investments. Use budgeting apps or a simple spreadsheet. Review and adjust monthly. Remember, a budget isn't restrictive—it gives you control and freedom to spend on what matters most.`,
    tag: "Budgeting Foundations",
    readingTime: 3,
  },
  {
    title: "What is Credit Utilization?",
    content: `Credit utilization is the percentage of your available credit that you're currently using. It's a key factor in your credit score.

For example, if you have a credit limit of ₹1,00,000 and you've used ₹30,000, your utilization is 30%. Experts recommend keeping utilization below 30% to maintain a good credit score. High utilization suggests you might be over-reliant on credit. Pay off balances in full each month when possible, and consider requesting a credit limit increase if you consistently use a high percentage.`,
    tag: "Debt Management",
    readingTime: 2,
  },
];

export default function LearnPage() {
  const [insight, setInsight] = useState<Insight | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [insightData, expenseData, goalData] = await Promise.all([
          getLatestInsights(userId),
          getExpenses(userId),
          getGoals(userId),
        ]);

        setInsight(insightData || null);
        setExpenses(Array.isArray(expenseData) ? expenseData : []);
        setGoals(Array.isArray(goalData) ? goalData : []);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load learning data";
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const personalizedLessons = useMemo(
    () => generatePersonalizedLessons(insight, expenses, goals),
    [insight, expenses, goals]
  );

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
          <p className="text-gray-600 dark:text-gray-400">Loading lessons...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-200 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8"
    >
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Learn
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Smart lessons tailored to your financial habits.
        </p>
      </header>

      {/* Personalized Lessons */}
      {personalizedLessons.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Personalized Lessons
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Based on your spending patterns, goals, and AI insights
          </p>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {personalizedLessons.map((lesson, index) => (
              <LessonCard
                key={`personalized-${index}`}
                title={lesson.title}
                content={lesson.content}
                tag={lesson.tag}
                readingTime={lesson.readingTime}
                delay={index * 0.1}
              />
            ))}
          </div>
        </section>
      )}

      {/* General Lessons */}
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          General Financial Lessons
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          Essential financial knowledge for building wealth
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {generalLessons.map((lesson, index) => (
            <LessonCard
              key={`general-${index}`}
              title={lesson.title}
              content={lesson.content}
              tag={lesson.tag}
              readingTime={lesson.readingTime}
              delay={(personalizedLessons.length + index) * 0.1}
            />
          ))}
        </div>
      </section>
    </motion.div>
  );
}

