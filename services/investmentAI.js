const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GOOGLE_AI_API_KEY) {
  console.error("❌ GOOGLE_AI_API_KEY is missing in environment!");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

/**
 * Generate investment insight using Gemini AI
 * @param {number} monthly - Monthly investment amount
 * @param {number} years - Investment duration in years
 * @param {number} rate - Annual return rate percentage
 * @param {number} invested - Total invested amount
 * @param {number} finalCorpus - Final corpus amount
 * @param {number} returns - Estimated returns
 * @returns {Promise<Object>} AI-generated insight with overview, benefit, microTip
 */
async function generateInvestmentInsight(monthly, years, rate, invested, finalCorpus, returns) {
  const prompt = `
You are a financial advisor. A user is planning a SIP (Systematic Investment Plan) with the following details:
- Monthly investment: ₹${monthly.toFixed(2)}
- Investment duration: ${years} years
- Expected annual return: ${rate}%
- Total invested: ₹${invested.toFixed(2)}
- Estimated returns: ₹${returns.toFixed(2)}
- Final corpus: ₹${finalCorpus.toFixed(2)}

Generate a **STRICT JSON ONLY** response in this format:
{
  "overview": "",
  "benefit": "",
  "microTip": ""
}

Rules:
- Respond ONLY with JSON. No markdown, no text.
- overview: A brief summary of the SIP plan (1-2 sentences)
- benefit: Highlight the key benefit of this investment strategy (1 sentence)
- microTip: A practical tip for the investor (1 sentence)
- Be concise and actionable.
- Focus on the power of compounding and disciplined investing.
`;

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  let aiResponseText = "";
  try {
    const result = await model.generateContent(prompt);
    aiResponseText = result.response.text();
  } catch (aiError) {
    console.error(`[InvestmentAI] ❌ Gemini API Error:`, aiError);
    throw new Error(`Gemini API failure: ${aiError.message}`);
  }

  // Clean and parse JSON
  const cleanJson = aiResponseText.replace(/```json|```/g, "").trim();

  let insightData = {};
  try {
    insightData = JSON.parse(cleanJson);
  } catch (jsonErr) {
    console.error(`[InvestmentAI] ❌ Failed to parse Gemini JSON:`, jsonErr);
    throw new Error(`Gemini returned invalid JSON: ${jsonErr.message}`);
  }

  if (!insightData.overview || !insightData.benefit || !insightData.microTip) {
    throw new Error("Missing required fields in AI output");
  }

  return insightData;
}

module.exports = { generateInvestmentInsight };

