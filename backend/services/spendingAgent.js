const { pool }               = require('../config/db');
const { createNotification } = require('../controllers/notificationController');
const { callGemini } = require('./geminiService');

/**
 * Spending Agent — rule-based analysis + Gemini AI enhancement.
 * Flags high-spend categories and creates personalised recommendations.
 */
const runSpendingAgent = async ({ user, transactions }) => {
  const agentType = 'spending';

  const [run] = await pool.query(
    'INSERT INTO agent_runs (user_id, agent_type, status, txns_analysed) VALUES (?, ?, ?, ?)',
    [user.id, agentType, 'running', transactions.length]
  );

  // ── Rule-based analysis ──────────────────────────────────────────────
  const now = new Date();
  const currentMonthTxns = transactions.filter(t => {
    const d = new Date(t.txn_date);
    return d.getMonth() === now.getMonth() &&
           d.getFullYear() === now.getFullYear() &&
           t.type === 'debit';
  });

  const byCategory = {};
  currentMonthTxns.forEach(t => {
    byCategory[t.category] = (byCategory[t.category] || 0) + parseFloat(t.amount);
  });

  const totalSpend = Object.values(byCategory).reduce((s, v) => s + v, 0);
  const recs = [];

  for (const [cat, amount] of Object.entries(byCategory)) {
    const pct = totalSpend ? (amount / totalSpend) * 100 : 0;
    if (pct > 15 && cat !== 'loan' && cat !== 'insurance') {
      recs.push({
        title:           `High ${cat} spending — ${pct.toFixed(0)}% of budget`,
        description:     `You spent Rs.${amount.toFixed(0)} on ${cat} this month (${pct.toFixed(1)}% of total). Consider reducing by 20% to save Rs.${(amount * 0.2).toFixed(0)}/month.`,
        priority:        pct > 30 ? 'high' : 'medium',
        potential_value: +(amount * 0.2).toFixed(2),
      });
    }
  }

  // ── Gemini AI enhancement ────────────────────────────────────────────
  try {
    const prompt = `You are a spending analyst for SBI AI Banking Assistant.
Analyse the debit transactions below and provide 2-3 smart personalised tips to reduce unnecessary spending.
Focus on Indian spending patterns (food delivery, OTT, online shopping).

Respond ONLY in valid JSON with no markdown fences:
{
  "insights": [
    {
      "title": "<short title under 10 words>",
      "description": "<actionable tip with specific INR amounts, 1-2 sentences>",
      "priority": "low|medium|high|urgent",
      "potential_saving": <number in INR or null>
    }
  ],
  "summary": "<1 sentence overall assessment>"
}

User: ${user.first_name}
Monthly transactions: ${JSON.stringify(currentMonthTxns.map(t => ({ description: t.description, category: t.category, amount: t.amount, date: t.txn_date })))}
Total spend: Rs.${totalSpend.toFixed(0)}
By category: ${JSON.stringify(byCategory)}`;

    const raw = await callGemini(prompt);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.insights?.length) {
        for (const insight of parsed.insights) {
          recs.push({
            title:           `[Gemini] ${insight.title}`,
            description:     insight.description,
            priority:        insight.priority || 'medium',
            potential_value: insight.potential_saving || null,
          });
        }
        console.log(`Gemini spending agent: ${parsed.insights.length} AI insights added`);
      }
    }
  } catch (err) {
    console.warn('Gemini spending agent failed, using rule-based only:', err.message);
  }

  // ── Overspend notification ───────────────────────────────────────────
  if (totalSpend > 40000) {
    await createNotification(user.id, {
      type: 'warning', agent_source: agentType,
      title: `Monthly spend Rs.${totalSpend.toFixed(0)} — above typical threshold`,
      body:  'Your AI spending agent detected above-average expenditure this month.',
    });
  }

  // ── Save to DB ───────────────────────────────────────────────────────
  for (const rec of recs) {
    await pool.query(
      'INSERT INTO recommendations (user_id, agent_type, title, description, priority, potential_value) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, agentType, rec.title, rec.description, rec.priority, rec.potential_value]
    );
  }

  await pool.query(
    'UPDATE agent_runs SET status=?, completed_at=NOW(), output_summary=? WHERE id=?',
    ['completed', `Analysed ${currentMonthTxns.length} txns, created ${recs.length} recommendations`, run.insertId]
  );

  return { recommendations: recs.length, totalSpend };
};

module.exports = { runSpendingAgent };