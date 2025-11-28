const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Expense = require('../models/Expense');
const Insight = require('../models/Insight');
const { computeSimpleAnalytics } = require('../services/analytics');

if (!process.env.GOOGLE_AI_API_KEY) {
  console.error("❌ GOOGLE_AI_API_KEY is missing in environment!");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

router.post('/generate', async (req, res) => {
  try {
    const userId = req.query.userId || req.body.userId || process.env.DEFAULT_USER_ID;

    if (!userId) {
      return res.status(400).json({ success: false, error: "Missing userId" });
    }

    console.log(`\n===============================`);
    console.log(`[AI Route] Starting Gemini insight generation for: ${userId}`);
    console.log(`===============================\n`);

    // STEP 1 — FETCH EXPENSES
    const analytics = await computeSimpleAnalytics(userId, 30);
    const expenses = analytics.rawExpenses || [];

    if (expenses.length === 0) {
      console.log("❌ No expenses found for user.");
      return res.status(400).json({ success: false, error: "No expenses found" });
    }

    // PREPARE ANALYTICS SUMMARY
    const totalSpent = analytics.totals || 0;

    const categoryBreakdown = Object.entries(analytics.byCategory || {})
      .map(([cat, amt]) => `${cat}: $${amt.toFixed(2)}`)
      .join(', ');

    const spikes = expenses
      .filter(exp => exp.amount > (totalSpent / expenses.length) * 1.5)
      .map(exp => ({
        date: exp.date?.toISOString()?.split('T')[0] || "unknown",
        category: exp.category,
        amount: exp.amount,
      }))
      .slice(0, 5);

    // STEP 2 — BUILD PROMPT
    const prompt = `
You are a financial advisor. Analyze this user's spending.

DATA:
- Total spent: $${totalSpent.toFixed(2)}
- Number of expenses: ${expenses.length}
- Category breakdown: ${categoryBreakdown}
- Spending spikes: ${JSON.stringify(spikes)}

Generate a **STRICT JSON ONLY** response in this format:
{
  "overview": "",
  "overspendAreas": [
    { "category": "", "amount": 0, "why": "" }
  ],
  "prediction": "",
  "savingsPlan": "",
  "microTip": ""
}

Rules:
- Respond ONLY with JSON. No markdown, no text.
- overspendAreas must be an array.
- Be concise and helpful.
`;

    console.log(`[AI Route] Calling Gemini API (model = gemini-2.0-flash)`);

    // STEP 3 — CALL GEMINI
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let aiResponseText = "";

    try {
      const result = await model.generateContent(prompt);
      aiResponseText = result.response.text();
    } catch (aiError) {
      console.error("❌ Gemini API Error:", aiError);
      return res.status(500).json({ success: false, error: "Gemini API failure" });
    }

    console.log(`[AI Route] Raw Gemini Response:`, aiResponseText);

    // STEP 4 — CLEAN JSON
    const cleanJson = aiResponseText.replace(/```json|```/g, "").trim();

    let insightData = {};
    try {
      insightData = JSON.parse(cleanJson);
    } catch (jsonErr) {
      console.error("❌ Failed to parse Gemini JSON:", jsonErr);
      return res.status(500).json({
        success: false,
        error: "Gemini returned invalid JSON",
        raw: aiResponseText,
      });
    }

    // STEP 5 — VALIDATE
    if (!insightData.overview) {
      return res.status(500).json({ success: false, error: "Missing overview in AI output" });
    }

    // STEP 6 — STORE IN DB
    const saved = await Insight.create({
      userId,
      overview: insightData.overview || "",
      overspendAreas: Array.isArray(insightData.overspendAreas) ? insightData.overspendAreas : [],
      savingsPlan: insightData.savingsPlan || "",
      microTip: insightData.microTip || "",
      prediction: insightData.prediction || "",
      raw: insightData,
    });

    console.log(`✅ Insight saved to DB: ${saved._id}`);

    return res.status(200).json({ success: true, insight: saved });

  } catch (error) {
    console.error("❌ SERVER ERROR:", error);
    return res.status(500).json({ success: false, error: "Server error", details: error.message });
  }
});

module.exports = router;