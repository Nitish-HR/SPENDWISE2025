const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { generateInvestmentInsight } = require('../services/investmentAI');

if (!process.env.GOOGLE_AI_API_KEY) {
  console.error("❌ GOOGLE_AI_API_KEY is missing in environment!");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

/**
 * Generate SIP investment micro-tip using Gemini AI
 */
router.post('/sip-tip', async (req, res) => {
  try {
    const { finalCorpus, invested, returns } = req.body;

    if (typeof finalCorpus !== 'number' || typeof invested !== 'number' || typeof returns !== 'number') {
      return res.status(400).json({ 
        success: false, 
        error: 'finalCorpus, invested, and returns are required numbers' 
      });
    }

    console.log(`[Investment] Generating SIP tip for corpus: ₹${finalCorpus.toFixed(2)}, invested: ₹${invested.toFixed(2)}, returns: ₹${returns.toFixed(2)}`);

    const prompt = `
You are a financial advisor. A user has calculated their SIP (Systematic Investment Plan) results:
- Total invested amount: ₹${invested.toFixed(2)}
- Estimated returns: ₹${returns.toFixed(2)}
- Final corpus: ₹${finalCorpus.toFixed(2)}

Explain in one short paragraph (2-3 sentences, maximum 100 words) why investing through SIPs is valuable, based on these results. Be encouraging and highlight the benefits of disciplined investing.

Generate a **STRICT JSON ONLY** response in this format:
{
  "microTip": "..."
}

Rules:
- Respond ONLY with JSON. No markdown, no text.
- Keep the microTip concise and actionable.
- Focus on the power of compounding and regular investing.
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let aiResponseText = "";
    try {
      const result = await model.generateContent(prompt);
      aiResponseText = result.response.text();
    } catch (aiError) {
      console.error(`[Investment] ❌ Gemini API Error:`, aiError);
      throw new Error(`Gemini API failure: ${aiError.message}`);
    }

    // Clean and parse JSON
    const cleanJson = aiResponseText.replace(/```json|```/g, "").trim();

    let tipData = {};
    try {
      tipData = JSON.parse(cleanJson);
    } catch (jsonErr) {
      console.error(`[Investment] ❌ Failed to parse Gemini JSON:`, jsonErr);
      throw new Error(`Gemini returned invalid JSON: ${jsonErr.message}`);
    }

    if (!tipData.microTip) {
      throw new Error("Missing microTip in AI output");
    }

    console.log(`[Investment] ✅ SIP tip generated successfully`);

    return res.status(200).json({ 
      success: true, 
      microTip: tipData.microTip 
    });

  } catch (error) {
    console.error("❌ [Investment] SERVER ERROR:", error);
    return res.status(500).json({ 
      success: false, 
      error: "Server error", 
      details: error.message 
    });
  }
});

/**
 * GET /api/investment/insight
 * Generate AI-powered investment insight for SIP calculation
 */
router.get('/insight', async (req, res) => {
  try {
    const monthly = parseFloat(req.query.monthly);
    const years = parseFloat(req.query.years);
    const rate = parseFloat(req.query.rate);

    // Validate inputs
    if (!monthly || !years || !rate || isNaN(monthly) || isNaN(years) || isNaN(rate)) {
      return res.status(400).json({
        success: false,
        error: 'monthly, years, and rate query parameters are required and must be valid numbers'
      });
    }

    if (monthly <= 0 || years <= 0 || rate < 0) {
      return res.status(400).json({
        success: false,
        error: 'monthly and years must be positive, rate must be non-negative'
      });
    }

    console.log(`[Investment] Generating insight for monthly: ₹${monthly}, years: ${years}, rate: ${rate}%`);

    // Calculate SIP
    const invested = monthly * 12 * years;

    // Calculate final corpus using SIP FV formula
    // FV = P * [ ((1+r)^n - 1) / r ] * (1+r)
    // Where: P = monthly contribution, r = monthly interest rate, n = total months
    const r = rate / 12 / 100;
    const n = years * 12;
    let finalCorpus = 0;

    if (r === 0) {
      finalCorpus = monthly * n;
    } else {
      const numerator = Math.pow(1 + r, n) - 1;
      finalCorpus = monthly * (numerator / r) * (1 + r);
    }

    const returns = finalCorpus - invested;

    // Generate AI insight
    const insight = await generateInvestmentInsight(
      monthly,
      years,
      rate,
      invested,
      finalCorpus,
      returns
    );

    console.log(`[Investment] ✅ Insight generated successfully`);

    return res.status(200).json({
      success: true,
      insight: {
        overview: insight.overview,
        benefit: insight.benefit,
        microTip: insight.microTip
      },
      calculation: {
        invested: Math.round(invested * 100) / 100,
        returns: Math.round(returns * 100) / 100,
        finalCorpus: Math.round(finalCorpus * 100) / 100
      }
    });

  } catch (error) {
    console.error("❌ [Investment] SERVER ERROR:", error);
    return res.status(500).json({
      success: false,
      error: "Server error",
      details: error.message
    });
  }
});

module.exports = router;

