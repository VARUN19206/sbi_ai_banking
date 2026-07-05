const { pool } = require('../config/db');

const getNotifications = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.id]
    );
    const [[{ unread }]] = await pool.query(
      'SELECT COUNT(*) AS unread FROM notifications WHERE user_id = ? AND is_read = 0',
      [req.user.id]
    );
    res.json({ success: true, data: rows, unread });
  } catch (err) { next(err); }
};

const markAllRead = async (req, res, next) => {
  try {
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [req.user.id]);
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (err) { next(err); }
};

const markOneRead = async (req, res, next) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
};

// Used internally by agents
const createNotification = async (userId, { type, agent_source, title, body }) => {
  const [r] = await pool.query(
    'INSERT INTO notifications (user_id, type, agent_source, title, body) VALUES (?, ?, ?, ?, ?)',
    [userId, type || 'info', agent_source, title, body]
  );
  return r.insertId;
};

module.exports = { getNotifications, markAllRead, markOneRead, createNotification };