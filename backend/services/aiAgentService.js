const { pool }                 = require('../config/db');
const { runSpendingAgent }     = require('./spendingAgent');
const { runSavingsAgent }      = require('./savingsAgent');
const { runLoanAgent }         = require('./loanAgent');
const { runBillReminderAgent } = require('./billReminderAgent');
const { runInvestmentAgent }   = require('./investmentAgent');

// ─── Gemini API helper ────────────────────────────────────────────────────────
/**
 * Call Google Gemini API.
 * @param {string} prompt
 * @returns {Promise<string|null>} raw JSON text or null
 */
const callGemini = async (prompt) => {
  const apiKey = process.env.GEMINI_API_KEY;
  const model  = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

  if (!apiKey) {
    console.warn('GEMINI_API_KEY not set — skipping Gemini, using rule-based fallback');
    return null;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const response = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature:      0.4,
        maxOutputTokens:  1024,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${err}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  return text.replace(/```json|```/g, '').trim();
};

// ─── Orchestrator ─────────────────────────────────────────────────────────────
/**
 * Dispatches all 5 agents in parallel after login.
 * Each agent runs rule-based logic first, then Gemini enhances the output.
 * @param {number} userId
 */
const runAllAgents = async (userId) => {
  console.log(`\nRunning all AI agents (Gemini-powered) for user #${userId}`);

  const [orch] = await pool.query(
    'INSERT INTO agent_runs (user_id, agent_type, status) VALUES (?, ?, ?)',
    [userId, 'orchestrator', 'running']
  );
  const orchId = orch.insertId;

  // Fetch shared context once
  const [[user]] = await pool.query(
    'SELECT id, first_name, risk_profile, credit_score FROM users WHERE id = ?',
    [userId]
  );
  const [transactions] = await pool.query(
    `SELECT * FROM transactions
     WHERE user_id = ? AND txn_date >= DATE_SUB(NOW(), INTERVAL 3 MONTH)
     ORDER BY txn_date DESC`,
    [userId]
  );

  const context = { user, transactions };

  // Run all 5 agents in parallel (each internally calls Gemini)
  const results = await Promise.allSettled([
    runSpendingAgent(context),
    runSavingsAgent(context),
    runLoanAgent(context),
    runBillReminderAgent(context),
    runInvestmentAgent(context),
  ]);

  // Mark transactions as analysed
  await pool.query(
    'UPDATE transactions SET ai_analysed = 1 WHERE user_id = ? AND ai_analysed = 0',
    [userId]
  );

  // Close orchestrator run
  await pool.query(
    'UPDATE agent_runs SET status = ?, completed_at = NOW() WHERE id = ?',
    ['completed', orchId]
  );

  const agentNames = ['spending', 'savings', 'loan', 'bill_reminder', 'investment'];
  const summary = results.map((r, i) => ({
    agent:  agentNames[i],
    status: r.status,
    value:  r.status === 'fulfilled' ? r.value : r.reason?.message,
  }));

  console.log('All agents completed:', summary.map(s => `${s.agent}:${s.status}`).join(' | '));
  return summary;
};

module.exports = {
    runAllAgents
};