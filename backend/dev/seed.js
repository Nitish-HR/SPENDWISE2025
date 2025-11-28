require("dotenv").config();
const mongoose = require("mongoose");
const Expense = require("../models/Expense");

async function seed() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error("No MONGO_URI found in .env");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log("[seed] Connected to DB");

  const sampleExpenses = [
    {
      userId: "sample-user-1",
      category: "Food",
      amount: 150,
      date: new Date("2025-01-10")
    },
    {
      userId: "sample-user-1",
      category: "Transport",
      amount: 90,
      date: new Date("2025-01-11")
    },
    {
      userId: "sample-user-1",
      category: "Shopping",
      amount: 800,
      date: new Date("2025-01-15")
    }
  ];

  await Expense.insertMany(sampleExpenses);

  console.log("[seed] Inserted sample expenses");
  process.exit(0);
}

seed();
