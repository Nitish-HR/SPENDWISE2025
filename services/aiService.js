async function fakeLLMResponse(context) {
  const analytics = context.analytics || {};
  const categories = Object.keys(analytics.byCategory || {});
  const topCategory = categories.length ? categories[0] : null;

  return {
    overview: `In the last 30 days, you spent ₹${Math.round(analytics.totals || 0)}.`,
    overspendAreas: topCategory
      ? [
          {
            category: topCategory,
            amount: analytics.byCategory[topCategory],
            why: 'High spending relative to other categories',
          },
        ]
      : [],
    savingsPlan: `Try saving ₹${Math.max(50, Math.round((analytics.avgWeekly || 0) * 0.1))} per week.`,
    microTip: 'Cook twice a week instead of ordering to reduce food expenses.',
    prediction: (analytics.totals || 0) > 5000 ? 'risk: overspend' : 'no immediate risk',
  };
}

module.exports = { fakeLLMResponse };

