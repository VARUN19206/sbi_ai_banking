const mysql  = require('mysql2/promise');
require('dotenv').config();

// ── Create pool immediately — no async init needed ──────────────────────────
const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               process.env.DB_PORT     || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || 'Varun@123',
  database:           process.env.DB_NAME     || 'sbi_ai_banking',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  decimalNumbers:     true,
  timezone:           '+05:30',
});

// ── Test connection — called from server.js on startup ───────────────────────
const testConnection = async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅  MySQL connected → database:', process.env.DB_NAME || 'sbi_ai_banking');
    conn.release();
  } catch (err) {
    console.error('❌  MySQL connection failed:', err.message);
    console.log('   Check DB_HOST, DB_USER, DB_PASSWORD, DB_NAME in .env');
    process.exit(1);
  }
};

module.exports = { pool, testConnection };