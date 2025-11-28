const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { computeSimpleAnalytics } = require('../services/analytics');

if (!process.env.GOOGLE_AI_API_KEY) {
  console.error("❌ GOOGLE_AI_API_KEY is missing in environment!");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

/**
 * Deep clone analytics object
 */
function cloneAnalytics(analytics) {
  return {
    totals: analytics.totals || 0,
    byCategory: { ...(analytics.byCategory || {}) },
    avgWeekly: analytics.avgWeekly || 0,
    count: analytics.count || 0,
    rawExpenses: analytics.rawExpenses ? [...analytics.rawExpenses] : [],
  };
}

/**
 * Apply scenario to cloned analytics
 */
function applyScenario(analytics, scenario) {
  const adjusted = cloneAnalytics(analytics);

  switch (scenario.type) {
    case 'category-change':
      if (!scenario.category) {
        throw new Error('category is required for category-change scenario');
      }
      if (typeof scenario.percentChange !== 'number') {
        throw new Error('percentChange is required for category-change scenario');
      }
      
      const currentCategoryAmount = adjusted.byCategory[scenario.category] || 0;
      const changeAmount = (currentCategoryAmount * scenario.percentChange) / 100;
      adjusted.byCategory[scenario.category] = currentCategoryAmount + changeAmount;
      adjusted.totals = adjusted.totals + changeAmount;
      adjusted.avgWeekly = adjusted.totals / (30 / 7);
      
      console.log(`[What-If] Category "${scenario.category}": ${currentCategoryAmount.toFixed(2)} → ${adjusted.byCategory[scenario.category].toFixed(2)} (${scenario.percentChange > 0 ? '+' : ''}${scenario.percentChange}%)`);
      break;

    case 'income-change':
      if (typeof scenario.amountChange !== 'number') {
        throw new Error('amountChange is required for income-change scenario');
      }
      
      // For income-change, we adjust the totals (treating it as available budget)
      // This simulates having more/less income next month
      adjusted.totals = adjusted.totals + scenario.amountChange;
      adjusted.avgWeekly = adjusted.totals / (30 / 7);
      
      console.log(`[What-If] Income change: ${scenario.amountChange > 0 ? '+' : ''}${scenario.amountChange.toFixed(2)}`);
      break;

    case 'absolute':
      if (typeof scenario.amountChange !== 'number') {
        throw new Error('amountChange is required for absolute scenario');
      }
      
      adjusted.totals = adjusted.totals + scenario.amountChange;
      adjusted.avgWeekly = adjusted.totals / (30 / 7);
      
      console.log(`[What-If] Absolute change: ${scenario.amountChange > 0 ? '+' : ''}${scenario.amountChange.toFixed(2)}`);
      break;

    default:
      throw new Error(`Unknown scenario type: ${scenario.type}`);
  }

  return adjusted;
}

/**
 * Generate what-if insight using Gemini
 */
async function generateWhatIfInsight(analytics, scenario) {
  const totalSpent = analytics.totals || 0;
  const categoryBreakdown = Object.entries(analytics.byCategory || {})
    .map(([cat, amt]) => `${cat}: ₹${amt.toFixed(2)}`)
    .join(', ');

  const scenarioDescription = 
    scenario.type === 'category-change' 
      ? `Reducing "${scenario.category}" spending by ${Math.abs(scenario.percentChange)}%`
      : scenario.type === 'income-change'
      ? `Income change of ₹${scenario.amountChange > 0 ? '+' : ''}${scenario.amountChange.toFixed(2)}`
      : `Absolute spending change of ₹${scenario.amountChange > 0 ? '+' : ''}${scenario.amountChange.toFixed(2)}`;

  const prompt = `
You are a financial advisor analyzing a "what-if" spending scenario.

SCENARIO: ${scenarioDescription}

SIMULATED DATA (after applying scenario):
- Total spent: ₹${totalSpent.toFixed(2)}
- Number of expenses: ${analytics.count || 0}
- Category breakdown: ${categoryBreakdown}
- Average weekly spending: ₹${(analytics.avgWeekly || 0).toFixed(2)}

Generate a **STRICT JSON ONLY** response in this format:
{
  "overview": "Brief summary of the scenario impact",
  "prediction": "What this scenario means for future spending",
  "savingsPlan": "Actionable savings plan based on this scenario",
  "microTip": "One quick tip related to this scenario"
}

Rules:
- Respond ONLY with JSON. No markdown, no text.
- Be concise and helpful.
- Focus on the impact of this specific scenario.
`;

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(prompt);
  const aiResponseText = result.response.text();
  
  const cleanJson = aiResponseText.replace(/```json|```/g, "").trim();
  return JSON.parse(cleanJson);
}

/**
 * POST /api/what-if
 * Body: { userId: string, scenario: { type, ... } }
 */
router.post('/', async (req, res) => {
  try {
    const { userId, scenario } = req.body;

    // Validation
    if (!userId) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing userId in request body" 
      });
    }

    if (!scenario) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing scenario in request body" 
      });
    }

    if (!scenario.type) {
      return res.status(400).json({ 
        success: false, 
        error: "Missing scenario.type. Must be one of: category-change, income-change, absolute" 
      });
    }

    console.log(`\n===============================`);
    console.log(`[What-If] Starting simulation for userId: ${userId}`);
    console.log(`[What-If] Scenario type: ${scenario.type}`);
    console.log(`===============================\n`);

    // Fetch last 30 days analytics
    const originalAnalytics = await computeSimpleAnalytics(userId, 30);
    
    if (originalAnalytics.count === 0) {
      console.log("❌ No expenses found for user.");
      return res.status(400).json({ 
        success: false, 
        error: "No expenses found for the last 30 days" 
      });
    }

    console.log(`[What-If] Original analytics: Total ₹${originalAnalytics.totals.toFixed(2)}, ${originalAnalytics.count} expenses`);

    // Apply scenario to cloned analytics
    let adjustedAnalytics;
    try {
      adjustedAnalytics = applyScenario(originalAnalytics, scenario);
    } catch (scenarioError) {
      console.error("❌ Scenario application error:", scenarioError);
      return res.status(400).json({ 
        success: false, 
        error: scenarioError.message 
      });
    }

    console.log(`[What-If] Adjusted analytics: Total ₹${adjustedAnalytics.totals.toFixed(2)}`);

    // Generate insight using Gemini
    let scenarioResult;
    let rawLLMResponse;
    
    try {
      rawLLMResponse = await generateWhatIfInsight(adjustedAnalytics, scenario);
      scenarioResult = {
        overview: rawLLMResponse.overview || "Scenario analysis completed",
        prediction: rawLLMResponse.prediction || "No prediction available",
        savingsPlan: rawLLMResponse.savingsPlan || "No savings plan generated",
        microTip: rawLLMResponse.microTip || "Review your spending regularly",
      };
      
      console.log(`[What-If] Generated insight:`, scenarioResult);
    } catch (aiError) {
      console.error("❌ Gemini API Error:", aiError);
      return res.status(500).json({ 
        success: false, 
        error: "Failed to generate what-if insight", 
        details: aiError.message 
      });
    }

    // Return response
    return res.status(200).json({
      success: true,
      scenarioResult,
      raw: rawLLMResponse,
      analytics: {
        original: {
          totals: originalAnalytics.totals,
          byCategory: originalAnalytics.byCategory,
        },
        adjusted: {
          totals: adjustedAnalytics.totals,
          byCategory: adjustedAnalytics.byCategory,
        },
      },
    });

  } catch (error) {
    console.error("❌ [What-If] SERVER ERROR:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Server error", 
      details: error.message 
    });
  }
});

module.exports = router;

