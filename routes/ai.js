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

    // STEP 1 — FETCH LAST 3 INSIGHTS FOR MEMORY
    const memoryInsights = await Insight.find({ userId })
      .sort({ createdAt: -1 })
      .limit(3)
      .lean();

    console.log(`[AI Route] Found ${memoryInsights.length} previous insight(s) for memory context`);

    // STEP 2 — FETCH CURRENT EXPENSES
    const analytics = await computeSimpleAnalytics(userId, 30);
    const expenses = analytics.rawExpenses || [];

    if (expenses.length === 0) {
      return res.status(400).json({ success: false, error: "No expenses found" });
    }

    // PREPARE ANALYTICS SUMMARY
    const totalSpent = analytics.totals || 0;
    const categoryBreakdown = Object.entries(analytics.byCategory || {})
      .map(([cat, amt]) => `${cat}: ₹${amt.toFixed(2)}`)
      .join(', ');

    const spikes = expenses
      .filter(exp => exp.amount > (totalSpent / expenses.length) * 1.5)
      .map(exp => ({
        date: exp.date?.toISOString()?.split('T')[0] || "unknown",
        category: exp.category,
        amount: exp.amount,
      }))
      .slice(0, 5);

    // Income summary
    const totalIncome = analytics.totalIncome || 0;
    const avgIncome = analytics.avgIncome || 0;
    const volatilityScore = analytics.volatilityScore || 0;
    const savingsRatio = analytics.savingsRatio || 0;
    const incomes = analytics.rawIncomes || [];
    
    const incomeBySource = {};
    incomes.forEach((income) => {
      const source = income.source || 'uncategorized';
      incomeBySource[source] = (incomeBySource[source] || 0) + (income.amount || 0);
    });
    
    const incomeSourceBreakdown = Object.entries(incomeBySource)
      .map(([source, amt]) => `${source}: ₹${amt.toFixed(2)}`)
      .join(', ');

    // STEP 3 — BUILD MEMORY CONTEXT FROM LAST 3 INSIGHTS
    let memoryContext = '';
    if (memoryInsights.length > 0) {
      const memorySummary = memoryInsights.map((insight, idx) => {
        const date = new Date(insight.createdAt).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });

        const overspendSummary = insight.overspendAreas && insight.overspendAreas.length > 0
          ? insight.overspendAreas.map(area => `${area.category} (₹${area.amount.toFixed(2)})`).join(', ')
          : 'None';

        return `Insight #${idx + 1} (${date}):
- Overspend Areas: ${overspendSummary}
- Savings Plan: ${insight.savingsPlan || 'N/A'}
- Prediction/Warning: ${insight.prediction || 'N/A'}`;
      }).join('\n\n');

      memoryContext = `
Here is the user's recent financial history and AI guidance:

${memorySummary}

IMPORTANT INSTRUCTIONS:
- Adapt your advice based on whether the user improved or not compared to previous insights
- Avoid repeating the same suggestions unless they are still relevant and the user hasn't addressed them
- Detect behavior change patterns (e.g., if overspend areas keep changing, if savings plans were followed, if predictions came true)
- Acknowledge progress when improvements are visible
- Provide fresh, actionable advice that builds on past guidance
`;
    }

    // STEP 4 — BUILD PROMPT
    const prompt = `
You are a financial advisor. Analyze this user's spending for a daily analysis.
${memoryContext}
CURRENT DATA:
- Total spent: ₹${totalSpent.toFixed(2)}
- Number of expenses: ${expenses.length}
- Category breakdown: ${categoryBreakdown}
- Spending spikes: ${JSON.stringify(spikes)}

INCOME DATA (Last 30 Days):
- Total income: ₹${totalIncome.toFixed(2)}
- Average income per record: ₹${avgIncome.toFixed(2)}
- Income volatility score: ${volatilityScore.toFixed(2)}% (0 = very stable, 100 = very volatile)
- Savings ratio: ${savingsRatio.toFixed(2)}% (positive = saving, negative = overspending)
- Income sources breakdown: ${incomeSourceBreakdown || 'No income recorded'}
- Income vs Spending balance: ₹${(totalIncome - totalSpent).toFixed(2)} ${totalIncome >= totalSpent ? '(surplus)' : '(deficit)'}
${incomes.length > 0 ? `- Income trends: ${incomes.length} income record(s) in last 30 days` : '- No income recorded in last 30 days'}

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
- Consider income data when providing advice. If income is volatile, suggest budgeting strategies. If savings ratio is negative, emphasize spending reduction. If income exceeds expenses, encourage saving/investing.
${memoryInsights.length > 0 ? '- Reference the user\'s financial history and adapt your advice accordingly.' : ''}
`;

    console.log(`[AI Route] Calling Gemini API (model = gemini-2.0-flash)`);

    // STEP 5 — CALL GEMINI
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let aiResponseText = "";
    try {
      const result = await model.generateContent(prompt);
      aiResponseText = result.response.text();
    } catch (aiError) {
      console.error(`[AI Route] ❌ Gemini API Error for ${userId}:`, aiError);
      throw new Error(`Gemini API failure: ${aiError.message}`);
    }

    console.log(`[AI Route] Raw Gemini Response received for ${userId}`);

    // STEP 6 — CLEAN AND PARSE JSON
    const cleanJson = aiResponseText.replace(/```json|```/g, "").trim();

    let insightData = {};
    try {
      insightData = JSON.parse(cleanJson);
    } catch (jsonErr) {
      console.error(`[AI Route] ❌ Failed to parse Gemini JSON for ${userId}:`, jsonErr);
      throw new Error(`Gemini returned invalid JSON: ${jsonErr.message}`);
    }

    // STEP 7 — VALIDATE
    if (!insightData.overview) {
      throw new Error("Missing overview in AI output");
    }

    // STEP 8 — STORE IN DB
    const saved = await Insight.create({
      userId,
      overview: insightData.overview || "",
      overspendAreas: Array.isArray(insightData.overspendAreas) ? insightData.overspendAreas : [],
      savingsPlan: insightData.savingsPlan || "",
      microTip: insightData.microTip || "",
      prediction: insightData.prediction || "",
      raw: { ...insightData, type: 'daily' },
      type: 'daily',
    });

    console.log(`[AI Route] ✅ Insight saved to DB for ${userId}: ${saved._id}`);

    return res.status(200).json({ success: true, insight: saved });

  } catch (error) {
    console.error("❌ SERVER ERROR:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Server error", 
      details: error.message 
    });
  }
});

module.exports = router;