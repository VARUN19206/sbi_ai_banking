const { pool }               = require('../config/db');
const { createNotification } = require('../controllers/notificationController');
const { callGemini } = require('./geminiService');

/**
 * Bill Reminder Agent — detects recurring bills + Gemini AI smart reminders.
 */
const runBillReminderAgent = async ({ user, transactions }) => {
  const agentType = 'bill_reminder';

  const [run] = await pool.query(
    'INSERT INTO agent_runs (user_id, agent_type, status) VALUES (?, ?, ?)',
    [user.id, agentType, 'running']
  );

  // ── Rule-based recurring bill detection ─────────────────────────────
  const utilityTxns = transactions.filter(t =>
    ['utility', 'ott', 'insurance'].includes(t.category)
  );

  const byMerchant = {};
  utilityTxns.forEach(t => {
    const key = t.merchant || t.description;
    if (!byMerchant[key]) byMerchant[key] = [];
    byMerchant[key].push(t);
  });

  const recs  = [];
  const today = new Date();

  for (const [merchant, txns] of Object.entries(byMerchant)) {
    if (txns.length < 2) continue;

    const lastTxn      = txns.sort((a, b) => new Date(b.txn_date) - new Date(a.txn_date))[0];
    const lastDate     = new Date(lastTxn.txn_date);
    const daysSince    = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    const avgAmount    = txns.reduce((s, t) => s + +t.amount, 0) / txns.length;

    if (daysSince >= 25 && daysSince <= 35) {
      const daysUntilDue = 30 - daysSince;
      const priority     = daysUntilDue <= 3 ? 'urgent' : daysUntilDue <= 7 ? 'high' : 'medium';

      recs.push({
        title:           `${merchant} bill due ${daysUntilDue <= 0 ? 'now' : `in ${daysUntilDue} days`}`,
        description:     `Recurring ${lastTxn.category} payment of ~Rs.${avgAmount.toFixed(0)} to ${merchant}. Enable auto-pay to avoid late fees.`,
        priority,
        potential_value: null,
      });

      if (priority === 'urgent') {
        await createNotification(user.id, {
          type: 'alert', agent_source: agentType,
          title: `${merchant} payment due soon`,
          body:  `Rs.${avgAmount.toFixed(0)} due — pay now to avoid disruption.`,
        });
      }
    }
  }

  // ── Gemini AI enhancement ────────────────────────────────────────────
  try {
    const recurringList = Object.entries(byMerchant)
      .filter(([, txns]) => txns.length >= 2)
      .map(([merchant, txns]) => ({
        merchant,
        occurrences:  txns.length,
        avg_amount:   (txns.reduce((s, t) => s + +t.amount, 0) / txns.length).toFixed(0),
        last_paid:    txns.sort((a, b) => new Date(b.txn_date) - new Date(a.txn_date))[0].txn_date,
        category:     txns[0].category,
      }));

    const prompt = `You are a bill management assistant for SBI AI Banking Assistant.
Analyse the recurring bills below and give 2 smart tips — e.g. bundling subscriptions, switching to cheaper plans, or enabling auto-pay cashback.

Respond ONLY in valid JSON with no markdown fences:
{
  "insights": [
    {
      "title": "<short title under 10 words>",
      "description": "<specific money-saving tip with INR amounts, 1-2 sentences>",
      "priority": "low|medium|high|urgent",
      "amount": <INR saving potential or null>
    }
  ]
}

User: ${user.first_name}
Today's date: ${today.toISOString().split('T')[0]}
Recurring bills detected: ${JSON.stringify(recurringList)}`;

    const raw = await callGemini(prompt);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.insights?.length) {
        for (const insight of parsed.insights) {
          recs.push({
            title:           `[Gemini] ${insight.title}`,
            description:     insight.description,
            priority:        insight.priority || 'low',
            potential_value: insight.amount || null,
          });
        }
        console.log(`Gemini bill reminder agent: ${parsed.insights.length} AI insights added`);
      }
    }
  } catch (err) {
    console.warn('Gemini bill reminder agent failed, using rule-based only:', err.message);
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

  return { recommendations: recs.length, recurringBillsDetected: Object.keys(byMerchant).length };
};

module.exports = { runBillReminderAgent };