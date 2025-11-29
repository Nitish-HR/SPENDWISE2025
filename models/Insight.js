// backend/models/Insight.js
const mongoose = require('mongoose');

// If model already exists (hot-reload / repeated require), export it instead of redefining.
if (mongoose.models && mongoose.models.Insight) {
  module.exports = mongoose.models.Insight;
} else {
  const OverspendAreaSchema = new mongoose.Schema({
    category: { type: String, required: true },
    amount: { type: Number, required: true },
    why: { type: String }
  }, { _id: false });

  const InsightSchema = new mongoose.Schema({
    userId: { type: String, required: true, index: true },
    overview: { type: String },
    overspendAreas: { type: [OverspendAreaSchema], default: [] },
    savingsPlan: { type: String },
    microTip: { type: String },
    prediction: { type: String },
    raw: { type: mongoose.Schema.Types.Mixed }
  }, { timestamps: true });

  module.exports = mongoose.model('Insight', InsightSchema);
}


