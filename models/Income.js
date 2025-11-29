const mongoose = require('mongoose');

const IncomeSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
    source: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Income', IncomeSchema);

