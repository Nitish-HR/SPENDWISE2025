const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    targetAmount: { type: Number, required: true, min: 0 },
    savedAmount: { type: Number, default: 0, min: 0 },
    deadline: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Goal', GoalSchema);

