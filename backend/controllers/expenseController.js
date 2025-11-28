const Expense = require("../models/Expense");

// CREATE Expense
exports.createExpense = async (req, res) => {
  try {
    const { userId, category, amount, date } = req.body;

    if (!userId || !category || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const expense = await Expense.create({
      userId,
      category,
      amount,
      date: date ? new Date(date) : new Date()
    });

    res.status(201).json(expense);
  } catch (err) {
    console.error("Error creating expense:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// GET all expenses for a user
exports.getExpenses = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const expenses = await Expense.find({ userId }).sort({ date: -1 });
    res.json(expenses);
  } catch (err) {
    console.error("Error fetching expenses:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// UPDATE expense by ID
exports.updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updated = await Expense.findByIdAndUpdate(id, updates, {
      new: true,
    });

    if (!updated) return res.status(404).json({ error: "Expense not found" });

    res.json(updated);
  } catch (err) {
    console.error("Error updating expense:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// DELETE expense by ID
exports.deleteExpense = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Expense.findByIdAndDelete(id);

    if (!deleted) return res.status(404).json({ error: "Expense not found" });

    res.json({ message: "Expense deleted" });
  } catch (err) {
    console.error("Error deleting expense:", err);
    res.status(500).json({ error: "Server error" });
  }
};
