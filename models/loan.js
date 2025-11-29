const mongoose = require('mongoose');

const LoanSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    loanName: { type: String, required: true },
    principal: { type: Number, required: true },
    interestRate: { type: Number, required: true },
    tenureMonths: { type: Number, required: true },
    emiAmount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Loan', LoanSchema);

