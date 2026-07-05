const express  = require('express');
const cors     = require('cors');
const morgan   = require('morgan');
const dotenv   = require('dotenv');
const { testConnection } = require('./config/db');

dotenv.config();

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',            require('./routes/authRoutes'));
app.use('/api/users',           require('./routes/userRoutes'));
app.use('/api/transactions',    require('./routes/transactionRoutes'));
app.use('/api/recommendations', require('./routes/recommendationRoutes'));
app.use('/api/notifications',   require('./routes/notificationRoutes'));
app.use('/api/feedback',        require('./routes/feedbackRoutes'));
app.use('/api/agents',          require('./routes/agentRoutes'));

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'SBI AI Banking Assistant API', version: '1.0.0' });
});

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(require('./middleware/errorMiddleware'));

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\n🚀  SBI AI Banking Server running on http://localhost:${PORT}`);
  console.log(`📌  Environment : ${process.env.NODE_ENV || 'development'}`);
  await testConnection();
});

module.exports = app;