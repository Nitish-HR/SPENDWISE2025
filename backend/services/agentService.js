// backend/services/agentService.js (modify the saving part)
const Insight = require('../models/Insight');
const { computeSimpleAnalytics } = require('./analytics');
const { fakeLLMResponse } = require('./aiService');

function tryParseOverspendAreas(value) {
  if (!value) return [];
  // Already an array of objects
  if (Array.isArray(value)) return value.map(v => v || {});
  // If it's an object (single), wrap it
  if (typeof value === 'object') return [value];

  // If it's a string: try JSON.parse first
  if (typeof value === 'string') {
    // Attempt to extract JSON substring
    try {
      return JSON.parse(value);
    } catch (err) {
      // fallback: try to convert JS-like object string to JSON-ish
      // Replace single quotes with double quotes and attempt parse
      try {
        const normalized = value.replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
                                .replace(/'/g, '"');
        return JSON.parse(normalized);
      } catch (e2) {
        // As a last resort return an empty array
        return [];
      }
    }
  }
  return [];
}

async function generateInsightForUser(userId) {
  console.log("[agent] Generating insight for user:", userId);

  const analytics = await computeSimpleAnalytics(userId, 30);
  const context = { userId, analytics };

  const llmResult = await fakeLLMResponse(context);

  // sanitize overspendAreas
  const overspendAreas = tryParseOverspendAreas(llmResult.overspendAreas);

  const doc = await Insight.create({
    userId,
    overview: llmResult.overview || '',
    overspendAreas,
    savingsPlan: llmResult.savingsPlan || '',
    microTip: llmResult.microTip || '',
    prediction: llmResult.prediction || '',
    raw: llmResult
  });

  console.log("[agent] Insight saved:", doc._id);
  return doc;
}

module.exports = { generateInsightForUser };

