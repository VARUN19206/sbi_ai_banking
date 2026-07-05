/**
 * Centralised error handler — must be registered last in server.js.
 */
const errorMiddleware = (err, req, res, _next) => {
  console.error('[ ERROR ]', err.message);

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ success: false, message: 'A record with that value already exists.' });
  }

  const status  = err.statusCode || 500;
  const message = err.message    || 'Internal server error';
  res.status(status).json({ success: false, message });
};

module.exports = errorMiddleware;