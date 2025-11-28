const mongoose = require('mongoose');

const IncomeHistorySchema = new mongoose.Schema(
  {
    amount: { type: Number, required: true },
    date: { type: Date, required: true },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    userId: { type: String, unique: true, required: true, index: true },
    name: { type: String, required: true },
    incomeHistory: { type: [IncomeHistorySchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);

