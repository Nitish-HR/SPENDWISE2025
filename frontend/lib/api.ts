const BASE = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

async function fetchAPI(endpoint: string, options?: RequestInit) {
  const response = await fetch(`${BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getLatestInsights(userId: string) {
  return fetchAPI(`/api/insights/latest?userId=${userId}`);
}

export async function getInsightsHistory(userId: string) {
  return fetchAPI(`/api/insights/history?userId=${userId}`);  // FIXED
}

export async function getInsightsTimeline(userId: string) {
  return fetchAPI(`/api/insights/timeline?userId=${userId}`);
}

export async function getExpenses(userId: string) {
  return fetchAPI(`/api/expenses?userId=${userId}`);
}

export async function addExpense(payload: any) {
  return fetchAPI('/api/expenses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateExpense(id: string, payload: any) {
  return fetchAPI(`/api/expenses/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteExpense(id: string) {
  return fetchAPI(`/api/expenses/${id}`, {
    method: 'DELETE',
  });
}

export async function getIncome(userId: string) {
  return fetchAPI(`/api/income?userId=${userId}`);
}

export async function addIncome(payload: any) {
  return fetchAPI('/api/income', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateIncome(id: string, payload: any) {
  return fetchAPI(`/api/income/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteIncome(id: string) {
  return fetchAPI(`/api/income/${id}`, {
    method: 'DELETE',
  });
}

export async function generateAIInsight(userId: string) {
  return fetchAPI(`/api/ai/generate?userId=${userId}`, {
    method: 'POST',
  });
}

export async function getGoals(userId: string) {
  return fetchAPI(`/api/goals?userId=${userId}`);
}

export async function createGoal(payload: any) {
  return fetchAPI('/api/goals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateGoal(id: string, payload: any) {
  return fetchAPI(`/api/goals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteGoal(id: string) {
  return fetchAPI(`/api/goals/${id}`, {
    method: 'DELETE',
  });
}

export async function getSIPTip(payload: { finalCorpus: number; invested: number; returns: number }) {
  return fetchAPI('/api/investment/sip-tip', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getLoans(userId: string) {
  return fetchAPI(`/api/loan?userId=${userId}`);
}

export async function addLoan(payload: any) {
  return fetchAPI('/api/loan', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateLoan(id: string, payload: any) {
  return fetchAPI(`/api/loan/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export async function deleteLoan(id: string) {
  return fetchAPI(`/api/loan/${id}`, {
    method: 'DELETE',
  });
}

export async function getEMIStress(userId: string) {
  return fetchAPI(`/api/loan/emi-stress?userId=${userId}`);
}

export async function getEMICalendar(userId: string) {
  return fetchAPI(`/api/loan/calendar?userId=${userId}`);
}

export async function simulateEMIWhatIf(payload: { userId: string; scenario: { type: string; value: number } }) {
  return fetchAPI('/api/loan/emi-what-if', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getEMIAI(userId: string) {
  return fetchAPI('/api/loan/emi-ai', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });
}
