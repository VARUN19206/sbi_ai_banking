const { pool }               = require('../config/db');
const { createNotification } = require('../controllers/notificationController');
const { callGemini } = require('./geminiService');

/**
 * Loan Agent — FOIR calculation + Gemini AI loan eligibility advice.
 */
const runLoanAgent = async ({ user, transactions }) => {
  const agentType = 'loan';

  const [run] = await pool.query(
    'INSERT INTO agent_runs (user_id, agent_type, status) VALUES (?, ?, ?)',
    [user.id, agentType, 'running']
  );

  // ── Rule-based analysis ──────────────────────────────────────────────
  const income   = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + +t.amount, 0) / 3;
  const loanTxns = transactions.filter(t => t.category === 'loan');
  const emiTotal = loanTxns.reduce((s, t) => s + +t.amount, 0) / 3;
  const foir     = income ? (emiTotal / income) * 100 : 0;
  const recs     = [];

  if (user.credit_score >= 750 && foir < 50) {
    const eligibleAmount = Math.floor((income * 60) / 10000) * 10000;
    recs.push({
      title:           `Pre-approved home loan — up to Rs.${eligibleAmount.toLocaleString()}`,
      description:     `Credit score ${user.credit_score} and FOIR ${foir.toFixed(1)}% qualify you for a home loan at ~8.4% p.a. EMI would be approx Rs.${Math.floor(eligibleAmount * 0.0075).toLocaleString()}/month over 20 years.`,
      priority:        'medium',
      potential_value: eligibleAmount,
    });
  }

  if (foir > 60) {
    recs.push({
      title:           'High loan burden — consider debt consolidation',
      description:     `Your EMI-to-income ratio is ${foir.toFixed(1)}%. SBI recommends keeping this below 50%. A debt consolidation loan at lower interest could reduce monthly outflow.`,
      priority:        'high',
      potential_value: null,
    });
  }

  // ── Gemini AI enhancement ────────────────────────────────────────────
  try {
    const prompt = `You are a loan advisor for SBI AI Banking Assistant.
Analyse the user's financial profile below and give 1-2 personalised loan recommendations or debt health tips.
Consider Indian home loan, personal loan, and vehicle loan options.

Respond ONLY in valid JSON with no markdown fences:
{
  "insights": [
    {
      "title": "<short title under 10 words>",
      "description": "<loan offer or debt advice with rate and EMI details, 1-2 sentences>",
      "priority": "low|medium|high|urgent",
      "eligible_amount": <INR or null>
    }
  ],
  "foir_percent": <number>,
  "credit_health": "poor|fair|good|excellent"
}

User: ${user.first_name}
Credit score: ${user.credit_score}
Monthly avg income: Rs.${income.toFixed(0)}
Monthly avg EMI outflow: Rs.${emiTotal.toFixed(0)}
FOIR: ${foir.toFixed(1)}%
Existing loan transactions: ${loanTxns.length}`;

    const raw = await callGemini(prompt);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.insights?.length) {
        for (const insight of parsed.insights) {
          recs.push({
            title:           `[Gemini] ${insight.title}`,
            description:     insight.description,
            priority:        insight.priority || 'medium',
            potential_value: insight.eligible_amount || null,
          });
        }
        console.log(`Gemini loan agent: ${parsed.insights.length} AI insights added`);
      }
    }
  } catch (err) {
    console.warn('Gemini loan agent failed, using rule-based only:', err.message);
  }

  // ── Save to DB ───────────────────────────────────────────────────────
  for (const rec of recs) {
    await pool.query(
      'INSERT INTO recommendations (user_id, agent_type, title, description, priority, potential_value) VALUES (?, ?, ?, ?, ?, ?)',
      [user.id, agentType, rec.title, rec.description, rec.priority, rec.potential_value]
    );
  }

  await pool.query(
    'UPDATE agent_runs SET status=?, completed_at=NOW() WHERE id=?',
    ['completed', run.insertId]
  );

  return { recommendations: recs.length, foir: foir.toFixed(1) };
};

module.exports = { runLoanAgent };