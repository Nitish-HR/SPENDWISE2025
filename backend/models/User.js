const mongoose = require('mongoose');

// IncomeEntrySchema for income history entries
const IncomeEntrySchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  date: { type: Date, required: true }
}, { _id: false });

// UserSchema with userId, name, and incomeHistory
const UserSchema = new mongoose.Schema({
  userId: { 
    type: String, 
    required: true, 
    unique: true, 
    index: true 
  },
  name: { 
    type: String, 
    required: false 
  },
  incomeHistory: { 
    type: [IncomeEntrySchema], 
    default: [] 
  }
}, { timestamps: true });

// Safe export: return existing model if it already exists
if (mongoose.models.User) {
  module.exports = mongoose.models.User;
} else {
  module.exports = mongoose.model('User', UserSchema);
}