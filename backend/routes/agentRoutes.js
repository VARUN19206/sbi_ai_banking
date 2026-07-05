const express = require('express');
const { pool } = require('../config/db');
const { protect } = require('../middleware/authMiddleware');
const { runAllAgents } = require('../services/aiAgentService');
const router = express.Router();
router.use(protect);
router.get('/status', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT agent_type, status, txns_analysed, started_at, completed_at FROM agent_runs WHERE user_id = ? ORDER BY started_at DESC LIMIT 10',
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});
router.post('/run', async (req, res, next) => {
  try {
    const results = await runAllAgents(req.user.id);
    res.json({ success: true, results });
  } catch (err) { next(err); }
});
module.exports = router;