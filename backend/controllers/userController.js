const bcrypt   = require('bcryptjs');
const { pool } = require('../config/db');

const getProfile = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, cif_number, account_number, first_name, last_name, email, phone, pan_number, date_of_birth, branch, ifsc_code, city, credit_score, risk_profile, ai_plan, kyc_verified, last_login FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

const updateProfile = async (req, res, next) => {
  try {
    const { first_name, last_name, city, branch, risk_profile } = req.body;
    await pool.query(
      'UPDATE users SET first_name=?, last_name=?, city=?, branch=?, risk_profile=? WHERE id=?',
      [first_name, last_name, city, branch, risk_profile, req.user.id]
    );
    res.json({ success: true, message: 'Profile updated' });
  } catch (err) { next(err); }
};

const changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const [rows] = await pool.query('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    const match  = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!match) return res.status(400).json({ success: false, message: 'Current password is incorrect' });

    const hash = await bcrypt.hash(new_password, 10);
    await pool.query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.user.id]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) { next(err); }
};

module.exports = { getProfile, updateProfile, changePassword };