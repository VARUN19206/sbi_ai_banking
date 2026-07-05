const { pool } = require('../config/db');

// ─── List transactions (paginated, filterable) ────────────────────────────────
const getTransactions = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, category, type, from, to, search } = req.query;
    const offset = (page - 1) * limit;
    const params = [req.user.id];
    let where = 'WHERE user_id = ?';

    if (category) { where += ' AND category = ?';           params.push(category); }
    if (type)     { where += ' AND type = ?';               params.push(type); }
    if (from)     { where += ' AND txn_date >= ?';          params.push(from); }
    if (to)       { where += ' AND txn_date <= ?';          params.push(to); }
    if (search)   { where += ' AND description LIKE ?';     params.push(`%${search}%`); }

    const [rows]  = await pool.query(
      `SELECT * FROM transactions ${where} ORDER BY txn_date DESC LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );
    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM transactions ${where}`, params
    );

    res.json({ success: true, data: rows, pagination: { total, page: +page, limit: +limit, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

// ─── Single transaction ───────────────────────────────────────────────────────
const getTransaction = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'Transaction not found' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

// ─── Monthly summary ──────────────────────────────────────────────────────────
const getMonthlySummary = async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      `SELECT
         DATE_FORMAT(txn_date,'%Y-%m') AS month,
         SUM(CASE WHEN type='credit' THEN amount ELSE 0 END) AS total_income,
         SUM(CASE WHEN type='debit'  THEN amount ELSE 0 END) AS total_expense,
         COUNT(*) AS txn_count
       FROM transactions
       WHERE user_id = ? AND txn_date >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
       GROUP BY month
       ORDER BY month ASC`,
      [req.user.id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// ─── Category breakdown ───────────────────────────────────────────────────────
const getCategoryBreakdown = async (req, res, next) => {
  try {
    const { month } = req.query;
    const filter = month ? 'AND DATE_FORMAT(txn_date,\'%Y-%m\') = ?' : 'AND txn_date >= DATE_SUB(NOW(),INTERVAL 1 MONTH)';
    const params = month ? [req.user.id, month] : [req.user.id];

    const [rows] = await pool.query(
      `SELECT category,
              SUM(amount) AS total,
              COUNT(*) AS count
       FROM transactions
       WHERE user_id = ? AND type = 'debit' ${filter}
       GROUP BY category ORDER BY total DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// ─── Add transaction (internal / seed) ───────────────────────────────────────
const addTransaction = async (req, res, next) => {
  try {
    const {
      reference_no, description, amount, type,
      category, merchant, balance_after, txn_date
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO transactions
         (user_id, reference_no, description, amount, type, category, merchant, balance_after, txn_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [req.user.id, reference_no, description, amount, type,
       category || 'other', merchant, balance_after, txn_date || new Date()]
    );
    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) { next(err); }
};

module.exports = { getTransactions, getTransaction, getMonthlySummary, getCategoryBreakdown, addTransaction };