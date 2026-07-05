const { verifyToken } = require('../utils/jwtToken');
const { pool }        = require('../config/db');

const protect = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'No token provided' });
  const token   = header.split(' ')[1];
  const payload = verifyToken(token);
  if (!payload)
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  try {
    const [rows] = await pool.query(
      'SELECT id, first_name, last_name, email, is_active FROM users WHERE id = ?',
      [payload.id]
    );
    if (!rows.length || !rows[0].is_active)
      return res.status(401).json({ success: false, message: 'User not found or deactivated' });
    req.user = rows[0];
    next();
  } catch (err) { next(err); }
};

module.exports = { protect };