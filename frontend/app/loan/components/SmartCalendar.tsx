"use client";

import { motion } from "framer-motion";

interface CalendarEvent {
  loanName: string;
  emiAmount: number;
  dueDate: string;
  earlyPaymentWindow: string;
  gracePeriod: string;
  risk: "high" | "low";
}

interface CalendarMonth {
  month: string;
  events: CalendarEvent[];
}

interface SmartCalendarProps {
  calendar: { calendar: CalendarMonth[] };
  loading: boolean;
}

export default function SmartCalendar({ calendar, loading }: SmartCalendarProps) {
  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6">
        <p className="text-gray-600 dark:text-gray-400">Loading calendar...</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-6"
    >
      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Smart EMI Calendar
      </h2>

      <div className="space-y-6">
        {calendar.calendar.map((month, idx) => {
          const monthDate = new Date(month.month);
          const monthName = monthDate.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          });

          if (month.events.length === 0) return null;

          return (
            <div key={idx} className="border-b border-gray-200 dark:border-gray-800 pb-4 last:border-0">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
                {monthName}
              </h3>
              <div className="space-y-3">
                {month.events.map((event, eventIdx) => (
                  <div
                    key={eventIdx}
                    className={`p-4 rounded-lg border ${
                      event.risk === "high"
                        ? "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                        : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {event.loanName}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          EMI: {formatCurrency(event.emiAmount)}
                        </p>
                        <div className="mt-2 space-y-1 text-xs">
                          <p className="text-gray-600 dark:text-gray-400">
                            Due: {formatDate(event.dueDate)}
                          </p>
                          <p className="text-blue-600 dark:text-blue-400">
                            Early payment window: {formatDate(event.earlyPaymentWindow)}
                          </p>
                          <p className="text-orange-600 dark:text-orange-400">
                            Grace period ends: {formatDate(event.gracePeriod)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          event.risk === "high"
                            ? "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                            : "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                        }`}
                      >
                        {event.risk === "high" ? "High Risk" : "Low Risk"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

