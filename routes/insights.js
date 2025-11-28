// backend/routes/insights.js
const express = require('express');
const router = express.Router();
const Insight = require('../models/Insight');

// GET latest insight
router.get('/latest', async (req, res) => {
  try {
    const userId = req.query.userId || process.env.DEFAULT_USER_ID;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const latest = await Insight.findOne({ userId })
      .sort({ createdAt: -1 });

    return res.json(latest || {});
  } catch (err) {
    console.error("[Insights Route] Error fetching latest insight:", err);
    return res.status(500).json({ error: "Failed to fetch latest insight" });
  }
});

// GET insight history
router.get('/history', async (req, res) => {
  try {
    const userId = req.query.userId || process.env.DEFAULT_USER_ID;
    if (!userId) return res.status(400).json({ error: "Missing userId" });

    const history = await Insight.find({ userId })
      .sort({ createdAt: -1 })
      .limit(30); // last 30 insights

    return res.json(history);
  } catch (err) {
    console.error("[Insights Route] Error fetching history:", err);
    return res.status(500).json({ error: "Failed to fetch insight history" });
  }
});

module.exports = router;


