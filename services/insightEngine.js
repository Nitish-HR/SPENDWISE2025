const { GoogleGenerativeAI } = require('@google/generative-ai');
const Expense = require('../models/Expense');
const Insight = require('../models/Insight');
const { computeSimpleAnalytics } = require('./analytics');

if (!process.env.GOOGLE_AI_API_KEY) {
  console.error("❌ GOOGLE_AI_API_KEY is missing in environment!");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

/**
 * Compute improvement metrics by comparing current and previous analytics
 */
async function computeImprovementMetrics(userId, currentAnalytics, previousInsight) {
  if (!previousInsight) {
    return {
      improvement: null,
      improvedCategories: [],
      worsenedCategories: [],
      userImprovementScore: 0,
      previousTotalSpend: null,
      currentTotalSpend: currentAnalytics.totals,
    };
  }

  // Compute previous period analytics (30 days ending when previous insight was created)
  const previousInsightDate = new Date(previousInsight.createdAt);
  const previousPeriodEnd = new Date(previousInsightDate);
  const previousPeriodStart = new Date(previousPeriodEnd);
  previousPeriodStart.setDate(previousPeriodStart.getDate() - 30);

  const previousExpenses = await Expense.find({
    userId,
    date: { $gte: previousPeriodStart, $lte: previousPeriodEnd },
  });

  const previousTotalSpend = previousExpenses.reduce(
    (sum, exp) => sum + (exp.amount || 0),
    0
  );

  const previousByCategory = {};
  previousExpenses.forEach((expense) => {
    const category = expense.category || 'uncategorized';
    previousByCategory[category] = (previousByCategory[category] || 0) + (expense.amount || 0);
  });

  // Compare totals
  const currentTotalSpend = currentAnalytics.totals || 0;
  const totalSpendChange = currentTotalSpend - previousTotalSpend;
  const totalSpendChangePercent = previousTotalSpend > 0 
    ? ((totalSpendChange / previousTotalSpend) * 100).toFixed(1)
    : 0;

  // Compare categories
  const improvedCategories = [];
  const worsenedCategories = [];
  const currentByCategory = currentAnalytics.byCategory || {};

  // Check all categories from both periods
  const allCategories = new Set([
    ...Object.keys(previousByCategory),
    ...Object.keys(currentByCategory),
  ]);

  allCategories.forEach((category) => {
    const previousAmount = previousByCategory[category] || 0;
    const currentAmount = currentByCategory[category] || 0;
    const change = currentAmount - previousAmount;
    const changePercent = previousAmount > 0 
      ? ((change / previousAmount) * 100).toFixed(1)
      : currentAmount > 0 ? 100 : 0;

    // Consider improved if spending decreased by at least 10%
    if (previousAmount > 0 && change < 0 && Math.abs(changePercent) >= 10) {
      improvedCategories.push({
        category,
        previousAmount,
        currentAmount,
        changePercent: Math.abs(changePercent),
      });
    }
    // Consider worsened if spending increased by at least 10%
    else if (change > 0 && changePercent >= 10) {
      worsenedCategories.push({
        category,
        previousAmount,
        currentAmount,
        changePercent,
      });
    }
  });

  // Check if user followed previous savings plan (heuristic: spending decreased)
  const followedSavingsPlan = totalSpendChange < 0;

  // Calculate improvement score (0-100)
  // Positive if spending decreased, categories improved
  let improvementScore = 50; // neutral baseline
  if (totalSpendChange < 0) improvementScore += 20; // spending decreased
  if (improvedCategories.length > 0) improvementScore += 15; // categories improved
  if (worsenedCategories.length === 0) improvementScore += 15; // no categories worsened
  improvementScore = Math.min(100, Math.max(0, improvementScore));

  return {
    improvement: totalSpendChange < 0,
    improvedCategories,
    worsenedCategories,
    userImprovementScore: Math.round(improvementScore),
    previousTotalSpend,
    currentTotalSpend,
    totalSpendChange,
    totalSpendChangePercent,
    followedSavingsPlan,
  };
}

/**
 * Generate AI insight for a user with memory-based context
 * @param {string} userId - User ID
 * @param {string} type - Insight type: 'daily' (default) or 'weekly'
 * @returns {Promise<Object>} Saved insight document with memory data
 */
async function generateInsight(userId, type = 'daily') {
  try {
    console.log(`\n[Insight Engine] Starting insight generation for: ${userId} (type: ${type})`);

    // STEP 0 — FETCH PREVIOUS INSIGHT
    const previousInsight = await Insight.findOne({ userId })
      .sort({ createdAt: -1 })
      .lean();

    if (previousInsight) {
      console.log(`[Insight Engine] Found previous insight: ${previousInsight._id} (created: ${previousInsight.createdAt})`);
    } else {
      console.log(`[Insight Engine] No previous insight found for ${userId} - this is the first insight`);
    }

    // STEP 1 — FETCH CURRENT EXPENSES
    const analytics = await computeSimpleAnalytics(userId, 30);
    const expenses = analytics.rawExpenses || [];

    if (expenses.length === 0) {
      console.log(`[Insight Engine] No expenses found for user: ${userId}`);
      return null;
    }

    // STEP 1.5 — COMPUTE IMPROVEMENT METRICS
    const improvementMetrics = await computeImprovementMetrics(
      userId,
      analytics,
      previousInsight
    );

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

    // STEP 2 — BUILD PROMPT WITH MEMORY CONTEXT
    const promptType = type === 'weekly' ? 'weekly summary' : 'daily analysis';
    
    // Build memory context section
    let memoryContext = '';
    if (previousInsight) {
      memoryContext = `
PREVIOUS INSIGHT CONTEXT:
- Previous Overview: "${previousInsight.overview || 'N/A'}"
- Previous Prediction: "${previousInsight.prediction || 'N/A'}"
- Previous Overspend Areas: ${JSON.stringify(previousInsight.overspendAreas || [])}
- Previous Savings Plan: "${previousInsight.savingsPlan || 'N/A'}"

IMPROVEMENT METRICS:
- Previous Total Spend: ₹${improvementMetrics.previousTotalSpend?.toFixed(2) || 'N/A'}
- Current Total Spend: ₹${improvementMetrics.currentTotalSpend.toFixed(2)}
- Total Change: ₹${improvementMetrics.totalSpendChange >= 0 ? '+' : ''}${improvementMetrics.totalSpendChange.toFixed(2)} (${improvementMetrics.totalSpendChangePercent >= 0 ? '+' : ''}${improvementMetrics.totalSpendChangePercent}%)
- Improvement Score: ${improvementMetrics.userImprovementScore}/100
- Followed Previous Savings Plan: ${improvementMetrics.followedSavingsPlan ? 'Yes' : 'No'}
- Improved Categories: ${improvementMetrics.improvedCategories.length > 0 
  ? JSON.stringify(improvementMetrics.improvedCategories.map(c => `${c.category} (${c.changePercent}% reduction)`))
  : 'None'}
- Worsened Categories: ${improvementMetrics.worsenedCategories.length > 0
  ? JSON.stringify(improvementMetrics.worsenedCategories.map(c => `${c.category} (${c.changePercent}% increase)`))
  : 'None'}

IMPORTANT: You must evaluate what improved, what got worse, and adjust the next steps based on the user's progress. Acknowledge improvements and provide encouragement. Address areas that worsened with specific actionable advice.
`;
    }

    const prompt = `
You are a financial advisor. Analyze this user's spending for a ${promptType}.
${memoryContext}
CURRENT DATA:
- Total spent: ₹${totalSpent.toFixed(2)}
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
${previousInsight ? '- Reference the previous insight and improvement metrics in your analysis.' : ''}
${type === 'weekly' ? '- Focus on weekly trends and patterns.' : ''}
`;

    console.log(`[Insight Engine] Calling Gemini API (model = gemini-2.0-flash)`);

    // STEP 3 — CALL GEMINI
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let aiResponseText = "";

    try {
      const result = await model.generateContent(prompt);
      aiResponseText = result.response.text();
    } catch (aiError) {
      console.error(`[Insight Engine] ❌ Gemini API Error for ${userId}:`, aiError);
      throw new Error(`Gemini API failure: ${aiError.message}`);
    }

    console.log(`[Insight Engine] Raw Gemini Response received for ${userId}`);

    // STEP 4 — CLEAN JSON
    const cleanJson = aiResponseText.replace(/```json|```/g, "").trim();

    let insightData = {};
    try {
      insightData = JSON.parse(cleanJson);
    } catch (jsonErr) {
      console.error(`[Insight Engine] ❌ Failed to parse Gemini JSON for ${userId}:`, jsonErr);
      throw new Error(`Gemini returned invalid JSON: ${jsonErr.message}`);
    }

    // STEP 5 — VALIDATE
    if (!insightData.overview) {
      throw new Error("Missing overview in AI output");
    }

    // STEP 6 — PREPARE MEMORY DATA
    const memory = previousInsight ? {
      previousInsightId: previousInsight._id.toString(),
      improvement: improvementMetrics.improvement,
      improvedCategories: improvementMetrics.improvedCategories.map(c => c.category),
      worsenedCategories: improvementMetrics.worsenedCategories.map(c => c.category),
      userImprovementScore: improvementMetrics.userImprovementScore,
      previousTotalSpend: improvementMetrics.previousTotalSpend,
      currentTotalSpend: improvementMetrics.currentTotalSpend,
      totalSpendChange: improvementMetrics.totalSpendChange,
      followedSavingsPlan: improvementMetrics.followedSavingsPlan,
    } : {};

    // STEP 7 — STORE IN DB
    const saved = await Insight.create({
      userId,
      overview: insightData.overview || "",
      overspendAreas: Array.isArray(insightData.overspendAreas) ? insightData.overspendAreas : [],
      savingsPlan: insightData.savingsPlan || "",
      microTip: insightData.microTip || "",
      prediction: insightData.prediction || "",
      memory: memory,
      raw: { ...insightData, type },
      type: type,
    });

    console.log(`[Insight Engine] ✅ Insight saved to DB for ${userId}: ${saved._id} (type: ${type})`);
    if (previousInsight) {
      console.log(`[Insight Engine] Memory stored: improvement=${memory.improvement}, score=${memory.userImprovementScore}/100`);
    }

    return saved;

  } catch (error) {
    console.error(`[Insight Engine] ❌ Error generating insight for ${userId}:`, error);
    throw error;
  }
}

module.exports = { generateInsight };

