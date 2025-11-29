"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/expenses", label: "Expenses" },
  { href: "/income", label: "Income" },
  { href: "/investment", label: "Investment" },
  { href: "/loan", label: "Loan Manager" },
  { href: "/buffer", label: "Buffer" },
  { href: "/insights", label: "Insights" },
  { href: "/goals", label: "Goals" },
  { href: "/what-if", label: "What-If" },
  { href: "/learn", label: "Learn" },
  // { href: "/profile", label: "Profile" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 backdrop-blur-sm sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/dashboard" className="text-xl font-semibold text-gray-900 dark:text-gray-100 transition-colors">
            SpendWise
          </Link>
          <div className="flex items-center space-x-2">
            <div className="flex space-x-1">
              {navLinks.map((link) => {
                const isActive = 
                  pathname === link.href || 
                  (link.href === "/expenses" && pathname?.startsWith("/expenses"));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-900"
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}

