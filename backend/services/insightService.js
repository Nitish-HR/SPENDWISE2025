const Insight = require('../models/Insight');

async function saveInsight(data) {
  try {
    const insight = await Insight.create({
      userId: data.userId,
      overview: data.overview,
      overspendAreas: data.overspendAreas,
      savingsPlan: data.savingsPlan,
      microTip: data.microTip,
      prediction: data.prediction,
      raw: data.raw,
    });

    return insight;
  } catch (error) {
    console.error('[insightService] saveInsight error:', error);
    throw error;
  }
}

async function getLatestInsight(userId) {
  try {
    return await Insight.findOne({ userId }).sort({ createdAt: -1 });
  } catch (error) {
    console.error('[insightService] getLatestInsight error:', error);
    throw error;
  }
}

async function getInsightHistory(userId, limit = 10) {
  try {
    const safeLimit = Math.max(1, Number(limit) || 10);

    return await Insight.find({ userId })
      .sort({ createdAt: -1 })
      .limit(safeLimit);
  } catch (error) {
    console.error('[insightService] getInsightHistory error:', error);
    throw error;
  }
}

module.exports = {
  saveInsight,
  getLatestInsight,
  getInsightHistory,
};


