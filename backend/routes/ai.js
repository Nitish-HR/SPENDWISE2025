const express = require('express');
const router = express.Router();
const { generateInsightForUser } = require('../services/agentService');

router.post('/generate', async (req, res) => {
  try {
    const userId = req.body.userId || process.env.DEFAULT_USER_ID;
    const insight = await generateInsightForUser(userId);
    return res.status(200).json({ success: true, insight });
  } catch (err) {
    console.error("[AI Route] Error generating insight:", err);
    return res.status(500).json({ success:false, error: "Failed to generate insight" });
  }
});

module.exports = router;


