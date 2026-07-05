const { pool }               = require('../config/db');
const { createNotification } = require('../controllers/notificationController');
const { callGemini } = require('./geminiService');

/**
 * Savings Agent — rule-based surplus detection + Gemini AI personalised advice.
 */
const runSavingsAgent = async ({ user, transactions }) => {
  const agentType = 'savings';

  const [run] = await pool.query(
    'INSERT INTO agent_runs (user_id, agent_type, status) VALUES (?, ?, ?)',
    [user.id, agentType, 'running']
  );

  // ── Rule-based analysis ──────────────────────────────────────────────
  const income  = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + +t.amount, 0);
  const expense = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + +t.amount, 0);
  const surplus = income - expense;
  const monthlyExpense = expense / 3;
  const recs = [];

  if (surplus > 5000) {
    const monthlyInvest = Math.floor(surplus * 0.3 / 500) * 500;
    if (monthlyInvest >= 500) {
      recs.push({
        title:           `Start a Rs.${monthlyInvest.toLocaleString()}/month SIP`,
        description:     `Based on your 3-month surplus of Rs.${surplus.toFixed(0)}, investing Rs.${monthlyInvest}/month in a balanced mutual fund could grow to Rs.${(monthlyInvest * 12 * 10 * 1.12).toFixed(0)} in 10 years at 12% CAGR.`,
        priority:        'medium',
        potential_value: monthlyInvest * 12,
      });
    }
    recs.push({
      title:           'Build a 6-month emergency fund',
      description:     `Your monthly expenses average Rs.${monthlyExpense.toFixed(0)}. Aim for Rs.${(monthlyExpense * 6).toFixed(0)} in a liquid fund for 6 months of coverage.`,
      priority:        'medium',
      potential_value: null,
    });
  }

  // ── Gemini AI enhancement ────────────────────────────────────────────
  try {
    const prompt = `You are a savings advisor for SBI AI Banking Assistant.
Based on the financial summary below, give 2 personalised savings recommendations for an Indian bank customer.
Consider SIP, RD, liquid funds, and emergency fund adequacy.

Respond ONLY in valid JSON with no markdown fences:
{
  "insights": [
    {
      "title": "<short title under 10 words>",
      "description": "<specific recommendation with projected INR returns, 1-2 sentences>",
      "priority": "low|medium|high",
      "potential_value": <projected INR or null>
    }
  ],
  "surplus_estimate": <monthly surplus in INR>
}

User: ${user.first_name}, Risk profile: ${user.risk_profile}
3-month total income: Rs.${income.toFixed(0)}
3-month total expense: Rs.${expense.toFixed(0)}
Net surplus: Rs.${surplus.toFixed(0)}
Monthly avg expense: Rs.${monthlyExpense.toFixed(0)}`;

    const raw = await callGemini(prompt);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.insights?.length) {
        for (const insight of parsed.insights) {
          recs.push({
            title:           `[Gemini] ${insight.title}`,
            description:     insight.description,
            priority:        insight.priority || 'medium',
            potential_value: insight.potential_value || null,
          });
        }
        console.log(`Gemini savings agent: ${parsed.insights.length} AI insights added`);
      }
    }
  } catch (err) {
    console.warn('Gemini savings agent failed, using rule-based only:', err.message);
  }

  // ── Save to DB ───────────────────────────────────────────────────────
  for (const rec of recs) {
    await pool.query(
      'INSERT INTO recommendations (user_id, agent_type, title, description, priority, potential_value) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, agentType, rec.title, rec.description, rec.priority, rec.potential_value]
    );
  }

  if (recs.length) {
    await createNotification(user.id, {
      type: 'success', agent_source: agentType,
      title: `${recs.length} new savings suggestion${recs.length > 1 ? 's' : ''} ready`,
      body:  'Your AI savings agent found opportunities based on your recent income.',
    });
  }

  await pool.query(
    'UPDATE agent_runs SET status=?, completed_at=NOW() WHERE id=?',
    ['completed', run.insertId]
  );

  return { recommendations: recs.length, surplus };
};

module.exports = { runSavingsAgent };