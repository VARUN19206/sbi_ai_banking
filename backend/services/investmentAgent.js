const { pool }               = require('../config/db');
const { createNotification } = require('../controllers/notificationController');
const { callGemini } = require('./geminiService');

/**
 * Investment Agent — rule-based FD/SIP calc + Gemini AI personalised portfolio advice.
 */
const runInvestmentAgent = async ({ user, transactions }) => {
  const agentType = 'investment';

  const [run] = await pool.query(
    'INSERT INTO agent_runs (user_id, agent_type, status) VALUES (?, ?, ?)',
    [user.id, agentType, 'running']
  );

  // ── Rule-based analysis ──────────────────────────────────────────────
  const income  = transactions.filter(t => t.type === 'credit').reduce((s, t) => s + +t.amount, 0) / 3;
  const expense = transactions.filter(t => t.type === 'debit').reduce((s, t) => s + +t.amount, 0) / 3;
  const surplus = income - expense;
  const recs    = [];

  const riskRates = { conservative: 0.068, moderate: 0.10, aggressive: 0.14 };
  const rate      = riskRates[user.risk_profile] || 0.10;

  if (surplus > 10000) {
    const fdAmount = Math.floor(surplus * 0.4 / 1000) * 1000;
    if (fdAmount >= 5000) {
      recs.push({
        title:           `Open a Rs.${fdAmount.toLocaleString()} Fixed Deposit`,
        description:     `Idle surplus can earn Rs.${(fdAmount * 0.068).toFixed(0)}/year at SBI's 1-year FD rate of 6.8% p.a.`,
        priority:        'medium',
        potential_value: +(fdAmount * 0.068).toFixed(2),
      });
    }
  }

  if (surplus > 3000) {
    const sip = Math.floor((surplus * 0.3) / 500) * 500;
    if (sip >= 500) {
      const corpus10yr = sip * 12 * ((Math.pow(1 + rate / 12, 120) - 1) / (rate / 12));
      recs.push({
        title:           `${user.risk_profile === 'aggressive' ? 'Equity' : user.risk_profile === 'conservative' ? 'Debt' : 'Balanced'} MF SIP — Rs.${sip.toLocaleString()}/month`,
        description:     `A monthly SIP of Rs.${sip} could grow to Rs.${(corpus10yr / 100000).toFixed(1)}L in 10 years at ${(rate * 100).toFixed(0)}% CAGR.`,
        priority:        'low',
        potential_value: +corpus10yr.toFixed(2),
      });
    }
  }

  // ── Gemini AI enhancement ────────────────────────────────────────────
  try {
    const riskCagr = { conservative: '6.8%', moderate: '10%', aggressive: '14%' };

    const prompt = `You are an investment advisor for SBI AI Banking Assistant.
Based on the user's financial profile, suggest 2 personalised investment options suited to their risk profile.
Consider SIP, FD, ELSS, PPF, and NPS options available in India.

Respond ONLY in valid JSON with no markdown fences:
{
  "insights": [
    {
      "title": "<instrument + amount, under 10 words>",
      "description": "<specific recommendation with 10-year projected returns, 1-2 sentences>",
      "priority": "low|medium|high",
      "potential_value": <10-year projected INR or null>,
      "instrument": "SIP|FD|RD|ELSS|PPF|NPS"
    }
  ],
  "risk_profile_used": "${user.risk_profile}"
}

User: ${user.first_name}
Risk profile: ${user.risk_profile} (expected CAGR: ${riskCagr[user.risk_profile] || '10%'})
Monthly avg income: Rs.${income.toFixed(0)}
Monthly avg expense: Rs.${expense.toFixed(0)}
Monthly surplus: Rs.${surplus.toFixed(0)}`;

    const raw = await callGemini(prompt);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.insights?.length) {
        for (const insight of parsed.insights) {
          recs.push({
            title:           `[Gemini] ${insight.title}`,
            description:     insight.description,
            priority:        insight.priority || 'low',
            potential_value: insight.potential_value || null,
          });
        }
        console.log(`Gemini investment agent: ${parsed.insights.length} AI insights added`);
      }
    }
  } catch (err) {
    console.warn('Gemini investment agent failed, using rule-based only:', err.message);
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
      type: 'info', agent_source: agentType,
      title: 'New investment suggestions available',
      body:  `Your AI investment agent created ${recs.length} plan${recs.length > 1 ? 's' : ''} based on your risk profile.`,
    });
  }

  await pool.query(
    'UPDATE agent_runs SET status=?, completed_at=NOW() WHERE id=?',
    ['completed', run.insertId]
  );

  return { recommendations: recs.length };
};

module.exports = { runInvestmentAgent };