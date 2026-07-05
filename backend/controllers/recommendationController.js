const { pool }           = require('../config/db');
const { runAllAgents }   = require('../services/aiAgentService');

// ─── List recommendations ─────────────────────────────────────────────────────
const getRecommendations = async (req, res, next) => {
  try {
    const { agent_type, priority } = req.query;
    let where = 'WHERE user_id = ? AND is_dismissed = 0';
    const params = [req.user.id];

    if (agent_type) { where += ' AND agent_type = ?'; params.push(agent_type); }
    if (priority)   { where += ' AND priority = ?';   params.push(priority); }

    const [rows] = await pool.query(
      `SELECT * FROM recommendations ${where} ORDER BY FIELD(priority,'urgent','high','medium','low'), created_at DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// ─── Mark read ────────────────────────────────────────────────────────────────
const markRead = async (req, res, next) => {
  try {
    await pool.query(
      'UPDATE recommendations SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: 'Marked as read' });
  } catch (err) { next(err); }
};

// ─── Dismiss ──────────────────────────────────────────────────────────────────
const dismiss = async (req, res, next) => {
  try {
    await pool.query(
      'UPDATE recommendations SET is_dismissed = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: 'Dismissed' });
  } catch (err) { next(err); }
};

// ─── Trigger agent run manually ───────────────────────────────────────────────
const triggerAgentRun = async (req, res, next) => {
  try {
    const results = await runAllAgents(req.user.id);
    res.json({ success: true, message: 'Agent run complete', results });
  } catch (err) { next(err); }
};

module.exports = { getRecommendations, markRead, dismiss, triggerAgentRun };