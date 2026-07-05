const { pool } = require('../config/db');

const submitFeedback = async (req, res, next) => {
  try {
    const { recommendation_id, helpfulness_rating, accuracy_rating, comment, agent_type } = req.body;
    const [result] = await pool.query(
      `INSERT INTO feedback (user_id, recommendation_id, helpfulness_rating, accuracy_rating, comment, agent_type)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.id, recommendation_id || null, helpfulness_rating, accuracy_rating, comment, agent_type]
    );
    res.status(201).json({ success: true, id: result.insertId, message: 'Feedback recorded — agents will improve!' });
  } catch (err) { next(err); }
};

const getAgentAccuracy = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT agent_type,
              ROUND(AVG(accuracy_rating) * 20, 1)      AS accuracy_pct,
              ROUND(AVG(helpfulness_rating) * 20, 1)   AS helpfulness_pct,
              COUNT(*) AS total_responses
       FROM feedback
       WHERE user_id = ?
       GROUP BY agent_type`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

module.exports = { submitFeedback, getAgentAccuracy };