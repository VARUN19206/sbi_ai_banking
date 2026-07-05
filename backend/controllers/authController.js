const bcrypt            = require('bcryptjs');
const { pool }          = require('../config/db');
const { generateToken } = require('../utils/jwtToken');
const { sendOTPEmail }  = require('../utils/emailSender');

const otpStore = new Map();

const register = async (req, res, next) => {
  try {
    const { cif_number, account_number, first_name, last_name, email, phone, password, pan_number, date_of_birth, branch, ifsc_code, city, risk_profile } = req.body;
    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      `INSERT INTO users (cif_number, account_number, first_name, last_name, email, phone, password_hash, pan_number, date_of_birth, branch, ifsc_code, city, risk_profile) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [cif_number, account_number, first_name, last_name, email, phone, password_hash, pan_number, date_of_birth, branch, ifsc_code, city, risk_profile || 'moderate']
    );
    const token = generateToken(result.insertId);
    res.status(201).json({ success: true, message: 'Account created successfully', token, user: { id: result.insertId, first_name, last_name, email } });
  } catch (err) { next(err); }
};

const login = async (req, res, next) => {
  try {
    const { cif_number, password } = req.body;
    const [rows] = await pool.query('SELECT * FROM users WHERE cif_number = ? AND is_active = 1', [cif_number]);
    if (!rows.length) return res.status(401).json({ success: false, message: 'Invalid CIF number or password' });
    const user  = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ success: false, message: 'Invalid CIF number or password' });
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
    const token = generateToken(user.id);
    res.json({ success: true, token, user: { id: user.id, first_name: user.first_name, last_name: user.last_name, email: user.email, risk_profile: user.risk_profile, ai_plan: user.ai_plan } });
  } catch (err) { next(err); }
};

const sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;
    const [rows] = await pool.query('SELECT id, first_name FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(404).json({ success: false, message: 'Email not found' });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    otpStore.set(email, { otp, expires: Date.now() + 10 * 60 * 1000 });
    await sendOTPEmail(email, otp, rows[0].first_name);
    res.json({ success: true, message: 'OTP sent to registered email' });
  } catch (err) { next(err); }
};

const verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    const record = otpStore.get(email);
    if (!record || record.otp !== otp || Date.now() > record.expires)
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    otpStore.delete(email);
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    const token  = generateToken(rows[0].id);
    res.json({ success: true, token, user: rows[0] });
  } catch (err) { next(err); }
};

const getMe = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, cif_number, account_number, first_name, last_name, email, phone, pan_number, date_of_birth, branch, ifsc_code, city, credit_score, risk_profile, ai_plan, kyc_verified, last_login, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    res.json({ success: true, user: rows[0] });
  } catch (err) { next(err); }
};

module.exports = { register, login, sendOTP, verifyOTP, getMe };