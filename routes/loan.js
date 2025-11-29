const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Loan = require('../models/loan');
const { computeSimpleAnalytics } = require('../services/analytics');

if (!process.env.GOOGLE_AI_API_KEY) {
  console.error("❌ GOOGLE_AI_API_KEY is missing in environment!");
}

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY || "");

// POST /api/loan - Add loan
router.post('/', async (req, res) => {
  try {
    const { userId, loanName, principal, interestRate, tenureMonths, emiAmount, dueDate } = req.body;

    if (!userId || !loanName || !principal || !interestRate || !tenureMonths || !emiAmount || !dueDate) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const loan = await Loan.create({
      userId,
      loanName,
      principal,
      interestRate,
      tenureMonths,
      emiAmount,
      dueDate: new Date(dueDate),
    });

    res.status(201).json(loan);
  } catch (error) {
    console.error('[loan] POST failed', error);
    res.status(500).json({ error: 'Failed to create loan' });
  }
});

// GET /api/loan - Fetch all loans
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId query param is required' });
    }

    const loans = await Loan.find({ userId }).sort({ createdAt: -1 });
    res.json(loans);
  } catch (error) {
    console.error('[loan] GET failed', error);
    res.status(500).json({ error: 'Failed to fetch loans' });
  }
});

// PUT /api/loan/:id - Update loan
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { loanName, principal, interestRate, tenureMonths, emiAmount, dueDate } = req.body;

    const loan = await Loan.findByIdAndUpdate(
      id,
      {
        loanName,
        principal,
        interestRate,
        tenureMonths,
        emiAmount,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
      { new: true, runValidators: true }
    );

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    res.json(loan);
  } catch (error) {
    console.error('[loan] PUT failed', error);
    res.status(500).json({ error: 'Failed to update loan' });
  }
});

// DELETE /api/loan/:id - Delete loan
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const loan = await Loan.findByIdAndDelete(id);

    if (!loan) {
      return res.status(404).json({ error: 'Loan not found' });
    }

    res.json({ success: true, message: 'Loan deleted successfully' });
  } catch (error) {
    console.error('[loan] DELETE failed', error);
    res.status(500).json({ error: 'Failed to delete loan' });
  }
});

// GET /api/loan/emi-stress - EMI Stress Analytics
router.get('/emi-stress', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId query param is required' });
    }

    const loans = await Loan.find({ userId });
    const analytics = await computeSimpleAnalytics(userId, 30);

    const totalEMI = loans.reduce((sum, loan) => sum + (loan.emiAmount || 0), 0);
    const monthlyIncome = analytics.totalIncome || 0;
    const monthlyExpenses = analytics.totals || 0;
    const netIncome = monthlyIncome - monthlyExpenses;

    // EMI-to-income ratio
    const emiToIncomeRatio = monthlyIncome > 0 ? (totalEMI / monthlyIncome) * 100 : 0;

    // EMI coverage
    const emiCoverage = netIncome - totalEMI;

    // Probability of missing EMI (0-100)
    let missProbability = 0;
    if (emiCoverage < 0) {
      missProbability = Math.min(100, Math.abs(emiCoverage / totalEMI) * 100);
    } else if (emiCoverage < totalEMI * 0.2) {
      missProbability = 30; // Low buffer
    } else if (emiCoverage < totalEMI * 0.5) {
      missProbability = 15; // Medium buffer
    }

    // Daily/weekly cushion needed
    const daysUntilNextEMI = 30; // Simplified - can be calculated from dueDate
    const dailyCushion = emiCoverage < 0 ? Math.abs(emiCoverage) / daysUntilNextEMI : 0;
    const weeklyCushion = dailyCushion * 7;

    // Repayment readiness score (0-100)
    let readinessScore = 100;
    if (emiCoverage < 0) {
      readinessScore = 0;
    } else if (emiCoverage < totalEMI * 0.2) {
      readinessScore = 40;
    } else if (emiCoverage < totalEMI * 0.5) {
      readinessScore = 70;
    } else if (emiCoverage < totalEMI) {
      readinessScore = 85;
    }

    // Determine risk level
    let riskLevel = "Low";
    if (readinessScore < 40) {
      riskLevel = "Critical";
    } else if (readinessScore < 60) {
      riskLevel = "High";
    } else if (readinessScore < 80) {
      riskLevel = "Medium";
    }

    // Generate next warning
    let nextWarning = null;
    if (emiCoverage < 0) {
      nextWarning = `Critical: You have a shortfall of ₹${Math.abs(emiCoverage).toFixed(0)}. Immediate action required.`;
    } else if (emiCoverage < totalEMI * 0.2) {
      nextWarning = `Low buffer: Only ₹${emiCoverage.toFixed(0)} available. Consider reducing expenses.`;
    } else if (readinessScore < 80) {
      nextWarning = `Monitor your spending. Current buffer: ₹${emiCoverage.toFixed(0)}.`;
    }

    res.json({
      emiToIncomeRatio: Math.round(emiToIncomeRatio * 100) / 100,
      emiCoverage: Math.round(emiCoverage * 100) / 100,
      missProbability: Math.round(missProbability * 100) / 100,
      dailyCushion: Math.round(dailyCushion * 100) / 100,
      weeklyCushion: Math.round(weeklyCushion * 100) / 100,
      readinessScore: Math.round(readinessScore),
      totalEMI: Math.round(totalEMI * 100) / 100,
      netIncome: Math.round(netIncome * 100) / 100,
      riskLevel: riskLevel,
      nextWarning: nextWarning,
    });
  } catch (error) {
    console.error('[loan] EMI stress failed', error);
    res.status(500).json({ error: 'Failed to calculate EMI stress' });
  }
});

// POST /api/loan/emi-what-if - EMI What-If Simulator
router.post('/emi-what-if', async (req, res) => {
  try {
    const { userId, scenario } = req.body;

    if (!userId || !scenario || !scenario.type || typeof scenario.value !== 'number') {
      return res.status(400).json({ error: 'userId and scenario with type and value are required' });
    }

    const loans = await Loan.find({ userId });
    const analytics = await computeSimpleAnalytics(userId, 30);

    const totalEMI = loans.reduce((sum, loan) => sum + (loan.emiAmount || 0), 0);
    let monthlyIncome = analytics.totalIncome || 0;
    let monthlyExpenses = analytics.totals || 0;
    let newEMI = totalEMI;

    // Apply scenario
    switch (scenario.type) {
      case 'income-drop':
        monthlyIncome = monthlyIncome * (1 - scenario.value / 100);
        break;
      case 'expense-rise':
        monthlyExpenses = monthlyExpenses * (1 + scenario.value / 100);
        break;
      case 'interest-change':
        // Recalculate EMI for all loans with new interest rate
        loans.forEach(loan => {
          const r = (loan.interestRate + scenario.value) / 12 / 100;
          const n = loan.tenureMonths;
          const p = loan.principal;
          if (r > 0) {
            newEMI = newEMI - loan.emiAmount + (p * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
          }
        });
        break;
      default:
        return res.status(400).json({ error: 'Invalid scenario type' });
    }

    const netIncome = monthlyIncome - monthlyExpenses;
    const emiCoverage = netIncome - newEMI;

    // Survivability score (0-100)
    let survivabilityScore = 100;
    if (emiCoverage < 0) {
      survivabilityScore = 0;
    } else if (emiCoverage < newEMI * 0.2) {
      survivabilityScore = 30;
    } else if (emiCoverage < newEMI * 0.5) {
      survivabilityScore = 60;
    } else if (emiCoverage < newEMI) {
      survivabilityScore = 80;
    }

    // Generate micro tip
    const tip = emiCoverage < 0
      ? `Critical: You'll face a shortfall of ₹${Math.abs(emiCoverage).toFixed(2)}. Consider reducing expenses or increasing income.`
      : emiCoverage < newEMI * 0.2
      ? `Tight situation: You have minimal buffer. Build emergency savings.`
      : `You're safe with a buffer of ₹${emiCoverage.toFixed(2)}. Maintain this cushion.`;

    res.json({
      impact: {
        newNetIncome: Math.round(netIncome * 100) / 100,
        newEMI: Math.round(newEMI * 100) / 100,
        emiCoverage: Math.round(emiCoverage * 100) / 100,
      },
      newEMI: Math.round(newEMI * 100) / 100,
      survivabilityScore: Math.round(survivabilityScore),
      microTip: tip,
    });
  } catch (error) {
    console.error('[loan] What-if failed', error);
    res.status(500).json({ error: 'Failed to simulate scenario' });
  }
});

// GET /api/loan/calendar - Smart EMI Calendar
router.get('/calendar', async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'userId query param is required' });
    }

    const loans = await Loan.find({ userId });
    const now = new Date();
    const calendar = [];

    // Generate next 12 months
    for (let i = 0; i < 12; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthEvents = [];

      loans.forEach(loan => {
        const dueDate = new Date(loan.dueDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        if (dueDate >= now) {
          const earlyPaymentWindow = new Date(dueDate);
          earlyPaymentWindow.setDate(earlyPaymentWindow.getDate() - 5);

          const gracePeriod = new Date(dueDate);
          gracePeriod.setDate(gracePeriod.getDate() + 5);

          monthEvents.push({
            loanName: loan.loanName,
            emiAmount: loan.emiAmount,
            dueDate: dueDate.toISOString(),
            earlyPaymentWindow: earlyPaymentWindow.toISOString(),
            gracePeriod: gracePeriod.toISOString(),
            risk: dueDate <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) ? 'high' : 'low',
          });
        }
      });

      calendar.push({
        month: monthDate.toISOString(),
        events: monthEvents,
      });
    }

    res.json({ calendar });
  } catch (error) {
    console.error('[loan] Calendar failed', error);
    res.status(500).json({ error: 'Failed to generate calendar' });
  }
});

// POST /api/loan/emi-ai - AI EMI Analysis
router.post('/emi-ai', async (req, res) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const loans = await Loan.find({ userId });
    const analytics = await computeSimpleAnalytics(userId, 30);

    const totalEMI = loans.reduce((sum, loan) => sum + (loan.emiAmount || 0), 0);
    const monthlyIncome = analytics.totalIncome || 0;
    const monthlyExpenses = analytics.totals || 0;
    const netIncome = monthlyIncome - monthlyExpenses;
    const emiCoverage = netIncome - totalEMI;

    const prompt = `
You are a financial advisor analyzing a user's loan EMI situation:

INCOME & EXPENSES (Last 30 days):
- Total income: ₹${monthlyIncome.toFixed(2)}
- Total expenses: ₹${monthlyExpenses.toFixed(2)}
- Net income: ₹${netIncome.toFixed(2)}

LOAN DETAILS:
- Total EMI: ₹${totalEMI.toFixed(2)}
- EMI coverage: ₹${emiCoverage.toFixed(2)}
- Number of loans: ${loans.length}
${loans.map((loan, idx) => `- Loan ${idx + 1}: ${loan.loanName} - EMI: ₹${loan.emiAmount.toFixed(2)}`).join('\n')}

SPENDING PATTERNS:
- Category breakdown: ${Object.entries(analytics.byCategory || {}).map(([cat, amt]) => `${cat}: ₹${amt.toFixed(2)}`).join(', ')}

Generate a **STRICT JSON ONLY** response in this format:
{
  "overview": "",
  "stressLevel": "low" | "medium" | "high" | "critical",
  "recommendedCuts": [],
  "microTip": "",
  "nextStep": ""
}

Rules:
- Respond ONLY with JSON. No markdown, no text.
- overview: Brief summary of EMI situation (2-3 sentences)
- stressLevel: Based on EMI coverage and net income
- recommendedCuts: Array of specific expense categories to reduce (max 3)
- microTip: One actionable tip
- nextStep: Immediate next action for the user
`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    let aiResponseText = "";
    try {
      const result = await model.generateContent(prompt);
      aiResponseText = result.response.text();
    } catch (aiError) {
      console.error(`[Loan AI] ❌ Gemini API Error:`, aiError);
      throw new Error(`Gemini API failure: ${aiError.message}`);
    }

    const cleanJson = aiResponseText.replace(/```json|```/g, "").trim();
    let aiData = {};
    try {
      aiData = JSON.parse(cleanJson);
    } catch (jsonErr) {
      console.error(`[Loan AI] ❌ Failed to parse JSON:`, jsonErr);
      throw new Error(`Gemini returned invalid JSON: ${jsonErr.message}`);
    }

    if (!aiData.overview || !aiData.stressLevel) {
      throw new Error("Missing required fields in AI output");
    }

    res.json({
      success: true,
      overview: aiData.overview,
      stressLevel: aiData.stressLevel,
      recommendedCuts: aiData.recommendedCuts || [],
      microTip: aiData.microTip || "",
      nextStep: aiData.nextStep || "",
    });
  } catch (error) {
    console.error("❌ [Loan AI] SERVER ERROR:", error);
    res.status(500).json({
      success: false,
      error: "Server error",
      details: error.message,
    });
  }
});

module.exports = router;

